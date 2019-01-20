import { IType } from './types';
import { createStructureType, createArgSuffixType } from './ksType';
import { structureType } from './structure';
import { addPrototype, addSuffixes } from './typeUitlities';
import { voidType } from './void';

// ---------- base of all primitive types --------------
export const primitiveType: IType = createStructureType('primitive');
addPrototype(primitiveType, structureType);

// ---------- base of number types ---------------------
export const scalarType: IType = createStructureType('scalar');
addPrototype(scalarType, primitiveType);

export const integarType: IType = createStructureType('int');
addPrototype(integarType, scalarType);

export const doubleType: IType = createStructureType('double');
addPrototype(doubleType, scalarType);

// ---------- base of boolean types --------------------
export const booleanType: IType = createStructureType('boolean');
addPrototype(booleanType, primitiveType);

// ---------- base of string types ---------------------
export const stringType: IType = createStructureType('string');
addPrototype(stringType, primitiveType);

addSuffixes(
  stringType,
  createArgSuffixType('length', scalarType),
  createArgSuffixType('substring', stringType, scalarType, scalarType),
  createArgSuffixType('contains', booleanType, stringType),
  createArgSuffixType('endswith', booleanType, stringType),
  createArgSuffixType('findat', scalarType, stringType, scalarType),
  createArgSuffixType('insert', stringType, scalarType, stringType),
  createArgSuffixType('findlastat', scalarType, stringType, scalarType),
  createArgSuffixType('padleft', stringType, scalarType),
  createArgSuffixType('padright', stringType, scalarType),
  createArgSuffixType('remove', stringType, scalarType, scalarType),
  createArgSuffixType('replace', stringType, stringType, stringType),
  createArgSuffixType('split', voidType, stringType),
  createArgSuffixType('startswith', booleanType, stringType),
  createArgSuffixType('tolower', stringType),
  createArgSuffixType('toupper', stringType),
  createArgSuffixType('trim', stringType),
  createArgSuffixType('trimend', stringType),
  createArgSuffixType('trimstart', stringType),
  createArgSuffixType('matchespattern', booleanType, stringType),
  createArgSuffixType('tonumber', scalarType, structureType),
  createArgSuffixType('toscalar', scalarType, structureType),
  createArgSuffixType('format', stringType, structureType),
);
