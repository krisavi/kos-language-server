import { IFunctionScanResult } from './types';
import * as Decl from '../parser/models/declare';
import * as Expr from '../parser/models/expr';
import * as Stmt from '../parser/models/stmt';
import { TreeTraverse } from '../utilities/treeTraverse';

/**
 * Class to help identify parameters and return statements in
 * a kerboscript function
 */
export class FunctionScan extends TreeTraverse {
  /**
   * result of the scan
   */
  private result: IFunctionScanResult;

  /**
   * Function scan constructor
   */
  constructor() {
    super();
    this.result = {
      requiredParameters: [],
      optionalParameters: [],
      return: undefined,
    };
  }

  /**
   * Scan the function node for parameters and return statements
   * @param node function body
   */
  public scan(node: Stmt.Block): IFunctionScanResult {
    this.result = {
      requiredParameters: [],
      optionalParameters: [],
      return: undefined,
    };

    this.stmtAction(node);

    return { ...this.result };
  }

  /**
   * Indicate that the function has a return statement
   * @param _ return statement
   */
  public visitReturn(_: Stmt.Return): void { 
    if (_.value && (Expr.validExpressions.some(cls => _.value instanceof cls))) {
      this.result.return = _.value
    }
    else if (_.value) {
      this.result.return = _.value
    }
    else {
      this.result.return = undefined;
    }
  }

  /**
   * Don't proceed further in if enter another function
   * @param _ function declaration
   */
  public visitDeclFunction(_: Decl.Func): void {}

  /**
   * Add required and optional parameters when found
   * @param decl parameter declaration
   */
  public visitDeclParameter(decl: Decl.Param): void {
    this.result.requiredParameters.push.apply(this.result.requiredParameters, decl.requiredParameters);
    this.result.optionalParameters.push.apply(this.result.optionalParameters, decl.optionalParameters);
  }

  /**
   * Don't proceed further if another lambda is encountered
   * @param expr lambda expression
   */
  public visitLambda(_: Expr.Lambda): void {}
}
