import { ScopeKind, IExpr } from '../parser/types';
import { KsSymbolKind } from '../analysis/types';
import { Token } from './token';
import { Parameter, DefaultParam } from '../parser/models/declare';

/**
 * A class containing the information of a function
 */
export class KsFunction {
  /**
   * A kerboscript function constructor
   * @param scope the scope of this variable
   * @param name the name of this variable
   * @param requiredParameters the number of required parameters
   * @param optionalParameters the number of optional parameters
   * @param returnValue does the function return a value
   */
  constructor(
    public readonly scope: ScopeKind,
    public readonly name: Token,
    public readonly requiredParameters: Parameter[],
    public readonly optionalParameters: DefaultParam[],
    public readonly returnValue?: IExpr,
  ) {
  }

  /**
   * What kind of symbol is represented in this case a parameter
   */
  get tag(): KsSymbolKind.function {
    return KsSymbolKind.function;
  }
}
