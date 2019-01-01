import { ScopeManager } from './scopeManager';
import { ScopeType } from '../parser/types';
import { Token, Marker } from '../entities/token';
import { TokenType } from '../entities/tokentypes';

export const standardLibrary = new ScopeManager();
const functionNames = [
  'abs',
  'add',
  'addAlarm',
  'allwaypoints',
  'angleaxis',
  'anglediff',
  'arccos',
  'arcsin',
  'arctan',
  'arctan2',
  'body',
  'bodyatmosphere',
  'buildlist',
  'career',
  'cd',
  'ceiling',
  'char',
  'chdir',
  'clearguis',
  'clearscreen',
  'clearvecdraws',
  'constant',
  'copy_deprecated',
  'copypath',
  'cos',
  'create',
  'createdir',
  'debugdump',
  'debugfreezegame',
  'delete_deprecated',
  'deleteAlarm',
  'deletepath',
  'edit',
  'exists',
  'floor',
  'GetVoice',
  'gui',
  'heading',
  'highlight',
  'hsv',
  'hsva',
  'hudtext',
  'latlng',
  'lex',
  'lexicon',
  'list',
  'listAlarms',
  'ln',
  'log10',
  'logfile',
  'lookdirup',
  'makebuiltindelegate',
  'max',
  'min',
  'mod',
  'movepath',
  'node',
  'note',
  'open',
  'orbitat',
  'path',
  'pidloop',
  'positionat',
  'print',
  'printat',
  'printlist',
  'processor',
  'profileresult',
  'q',
  'queue',
  'r',
  'random',
  'range',
  'readjson',
  'reboot',
  'remove',
  'rename_file_deprecated',
  'rename_volume_deprecated',
  'rgb',
  'rgba',
  'rotatefromto',
  'round',
  'run',
  'scriptpath',
  'selectautopilotmode',
  'shutdown',
  'sin',
  'slidenote',
  'sqrt',
  'stack',
  'stage',
  'StopAllVoices',
  'switch',
  'tan',
  'toggleflybywire',
  'transfer',
  'transferall',
  'unchar',
  'uniqueset',
  'v',
  'vang',
  'vcrs',
  'vdot',
  'vecdraw',
  'vecdrawargs',
  'vectorangle',
  'vectorcrossproduct',
  'vectordotproduct',
  'vectorexclude',
  'velocityat',
  'vessel',
  'volume',
  'vxcl',
  'warpto',
  'waypoint',
  'writejson',
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
