import { IType } from './types';
import { createStructureType, createSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './structure';
import { scalarType } from './primitives';
import { vectorType } from './collections/vector';

export const vesselSensorsType: IType = createStructureType('vesselSensors');
addPrototype(vesselSensorsType, structureType);

addSuffixes(
  vesselSensorsType,
  createSuffixType('acc', vectorType),
  createSuffixType('pres', scalarType),
  createSuffixType('temp', scalarType),
  createSuffixType('grav', vectorType),
  createSuffixType('light', scalarType),
);
