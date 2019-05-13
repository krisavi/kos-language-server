import { IScopeNode,
  KsSymbol, GraphNode, IKsSymbolTracker,
} from './types';
import { Position } from 'vscode-languageserver';
import { rangeContainsPos } from '../utilities/positionUtils';
import { mockLogger } from '../utilities/logger';
import { empty } from '../utilities/typeGuards';
import { KsFunction } from '../entities/function';
import { KsLock } from '../entities/lock';
import { KsVariable } from '../entities/variable';
import { KsParameter } from '../entities/parameters';
import { isKsFunction, isKsLock, isKsVariable, isKsParameter } from '../entities/entityHelpers';
import { ScopeKind } from '../parser/types';

/**
 * The Symbol table is used to update and retreive symbol type infromation
 */
export class SymbolTable implements GraphNode<SymbolTable> {

  /**
   * The root scope of this files symbol table
   */
  public readonly rootScope: IScopeNode;

  /**
   * The parent symbol tables to this symbol table
   */
  public readonly parentSymbolTables: Set<SymbolTable>;

  /**
   * the child symbol tables to this symbol table
   */
  public readonly childSymbolTables: Set<SymbolTable>;

  /**
   * file uri for this symbol table
   */
  public readonly uri: string;

  /**
   * the symbol table logger
   */
  public readonly logger: ILogger;

  /**
   * construct a symbol table. typically this is done by the symbol table builder
   * @param rootScope the root scope of the symbol table
   * @param childSymbolTables child scopes for this symbol table
   * @param uri the file uri for this symbol table
   * @param logger a logger for the symbol table
   */
  constructor(
    rootScope: IScopeNode,
    childSymbolTables: Set<SymbolTable>,
    uri: string,
    logger: ILogger = mockLogger) {

    this.rootScope = rootScope;
    this.childSymbolTables = childSymbolTables;
    this.uri = uri;
    this.logger = logger;

    this.parentSymbolTables = new Set();

    for (const symbolTable of childSymbolTables) {
      symbolTable.parentSymbolTables.add(this);
    }
  }

  /**
   * return itself for the graph interface
   */
  public get value(): SymbolTable {
    return this;
  }

  /**
   * get all adjacent nodes to this symbol table
   */
  public get adjacentNodes(): GraphNode<SymbolTable>[] {
    return Array.from(this.childSymbolTables);
  }

  /**
   * add a new child symbol table to this symbol table
   * @param symbolTable the new child
   */
  public addScope(symbolTable: SymbolTable): void {
    this.childSymbolTables.add(symbolTable);
    symbolTable.parentSymbolTables.add(this);
  }

  /**
   * should be called when the associated file is closed. It will remove it's reference
   * if another symbol table doesn't reference it
   */
  public closeSelf(): void {
    // remove childern if no parents
    if (this.parentSymbolTables.size === 0) {
      // remove references from child scopes
      for (const child of this.childSymbolTables) {
        child.parentSymbolTables.delete(this);
      }

      // clear own references
      this.childSymbolTables.clear();
    }
  }

  /**
   * This should be called when the associated symbol table is to be deleted
   */
  public removeSelf(): void {
    // remove refernces from parent scopes
    for (const parent of this.parentSymbolTables) {
      parent.childSymbolTables.delete(this);
    }

    // remove references from child scopes
    for (const child of this.childSymbolTables) {
      child.parentSymbolTables.delete(this);
    }

    // clear own references
    this.childSymbolTables.clear();
    this.parentSymbolTables.clear();
  }

  /**
   * get every symbol in the file
   */
  public fileSymbols(): KsSymbol[] {
    return Array.from(this.rootScope.scope.symbols()).concat(
      this.fileSymbolsDepth(this.rootScope.children));
  }

  /**
   * Get global symbols that match the requested symbol name
   * @param name symbol name
   */
  public globalTrackers(name: string): IKsSymbolTracker[] {
    return Array.from(this.rootScope.scope.values())
      .filter(tracker => tracker.declared.symbol.name.lookup === name);
  }

  /**
   * Get the tracker for a function symbol
   * @param pos position of symbol
   * @param name name of the symbol
   */
  public scopedFunctionTracker(pos: Position, name: string): Maybe<IKsSymbolTracker<KsFunction>> {
    const tracker = this.scopedNamedTracker(
      pos, name, tracker => isKsFunction(tracker.declared.symbol));

    if (!empty(tracker)) {
      return tracker as IKsSymbolTracker<KsFunction>;
    }

    return undefined;
  }

  /**
   * Get the tracker for a lock symbol
   * @param pos position of symbol
   * @param name name of the symbol
   */
  public scopedLockTracker(pos: Position, name: string): Maybe<IKsSymbolTracker<KsLock>> {
    const tracker = this.scopedNamedTracker(
      pos, name, trackers => isKsLock(trackers.declared.symbol));

    if (!empty(tracker)) {
      return tracker as IKsSymbolTracker<KsLock>;
    }

    return undefined;
  }

  /**
   * Get the tracker for a variable symbol
   * @param pos position of the symbol
   * @param name name of the symbol
   */
  public scopedVariableTracker(pos: Position, name: string): Maybe<IKsSymbolTracker<KsVariable>> {
    const tracker = this.scopedNamedTracker(
      pos, name, trackers => isKsVariable(trackers.declared.symbol));

    if (!empty(tracker)) {
      return tracker as IKsSymbolTracker<KsVariable>;
    }

    return undefined;
  }

  /**
   * Get the tracker for a parameter symbol
   * @param pos position of the symbol
   * @param name name of the symbol
   */
  public scopedParameterTracker(pos: Position, name: string): Maybe<IKsSymbolTracker<KsParameter>> {
    const tracker = this.scopedNamedTracker(
      pos, name, tracker => isKsParameter(tracker.declared.symbol));

    if (!empty(tracker)) {
      return tracker as IKsSymbolTracker<KsParameter>;
    }

    return undefined;
  }

  /**
   * Get all symbols available at the provide position
   * @param pos position to check
   */
  public scopedSymbols(pos: Position): KsSymbol[] {
    return this.scopedTrackers(pos)
      .map(tracker => tracker.declared.symbol);
  }

  /**
   * Get a tracker for a given symbol under a filter condition and position
   * @param pos position to check
   * @param name name of the symbol
   * @param symbolFilter filter function for the symbol
   */
  public scopedNamedTracker(
    pos: Position,
    name: string,
    symbolFilter?: (x: IKsSymbolTracker) => boolean): Maybe<IKsSymbolTracker> {

    // our base filter is to match the symbol lexeme
    const baseFilter = (trackers: IKsSymbolTracker) =>
      trackers.declared.symbol.name.lookup === name;

    // our compound filter checkes for any and the other requested filtering operations
    const compoundFilter = empty(symbolFilter)
      ? baseFilter
      : (trackers: IKsSymbolTracker) => baseFilter(trackers) && symbolFilter(trackers);

    return this.scopedTracker(pos, compoundFilter);
  }

  /**
   * recursively move up the scope to get every file symbol
   * @param nodes nodes to retrive symbols from
   */
  private fileSymbolsDepth(nodes: IScopeNode[]): KsSymbol[] {
    return ([] as KsSymbol[]).concat(...nodes.map(node =>
        Array.from(node.scope.symbols()).concat(this.fileSymbolsDepth(node.children))));
  }

  /**
   * get all symbol trackers in scope at a positition
   * @param pos the position to retrive symbols from
   */
  private scopedTrackers(pos: Position): IKsSymbolTracker[] {
    const scoped = this.scopedTrackersDepth(pos, this.rootScope.children);
    const fileGlobal = Array.from(this.rootScope.scope.values());
    const importedGlobals = Array.from(this.childSymbolTables.values())
      .map(scope => Array.from(scope.rootScope.scope.values()));

    return scoped.concat(
      fileGlobal,
      ...importedGlobals);
  }

  /**
   * get a symbol tracker under the conditions of a provided filter
   * @param pos the posiition to check for symbols
   * @param trackerFilter the tracker filter
   */
  private scopedTracker(
    pos: Position,
    trackerFilter: (x: IKsSymbolTracker) => boolean = _ => true): Maybe<IKsSymbolTracker> {

    const scoped = this.scopedTrackerDepth(pos, this.rootScope.children, trackerFilter);
    if (!empty(scoped)) {
      return scoped;
    }

    const fileGlobal = Array.from(this.rootScope.scope.values());
    const importedGlobals = Array.from(this.childSymbolTables.values())
      .map(scope => Array.from(scope.rootScope.scope.values()));

    const [match] = fileGlobal.concat(...importedGlobals)
      .filter(trackerFilter);

    return match;
  }

  /**
   * recursively move up scopes to find most relevant symbols
   * @param pos position to search
   * @param nodes scope nodes to check
   */
  private scopedTrackersDepth(
    pos: Position,
    nodes: IScopeNode[]) : IKsSymbolTracker[] {

    for (const node of nodes) {
      const { position } = node;
      switch (position.kind) {
        // if global it is available
        case ScopeKind.global:
          return this.scopedTrackersDepth(pos, node.children)
            .concat(Array.from(node.scope.values()));
        // if the scope has a real position check if we're in the bounds
        case ScopeKind.local:
          if (rangeContainsPos(position, pos)) {
            return this.scopedTrackersDepth(pos, node.children)
              .concat(Array.from(node.scope.values()));
          }
          break;
      }
    }

    return [];
  }

  /**
   * recursively move up scope for more relevant symbols
   * @param pos position to search
   * @param nodes scope nodes to check
   * @param trackerFilter filter for acceptable symbols
   */
  private scopedTrackerDepth(
    pos: Position,
    nodes: IScopeNode[],
    trackerFilter: (x: IKsSymbolTracker) => boolean) : Maybe<IKsSymbolTracker> {
    let childSymbol: Maybe<IKsSymbolTracker> = undefined;

    for (const node of nodes) {
      const { position } = node;
      switch (position.kind) {
        // if global it is available
        case ScopeKind.global:
          childSymbol = this.scopedTrackerDepth(pos, node.children, trackerFilter);
          if (!empty(childSymbol)) {
            return childSymbol;
          }

          const currentSymbols = Array.from(node.scope.values()).filter(trackerFilter);
          if (currentSymbols.length === 1) {
            return currentSymbols[0];
          }
          break;
        // if the scope has a real position check if we're in the bounds
        case ScopeKind.local:
          if (rangeContainsPos(position, pos)) {
            childSymbol = this.scopedTrackerDepth(pos, node.children, trackerFilter);
            if (!empty(childSymbol)) {
              return childSymbol;
            }

            const currentSymbols = Array.from(node.scope.values()).filter(trackerFilter);
            if (currentSymbols.length === 1) {
              return currentSymbols[0];
            }
          }
          break;
      }
    }

    return undefined;
  }
}
