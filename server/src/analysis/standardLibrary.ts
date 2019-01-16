import { ScopeManager } from './scopeManager';
import { ScopeType } from '../parser/types';
import { Token, Marker } from '../entities/token';
import { TokenType } from '../entities/tokentypes';
import { createFunctionType, createVarFunctionType } from '../typeChecker/types/functions/function';
import { scalarType, stringType, doubleType, booleanType } from '../typeChecker/types/primitives';
import { queueType } from '../typeChecker/types/collections/queue';
import { structureType } from '../typeChecker/types/structure';
import { createVarType } from '../typeChecker/types/typeUitlities';
import { userListType } from '../typeChecker/types/collections/list';
import { stackType } from '../typeChecker/types/collections/stack';
import { uniqueSetType } from '../typeChecker/types/collections/uniqueset';

export const standardLibrary = new ScopeManager();
const functionNames = [
  createFunctionType('abs', scalarType, scalarType),
  createFunctionType('add', /* TODO */ scalarType),
  createFunctionType('addAlarm', /* TODO */ scalarType),
  createFunctionType('allwaypoints', /* TODO */ scalarType),
  createFunctionType('angleaxis', /* TODO */ scalarType),
  createFunctionType('anglediff', scalarType, scalarType, scalarType),
  createFunctionType('arccos', scalarType),
  createFunctionType('arcsin', scalarType),
  createFunctionType('arctan', scalarType),
  createFunctionType('arctan2', scalarType),
  createFunctionType('body', /* TODO */ scalarType),
  createFunctionType('bodyatmosphere', /* TODO */ scalarType),
  createFunctionType('buildlist', /* TODO */ scalarType),
  createFunctionType('career', /* TODO */ scalarType),
  createFunctionType('cd', /* TODO */ scalarType),
  createFunctionType('ceiling', scalarType, scalarType),
  createFunctionType('char', stringType, scalarType),
  createFunctionType('chdir', /* TODO */ scalarType),
  createFunctionType('clearguis', /* TODO */ scalarType),
  createFunctionType('clearscreen', undefined),
  createFunctionType('clearvecdraws', /* TODO */ scalarType),
  createFunctionType('constant', /* TODO */ scalarType),
  createFunctionType('copy_deprecated', /* TODO */ scalarType),
  createFunctionType('copypath', /* TODO */ scalarType),
  createFunctionType('cos', scalarType),
  createFunctionType('create', /* TODO */ scalarType),
  createFunctionType('createdir', /* TODO */ scalarType),
  createFunctionType('debugdump', undefined),
  createFunctionType('debugfreezegame', scalarType),
  createFunctionType('delete_deprecated', /* TODO */ scalarType),
  createFunctionType('deleteAlarm', /* TODO */ scalarType),
  createFunctionType('deletepath', /* TODO */ scalarType),
  createFunctionType('edit', /* TODO */ scalarType),
  createFunctionType('exists', /* TODO */ scalarType),
  createFunctionType('floor', scalarType, scalarType),
  createFunctionType('GetVoice', /* TODO */ scalarType),
  createFunctionType('gui', /* TODO */ scalarType),
  createFunctionType('heading', /* TODO */ scalarType),
  createFunctionType('highlight', /* TODO */ scalarType),
  createFunctionType('hsv', /* TODO */ scalarType),
  createFunctionType('hsva', /* TODO */ scalarType),
  createFunctionType('hudtext', /* TODO */ scalarType),
  createFunctionType('latlng', /* TODO */ scalarType),
  createFunctionType('lex', /* TODO */ scalarType),
  createFunctionType('lexicon', /* TODO */ scalarType),
  createVarFunctionType('list', userListType, createVarType(structureType)),
  createFunctionType('listAlarms', /* TODO */ scalarType),
  createFunctionType('ln', scalarType, scalarType),
  createFunctionType('log10', scalarType, scalarType),
  createFunctionType('logfile', undefined, stringType, stringType),
  createFunctionType('lookdirup', /* TODO */ scalarType),
  createFunctionType('makebuiltindelegate', /* TODO */ scalarType, stringType),
  createFunctionType('max', scalarType, scalarType, scalarType),
  createFunctionType('min', scalarType, scalarType, scalarType),
  createFunctionType('mod', scalarType, scalarType),
  createFunctionType('movepath', /* TODO */ scalarType),
  createFunctionType('node', /* TODO */ scalarType),
  createFunctionType('note', /* TODO */ scalarType),
  createFunctionType('open', /* TODO */ scalarType),
  createFunctionType('orbitat', /* TODO */ scalarType),
  createFunctionType('path', /* TODO */ scalarType),
  createFunctionType('pidloop', /* TODO */ scalarType),
  createFunctionType('positionat', /* TODO */ scalarType),
  createFunctionType('print', structureType),
  createFunctionType('printat', structureType, scalarType, scalarType),
  createFunctionType('printlist', /* TODO */ scalarType),
  createFunctionType('processor', /* TODO */ scalarType),
  createFunctionType('profileresult', undefined),
  createFunctionType('q', /* TODO */ scalarType),
  createVarFunctionType('queue', queueType.toConcreteType(structureType), createVarType(structureType)),
  createFunctionType('r', /* TODO */ scalarType),
  createFunctionType('random', scalarType),
  createFunctionType('range', /* TODO */ scalarType),
  createFunctionType('readjson', /* TODO */ scalarType),
  createFunctionType('reboot', undefined),
  createFunctionType('remove', /* TODO */ scalarType),
  createFunctionType('rename_file_deprecated', /* TODO */ scalarType),
  createFunctionType('rename_volume_deprecated', /* TODO */ scalarType),
  createFunctionType('rgb', /* TODO */ scalarType),
  createFunctionType('rgba', /* TODO */ scalarType),
  createFunctionType('rotatefromto', /* TODO */ scalarType),
  createFunctionType('round', scalarType, scalarType),
  createFunctionType('run', /* TODO */ scalarType),
  createFunctionType('scriptpath', /* TODO */ scalarType),
  createFunctionType('selectautopilotmode', undefined, stringType),
  createFunctionType('shutdown', undefined),
  createFunctionType('sin', scalarType),
  createFunctionType('slidenote', /* TODO */ scalarType),
  createFunctionType('sqrt', scalarType, scalarType),
  createVarFunctionType('stack', stackType.toConcreteType(structureType), createVarType(structureType)),
  createFunctionType('stage', /* TODO */ scalarType),
  createFunctionType('StopAllVoices', /* TODO */ scalarType),
  createFunctionType('switch', /* TODO */ scalarType),
  createFunctionType('tan', scalarType),
  createFunctionType('toggleflybywire', undefined, stringType, booleanType),
  createFunctionType('transfer', /* TODO */ scalarType),
  createFunctionType('transferall', /* TODO */ scalarType),
  createFunctionType('unchar', scalarType, stringType),
  createFunctionType('uniqueset', uniqueSetType.toConcreteType(structureType), createVarType(structureType)),
  createFunctionType('v', /* TODO */ scalarType),
  createFunctionType('vang', /* TODO */ scalarType),
  createFunctionType('vcrs', /* TODO */ scalarType),
  createFunctionType('vdot', /* TODO */ scalarType),
  createFunctionType('vecdraw', /* TODO */ scalarType),
  createFunctionType('vecdrawargs', /* TODO */ scalarType),
  createFunctionType('vectorangle', /* TODO */ scalarType),
  createFunctionType('vectorcrossproduct', /* TODO */ scalarType),
  createFunctionType('vectordotproduct', /* TODO */ scalarType),
  createFunctionType('vectorexclude', /* TODO */ scalarType),
  createFunctionType('velocityat', /* TODO */ scalarType),
  createFunctionType('vessel', /* TODO */ scalarType),
  createFunctionType('volume', /* TODO */ scalarType),
  createFunctionType('vxcl', /* TODO */ scalarType),
  createFunctionType('warpto', /* TODO */ scalarType),
  createFunctionType('waypoint', /* TODO */ scalarType),
  createFunctionType('writejson', /* TODO */ scalarType),
];

const locks = [
  'throttle',
  'steering',
  'wheelthrottle',
  'wheelsteering',
];

const variables = [
  'abort',
  'activeship',
  'addons',
  'ag1',
  'ag10',
  'ag2',
  'ag3',
  'ag4',
  'ag5',
  'ag6',
  'ag7',
  'ag8',
  'ag9',
  'airspeed',
  'allnodes',
  'alt',
  'altitude',
  'angularmomentum',
  'angularvel',
  'angularvelocity',
  'apoapsis',
  'archive',
  'availablethrust',
  'bays',
  'black',
  'blue',
  'body',
  'brakes',
  'chutes',
  'chutessafe',
  'config',
  'constant',
  'controlconnection',
  'core',
  'cyan',
  'deploydrills',
  'donothing',
  'drills',
  'encounter',
  'eta',
  'facing',
  'fuelcells',
  'gear',
  'geoposition',
  'gray',
  'green',
  'grey',
  'groundspeed',
  'hasnode',
  'hastarget',
  'heading',
  'homeconnection',
  'intakes',
  'isru',
  'kuniverse',
  'ladders',
  'latitude',
  'legs',
  'lights',
  'longitude',
  'magenta',
  'mapview',
  'mass',
  'maxthrust',
  'missiontime',
  'nextnode',
  'north',
  'obt',
  'orbit',
  'panels',
  'periapsis',
  'prograde',
  'purple',
  'radiators',
  'rcs',
  'red',
  'retrograde',
  'sas',
  'sensor',
  'sessiontime',
  'ship',
  'shipname',
  'solarprimevector',
  'srfprograde',
  'srfretrograde',
  'stage',
  'status',
  'steeringmanager',
  'surfacespeed',
  'target',
  'terminal',
  'time',
  'up',
  'velocity',
  'version',
  'verticalspeed',
  'volume:name',
  'warp',
  'warpmode',
  'white',
  'yellow',
];

for (const functionName of functionNames) {
  standardLibrary.declareFunction(
    ScopeType.global,
    new Token(
      TokenType.identifier,
      functionName,
      undefined,
      new Marker(0, 0),
      new Marker(0, 0),
      undefined,
    ),
    [],
    false);
}

for (const variable of variables) {
  standardLibrary.declareVariable(
    ScopeType.global,
    new Token(
      TokenType.identifier,
      variable,
      undefined,
      new Marker(0, 0),
      new Marker(0, 0),
      undefined,
    ));
}

for (const lock of locks) {
  standardLibrary.declareLock(
    ScopeType.global,
    new Token(
      TokenType.identifier,
      lock,
      undefined,
      new Marker(0, 0),
      new Marker(0, 0),
      undefined,
    ));
}
