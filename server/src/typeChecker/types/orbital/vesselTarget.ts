import { IType } from '../types';
import { createStructureType, createArgSuffixType, createSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { booleanType, stringType, scalarType } from '../primitives';
import { orbitableType } from './orbitable';
import { listType, userListType } from '../collections/list';
import { vectorType } from '../collections/vector';
import { directionType } from '../direction';
import { voidType } from '../void';
import { uniqueSetType } from '../collections/uniqueset';

export const vesselTargetType: IType = createStructureType('vesselTarget');
addPrototype(vesselTargetType, orbitableType);

addSuffixes(
  vesselTargetType,
  createArgSuffixType('partsNamed', userListType, stringType),
  createArgSuffixType('partsNamedPattern', userListType, stringType),
  createArgSuffixType('partsTitled', userListType, stringType),
  createArgSuffixType('partsTitledPattern', userListType, stringType),
  createArgSuffixType('partsDubbed', userListType, stringType),
  createArgSuffixType('partsDubbedPattern', userListType, stringType),
  createArgSuffixType('modulesNamed', userListType, stringType),
  createArgSuffixType('partsInGroup', userListType, stringType),
  createArgSuffixType('modulesInGroup', userListType, stringType),
  createArgSuffixType('partStagged', userListType, stringType),
  createArgSuffixType('partStaggedPattern', userListType, stringType),
  createArgSuffixType('allTaggedParts', userListType),
  createArgSuffixType('parts', listType.toConcreteType(scalarType)), /* TODO */
  createArgSuffixType('dockingPorts', listType.toConcreteType(scalarType)), /* TODO */
  createArgSuffixType('decouplers', listType.toConcreteType(scalarType)), /* TODO */
  createArgSuffixType('separators', listType.toConcreteType(scalarType)), /* TODO */
  createArgSuffixType('elements', userListType),
  createSuffixType('control', /* TODO */ scalarType),
  createSuffixType('bearing', scalarType),
  createSuffixType('heading', scalarType),
  createSuffixType('availableThrust', scalarType),
  createArgSuffixType('availableThrustAt', scalarType, scalarType),
  createSuffixType('maxThrust', scalarType),
  createArgSuffixType('maxThrustAt', scalarType, scalarType),
  createSuffixType('facing', directionType),
  createSuffixType('angularMomentum', vectorType),
  createSuffixType('angularVel', vectorType),
  createSuffixType('mass', scalarType),
  createSuffixType('verticalSpeed', scalarType),
  createSuffixType('groundSpeed', scalarType),
  createSuffixType('airSpeed', scalarType),
  createSuffixType('shipName', stringType),
  createSuffixType('name', stringType),
  createSuffixType('type', stringType),
  createSuffixType('sensors', /* TODO */ scalarType),
  createSuffixType('termVelocity', scalarType),
  createSuffixType('dynamicPressure', scalarType),
  createSuffixType('q', scalarType),
  createSuffixType('loaded', booleanType),
  createSuffixType('unpacked', booleanType),
  createSuffixType('rootPart', /* TODO */ scalarType),
  createSuffixType('controlPart',  /* TODO */ scalarType),
  createSuffixType('dryMass', scalarType),
  createSuffixType('wetMass', scalarType),
  createSuffixType('resources', listType.toConcreteType(scalarType)), /* TODO */
  createSuffixType('loadDistance', /* TODO */ scalarType),
  createArgSuffixType('isDead', booleanType),
  createSuffixType('status', stringType),
  createSuffixType('latitude', scalarType),
  createSuffixType('longitude', scalarType),
  createSuffixType('altitude', scalarType),
  createSuffixType('crew', userListType),
  createSuffixType('crewCapacity', scalarType),
  createSuffixType('connection', /* TODO */ scalarType),
  createSuffixType('messages', /* TODO */ scalarType),
  createArgSuffixType('startTracking', voidType),
  createArgSuffixType('soiChangeWatchers', uniqueSetType.toConcreteType(scalarType)), /* TODO */
);
