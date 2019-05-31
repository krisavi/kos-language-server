import { ArgumentType } from '../types';
import { createStructureType } from "../../typeCreators";
import { addPrototype } from '../../typeUitlities';
import { connectionType } from './connection';

export const vesselConnectionType: ArgumentType = createStructureType('vesselConnection');
addPrototype(vesselConnectionType, connectionType);
