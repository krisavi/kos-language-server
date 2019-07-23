import { ArgumentType } from '../types';
import { createStructureType } from "../../typeCreators";
import { addPrototype } from '../../typeUtilities';
import { connectionType } from './connection';

export const controlConnectionType: ArgumentType = createStructureType('controlConnection');
addPrototype(controlConnectionType, connectionType);
