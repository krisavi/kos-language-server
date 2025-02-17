import {
  IParametricType,
  Access,
  TypeKind,
  TypeMap,
  IParametricCallSignature,
  OperatorKind,
  IType,
  IParametricIndexer,
  ITypeMappable,
} from '../../types';
import { Operator } from '../types/operator';
import { TypeBinder } from '../../binders/typeBinder';
import { empty } from '../../../utilities/typeGuards';

/**
 * A class representing a parametric type in Kerboscript
 */
export class ParametricType implements IParametricType {
  /**
   * What is the name of this parametric type
   */
  public readonly name: string;

  /**
   * What is the access of this type
   */
  public readonly access: Access;

  /**
   * What is the kind of this type
   */
  public readonly kind: TypeKind;

  /**
   * Is this the any type
   */
  public readonly anyType: boolean;

  /**
   * What is the call signature of this type
   */
  protected typeCallSignature?: TypeMap<IParametricCallSignature>;

  /**
   * What is the super type of this type
   */
  protected superType?: TypeMap<IParametricType>;

  /**
   * What is the indexer of this type
   */
  protected indexSignature?: TypeMap<IParametricIndexer>;

  /**
   * What are the suffixes of this type
   */
  protected suffixMap: Map<string, TypeMap<IParametricType>>;

  /**
   * What are the operators of this type
   */
  protected operatorMap: Map<OperatorKind, Operator<IParametricType>[]>;

  /**
   * The type binder
   */
  protected binder: TypeBinder;

  /**
   * What are the coercible type
   */
  protected coercibleTypes: Set<IParametricType>;

  /**
   * Construct a new parametric type
   * @param name name of this type
   * @param access what is the access of this type
   * @param typeParameters what type parameters are present in type
   * @param kind the type kind
   */
  constructor(
    name: string,
    access: Access,
    typeParameters: string[],
    kind: TypeKind,
  ) {
    this.name = name;
    this.access = access;
    this.kind = kind;
    this.anyType = false;
    this.binder = new TypeBinder(typeParameters);

    this.superType = undefined;
    this.indexSignature = undefined;
    this.suffixMap = new Map();
    this.coercibleTypes = new Set();
    this.operatorMap = new Map();
  }

  /**
   * Add a call signature to this type
   * @param callSignature call signature
   */
  public addCallSignature(callSignature: TypeMap<IParametricCallSignature>) {
    this.checkMapping(callSignature);
    this.typeCallSignature = callSignature;
  }

  /**
   * Add a super type to this type
   * @param type super type to add
   */
  public addSuper(type: TypeMap<IParametricType>): void {
    if (!empty(this.superType)) {
      throw new Error(`Super type for ${this.name} has already been set.`);
    }

    // check if super has type parameters
    this.checkMapping(type);
    this.superType = type;
  }

  public addIndexer(indexer: TypeMap<IParametricIndexer>): void {
    if (!empty(this.indexSignature)) {
      throw new Error(`Indexer for ${this.name} has already been set.`);
    }

    this.checkMapping(indexer);
    this.indexSignature = indexer;
  }

  /**
   * Check that the type map is applicable to this type
   * @param typeMap type map
   */
  private checkMapping(typeMap: TypeMap<ITypeMappable>): void {
    const { type, mapping } = typeMap;

    // check if super has type parameters
    if (type.getTypeParameters().length > 0) {
      const targetTypeParams = type.getTypeParameters();
      const thisTypeParams = this.getTypeParameters();

      // check length
      if (mapping.size !== targetTypeParams.length) {
        throw new Error(
          `Type has type parameters ${targetTypeParams.join(', ')}` +
            ` but was only given ${mapping.size} arguments`,
        );
      }

      // check matching
      for (const [key, value] of mapping) {
        if (!thisTypeParams.includes(key)) {
          throw new Error(
            `Type ${this.name} does not have a type parameter ${key.name}`,
          );
        }

        if (!targetTypeParams.includes(value)) {
          throw new Error(
            `Type ${type.name} does not have a type parameter ${value.name}`,
          );
        }
      }
    }
  }

  /**
   * Add coercions to this type
   * @param types coercions to add
   */
  public addCoercion(...types: IParametricType[]): void {
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
   * Add suffixes to this type
   * @param suffixes suffixes to add
   */
  public addSuffixes(...suffixes: TypeMap<IParametricType>[]): void {
    for (const suffix of suffixes) {
      if (this.suffixMap.has(suffix.type.name)) {
        throw new Error(
          `Duplicate suffix of ${suffix.type.name} added to ${this.name}`,
        );
      }

      // check mapping
      this.checkMapping(suffix);

      this.suffixMap.set(suffix.type.name, suffix);
    }
  }

  /**
   * Add operators to this type
   * @param operators operators to add
   */
  public addOperators(...operators: Operator<IParametricType>[]): void {
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
   * Is this type a subtype of another type
   * @param type type to check against
   */
  public isSubtypeOf(type: IParametricType): boolean {
    if (type === this) {
      return true;
    }

    return empty(this.superType)
      ? false
      : this.superType.type.isSubtypeOf(type);
  }

  /**
   * Can this type be coerced from the provided type
   * @param type to coerce from
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
   * Get the type parameters
   */
  public getTypeParameters(): IParametricType[] {
    return [...this.binder.typeParameters];
  }

  /**
   * Get the super type of this type
   */
  public super(): IParametricType | undefined {
    return this.superType && this.superType.type;
  }

  /**
   * Get the sub types of this type
   */
  public subTypes(): IType[] {
    return [];
  }

  /**
   * Get the call signature of this type
   */
  public callSignature(): Maybe<IParametricCallSignature> {
    return this.typeCallSignature && this.typeCallSignature.type;
  }

  /**
   * Get the indexer of this type
   */
  public indexer(): Maybe<IParametricIndexer> {
    return this.indexSignature && this.indexSignature.type;
  }

  /**
   * Get the coercions of this type
   */
  public coercions(): Set<IParametricType> {
    return this.coercibleTypes;
  }

  /**
   * Get the suffixes of this type
   */
  public suffixes(): Map<string, IParametricType> {
    const suffixes = new Map<string, IParametricType>();
    for (const [name, typeMap] of this.suffixMap) {
      suffixes.set(name, typeMap.type);
    }

    if (!empty(this.superType)) {
      for (const [name, value] of this.superType.type.suffixes()) {
        suffixes.set(name, value);
      }
    }

    return suffixes;
  }

  /**
   * Get an operator for the provided kind
   * @param kind operator kind
   * @param other other type if binary
   */
  public getOperator(
    kind: OperatorKind,
    other?: IParametricType,
  ): Maybe<Operator<IParametricType>> {
    const operators = this.operatorMap.get(kind);

    if (empty(operators)) {
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
   * Get all operators
   */
  public operators(): Map<OperatorKind, Operator<IParametricType>[]> {
    return this.operatorMap;
  }

  /**
   * Get a string representing of this type
   */
  public toString(): string {
    const typeParameters = this.getTypeParameters();

    const typeParameterStr =
      typeParameters.length > 0
        ? `<${typeParameters.map(t => t.toString()).join(', ')}>`
        : '';

    // no call signature just return type name
    if (empty(this.typeCallSignature)) {
      return `${this.name}${typeParameterStr}`;
    }

    // if it's gettable or settable then show return type
    if (this.access.get || this.access.set) {
      return `${typeParameterStr}${this.typeCallSignature.type
        .returns()
        .toString()}`;
    }

    // else full call signature
    return `${typeParameterStr}${this.typeCallSignature.type.toString()}`;
  }

  public apply(typeArguments: Map<IParametricType, IType> | IType): IType {
    if (typeArguments instanceof Map) {
      return this.binder.apply(
        this,
        typeArguments,
        this.suffixMap,
        this.typeCallSignature,
        this.superType,
        this.indexSignature,
      );
    }

    const typeParameters = this.getTypeParameters();
    if (typeParameters.length !== 1) {
      throw new Error(
        'Must provide a type map if more than one parameter is present.',
      );
    }
    return this.binder.apply(
      this,
      new Map([[typeParameters[0], typeArguments]]),
      this.suffixMap,
      this.typeCallSignature,
      this.superType,
      this.indexSignature,
    );
  }
}
