import { IToken } from "../scanner/types";
import { KsParameter } from "./parameters";
import { ScopeType } from "../parser/types";
import { FunctionState } from "./types";

export class KsFunction {
    public readonly requiredParameters: number;

    constructor(
        public readonly scope: ScopeType,
        public readonly name: IToken,
        public readonly parameters: KsParameter[],
        public readonly returnValue: boolean,
        public state: FunctionState
    ) 
    { 
        this.requiredParameters = parameters
            .filter(parameter => !parameter.defaulted)
            .length;
    }
 
    get tag(): 'function' {
        return 'function';
    }
}