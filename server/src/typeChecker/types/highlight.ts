import { IType } from './types';
import { createStructureType, createSetSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './structure';
import { booleanType } from './primitives';
import { rgbaType } from './rgba';

export const highlightType: IType = createStructureType('highlight');
addPrototype(highlightType, structureType);

addSuffixes(
  highlightType,
  createSetSuffixType('color', rgbaType),
  createSetSuffixType('enabled', booleanType),
);
