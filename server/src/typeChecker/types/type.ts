import {
  IType,
  Access,
  ICallSignature,
  TypeKind,
  IParametricType,
  IIndexer,
  OperatorKind,
  TypeMap,
} from '../types';
import { TypeTracker } from '../../analysis/models/typeTracker';
import { Operator } from '../models/types/operator';
import { KsGrouping } from '../../models/grouping';
import { KsSuffix } from '../../models/suffix';
import { empty } from '../../utilities/typeGuards';

/**
 * A class representing a type in Kerboscript
 */
export class Type implements IType {
  /**
   * Name of the type
   */
  public readonly name: string;

  /**
   * What is the access level of this type
   */
  public readonly access: Access;

  /**
   * What is the call signature if there is one
   */
  public readonly typeCallSignature?: ICallSignature;

  /**
   * What is the type kind
   */
  public readonly kind: TypeKind;

  /**
   * Is this type the any type
   */
  public readonly anyType: boolean;

  /**
   * The type arguments for this type if any
   */
  private readonly typeArguments: Map<IParametricType, IType>;

  /**
   * The tracker for this type. Should only occur if this is a suffix
   */
  private readonly typeTracker: TypeTracker;

  /**
   * The super type if any for this type
   */
  private superType?: IType;

  /**
   * The indexer of this type if any
   */
  private indexerSignature?: IIndexer;

  /**
   * The parametric type this type derives from
   */
  private readonly typeTemplate?: IParametricType;

  /**
   * The types that can be coerced into this type
   */
  private readonly coercibleTypes: Set<IParametricType>;

  /**
   * The suffixes on this type
   */
  private readonly suffixMap: Map<string, IType>;

  /**
   * The operators on this type
   */
  private readonly operatorMap: Map<OperatorKind, Operator<IType>[]>;

  /**
   * Construct a new kerboscript type
   * @param name name of the type
   * @param access what access does this type have
   * @param typeArguments what are the type arguments of this type
   * @param kind what is the kind of this type
   * @param callSignature what is the call signature of this type
   * @param typeTemplate what is the type template of this type
   * @param anyType is this the any type
   */
  constructor(
    name: string,
    access: Access,
    typeArguments: Map<IParametricType, IType>,
    kind: TypeKind,
    callSignature?: ICallSignature,
    typeTemplate?: IParametricType,
    anyType = false,
  ) {
    if (kind === TypeKind.variadic) {
      throw new Error('Cannot construct variadic type.');
    }

    this.name = name;
    this.access = access;
    this.typeArguments = typeArguments;
    this.kind = kind;
    this.typeCallSignature = callSignature;
    this.typeTemplate = typeTemplate;
    this.anyType = anyType;

    // TODO will need to actually be robust about this
    this.typeTracker =
      kind === TypeKind.grouping
        ? new TypeTracker(new KsGrouping(name), this)
        : new TypeTracker(new KsSuffix(name), this);

    this.coercibleTypes = new Set();
    this.suffixMap = new Map();
    this.operatorMap = new Map();
  }

  /**
   * Add a super type to this type
   * @param typeMap type map
   */
  public addSuper(typeMap: TypeMap<IType>): void {
    if (!empty(this.superType)) {
      throw new Error(`Super type for ${this.name} has already been set.`);
    }

    this.superType = typeMap.type;
  }

  /**
   * Add an indexer to this type
   * @param indexer indexer to add
   */
  public addIndexer(indexer: TypeMap<IIndexer>): void {
    if (!empty(this.indexerSignature)) {
      throw new Error(`Indexer type for ${this.name} has already been set.`);
    }

    this.indexerSignature = indexer.type;
  }

  /**
   * Add new coercions to this type
   * @param types type to new coercions
   */
  public addCoercion(...types: IType[]): void {
    for (const type of types) {
      if (this.coercibleTypes.has(type)) {
        throw new Error(
          `Coercible type ${type.name} has already been added to ${this.name}`,
        );
      }

      this.coercibleTypes.add(type);
    }
  }

  /**
   * Add new suffix to this type
   * @param suffixes suffixes to add
   */
  public addSuffixes(...suffixes: TypeMap<IType>[]): void {
    for (const { type } of suffixes) {
      if (this.suffixMap.has(type.name)) {
        throw new Error(
          `Duplicate suffix of ${type.name} added to ${this.name}`,
        );
      }

      this.suffixMap.set(type.name, type);
    }
  }

  /**
   * Add new operators to this type
   * @param operators operators to add
   */
  public addOperators(...operators: Operator<IType>[]): void {
    for (const operator of operators) {
      if (!this.operatorMap.has(operator.operator)) {
        this.operatorMap.set(operator.operator, []);
      }

      const operatorsKind = this.operatorMap.get(operator.operator);

      // should never happen
      if (empty(operatorsKind)) {
        throw new Error(
          `Operator kind ${OperatorKind[operator.operator]} not found for ${
            this.name
          }`,
        );
      }

      // check to make sure we didn't add two operators with the same
      // other operand
      for (const existingOperator of operatorsKind) {
        if (existingOperator.secondOperand === operator.secondOperand) {
          let message: string;
          const { secondOperand: otherOperand } = existingOperator;
          if (empty(otherOperand)) {
            message =
              `Operator of kind ${OperatorKind[operator.operator]}` +
              ` already exists between for ${this.name}`;
          } else {
            message =
              `Operator of kind ${
                OperatorKind[operator.operator]
              } already exists between` +
              ` ${this.name} and ${otherOperand.name}`;
          }

          throw new Error(message);
        }
      }

      operatorsKind.push(operator);
    }
  }

  /**
   * Is this type a subtype for another type
   * @param type the type check against
   */
  public isSubtypeOf(type: IParametricType): boolean {
    if (this.subtypeCheck(type)) {
      return true;
    }

    for (const subType of type.subTypes()) {
      if (this.subtypeCheck(subType)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Individual type check for sub type ness
   * @param type the type to check against
   */
  private subtypeCheck(type: IParametricType): boolean {
    if (type === this) {
      return true;
    }

    // check if super type matches provided type
    if (!empty(this.superType)) {
      const isSubtype = this.superType.isSubtypeOf(type);
      if (isSubtype) {
        return isSubtype;
      }
    }

    // check if type template matches provided type
    if (!empty(this.typeTemplate)) {
      const isSubtype = this.typeTemplate.isSubtypeOf(type);
      if (isSubtype) {
        return isSubtype;
      }
    }

    return false;
  }

  /**
   * Can this type be coerced from
   * @param type
   */
  public canCoerceFrom(type: IParametricType): boolean {
    // if type no coercion needed
    if (type === this) {
      return true;
    }

    // if any type can coerce
    if (type.anyType) {
      return true;
    }

    // Are we directly a type that can be coerced
    if (this.coercibleTypes.has(type)) {
      return true;
    }

    // if we're a subtype of this type
    if (type.isSubtypeOf(this)) {
      return true;
    }

    // Are we a subtype of one of the coercible types
    for (const coercibleType of this.coercibleTypes) {
      if (type.isSubtypeOf(coercibleType)) {
        return true;
      }
    }

    return false;
  }

  /**
   * What are the type parameters of this type
   */
  public getTypeParameters(): IParametricType[] {
    return [...this.typeArguments.keys()];
  }

  /**
   * Get the super type of this type
   */
  public super(): Maybe<IType> {
    return this.superType;
  }

  /**
   * Sub types of this type
   */
  public subTypes(): IType[] {
    return [];
  }

  /**
   * Get the call signature of this type
   */
  public callSignature(): Maybe<ICallSignature> {
    return this.typeCallSignature;
  }

  /**
   * Get the indexer of this type
   */
  public indexer(): Maybe<IIndexer> {
    if (!empty(this.indexerSignature)) {
      return this.indexerSignature;
    }

    return this.superType && this.superType.indexer();
  }

  /**
   * Get the tracker of this type
   */
  public tracker(): TypeTracker {
    return this.typeTracker;
  }

  /**
   * Get the assignment type of this type
   */
  public assignmentType(): IType {
    if (empty(this.typeCallSignature)) {
      return this;
    }

    return this.typeCallSignature.returns();
  }

  /**
   * Get all available coercions
   */
  public coercions(): Set<IParametricType> {
    return this.coercibleTypes;
  }

  /**
   * Get all available suffixes
   */
  public suffixes(): Map<string, IType> {
    const suffixes = new Map(this.suffixMap.entries());

    if (!empty(this.superType)) {
      for (const [key, value] of this.superType.suffixes()) {
        suffixes.set(key, value);
      }
    }

    return suffixes;
  }

  /**
   * Get the appropriate operator for this kind if it exists
   * @param kind the operator kind
   * @param other the other type if binary
   */
  public getOperator(
    kind: OperatorKind,
    other?: Maybe<IType>,
  ): Maybe<Operator<IType>> {
    const operators = this.operatorMap.get(kind);

    if (empty(operators)) {
      if (!empty(this.superType)) {
        return this.superType.getOperator(kind, other);
      }

      return operators;
    }

    for (const operator of operators) {
      // check if operator is unary other see if it can coerced into other operand
      if (empty(operator.secondOperand)) {
        if (empty(other)) {
          return operator;
        }
      } else if (!empty(other) && operator.secondOperand.canCoerceFrom(other)) {
        return operator;
      }
    }

    return undefined;
  }

  /**
   * Get all operators of this type
   */
  operators(): Map<OperatorKind, Operator<IType>[]> {
    return this.operatorMap;
  }

  /**
   * Get a string representation of this type
   */
  toString(): string {
    const typeParameters = this.getTypeParameters();

    let typeArgumentsStr: string;
    if (typeParameters.length === 0) {
      typeArgumentsStr = '';
    } else {
      const typeArgumentStrs: string[] = [];
      for (const typeParameter of typeParameters) {
        const typeArgument = this.typeArguments.get(typeParameter);
        if (empty(typeArgument)) {
          throw new Error(
            `Type argument not found for parameter ${typeParameter.toString()}` +
              ` for type ${this.name}`,
          );
        }

        typeArgumentStrs.push(typeArgument.toString());
      }

      typeArgumentsStr = `<${typeArgumentStrs.join(', ')}>`;
    }

    // no call signature just return type name
    if (empty(this.typeCallSignature)) {
      return `${this.name}${typeArgumentsStr}`;
    }

    // if it's gettable or settable then show return type
    if (this.access.get || this.access.set) {
      return `${typeArgumentsStr}${this.typeCallSignature
        .returns()
        .toString()}`;
    }

    return `${typeArgumentsStr}${this.typeCallSignature.toString()}`;
  }

  /**
   * Apply type arguments to this type
   * @param _ type arguments
   */
  public apply(_: Map<IType, IType> | IType): IType {
    return this;
  }
}
