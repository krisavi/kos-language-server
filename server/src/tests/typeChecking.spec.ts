import { Tokenized } from '../scanner/types';
import { ParseResult } from '../parser/types';
import { SymbolTable } from '../analysis/symbolTable';
import { Diagnostic, Range, DiagnosticSeverity } from 'vscode-languageserver';
import { Scanner } from '../scanner/scanner';
import { Parser } from '../parser/parser';
import { SymbolTableBuilder } from '../analysis/symbolTableBuilder';
import { standardLibraryBuilder } from '../analysis/standardLibrary';
import { PreResolver } from '../analysis/preResolver';
import { Resolver } from '../analysis/resolver';
import { TypeChecker } from '../typeChecker/typeChecker';
import { KsBaseSymbol, KsSymbolKind } from '../analysis/types';
import { unWrap, empty } from '../utilities/typeGuards';
import { booleanType } from '../typeChecker/ksTypes/primitives/boolean';
import {
  doubleType,
  integerType,
  scalarType,
} from '../typeChecker/ksTypes/primitives/scalar';
import { stringType } from '../typeChecker/ksTypes/primitives/string';
import { userListType } from '../typeChecker/ksTypes/collections/userList';
import { structureType } from '../typeChecker/ksTypes/primitives/structure';
import { vectorType } from '../typeChecker/ksTypes/collections/vector';
import { directionType } from '../typeChecker/ksTypes/collections/direction';
import { Marker } from '../entities/marker';
import { zip } from '../utilities/arrayUtils';
import { timeSpanType } from '../typeChecker/ksTypes/timespan';
import { typeInitializer } from '../typeChecker/initialize';
import { bodyAtmosphereType } from '../typeChecker/ksTypes/bodyatmosphere';
import { listType } from '../typeChecker/ksTypes/collections/list';
import { partType } from '../typeChecker/ksTypes/parts/part';
import { IType } from '../typeChecker/types';
import { pathType } from '../typeChecker/ksTypes/io/path';

const fakeUri = 'C:\\fake.ks';

typeInitializer();

interface ITypeCheckResults {
  scan: Tokenized;
  parse: ParseResult;
  table: SymbolTable;
  resolveDiagnostics: Diagnostic[];
  typeCheckDiagnostics: Diagnostic[];
}

// parse source
const parseSource = (
  source: string,
): Pick<ITypeCheckResults, 'scan' | 'parse'> => {
  const scanner = new Scanner(source, fakeUri);
  const scan = scanner.scanTokens();

  const parser = new Parser(fakeUri, scan.tokens);
  const parse = parser.parse();

  return { scan, parse };
};

const checkSource = (
  source: string,
  standardLib = false,
): ITypeCheckResults => {
  const result = parseSource(source);

  const symbolTableBuilder = new SymbolTableBuilder(fakeUri);

  if (standardLib) {
    symbolTableBuilder.linkDependency(
      standardLibraryBuilder(CaseKind.lowercase),
    );
  }

  const functionResolver = new PreResolver(
    result.parse.script,
    symbolTableBuilder,
  );
  const resolver = new Resolver(result.parse.script, symbolTableBuilder);

  const preResolverError = functionResolver.resolve();
  const resolverErrors = resolver.resolve();
  const unusedErrors = symbolTableBuilder.findUnused();

  const checker = new TypeChecker(result.parse.script);
  const typeCheckError = checker.check();

  return {
    ...result,
    resolveDiagnostics: preResolverError.concat(resolverErrors, unusedErrors),
    typeCheckDiagnostics: typeCheckError,
    table: symbolTableBuilder.build(),
  };
};

const noResolverErrors = (result: ITypeCheckResults): void => {
  expect(result.scan.scanErrors.map(e => e.message)).toEqual([]);
  expect(result.parse.parseErrors.map(e => e.message)).toEqual([]);
  expect(result.resolveDiagnostics.map(e => e.message)).toEqual([]);
};

const noErrors = (result: ITypeCheckResults): void => {
  expect(result.scan.scanErrors.map(e => e.message)).toEqual([]);
  expect(result.parse.parseErrors.map(e => e.message)).toEqual([]);
  expect(result.resolveDiagnostics.map(e => e.message)).toEqual([]);
  expect(result.typeCheckDiagnostics.map(e => e.message)).toEqual([]);
};

const literalSource = `
local b1 is true.
local b2 is false.

local d1 is 10.0.
local d2 is 4e6.

local i is 5.

local fi is file.ks.
local s is "example".

print fi.
print b1.
print i.
print b2.
print d1.
print d2.
print s.
`;

const identiferSource = `
local b1 is true.
local b2 is false.

local d1 is 10.0.
local d2 is 4e6.

local i1 is 5.

local fi1 is file.ks.
local s1 is "example".

local b3 is b1.
local b4 is b2.

local d3 is d1.
local d4 is d2.

local i2 is i1.

local fi2 is fi1.
local s2 is s1.

print fi2.
print i2.
print b3.
print b4.
print d3.
print d4.
print s2.
`;

const collectionSource = `
local a is 0.
local b is "cat".
local c is false.

local l1 is list(1, 2, 3).
local l2 is list(a, b, c).

local x1 is l1[1].
local x2 is l2[1].

print(x1).
print(x2).

for i1 in l1 { print(i1). }
for i2 in l2 { print(i2). }

// need to have userlisttype subtype listtype
local p is path("example").
local segments is p:segments.

local x3 is segments[0].
print(x3).

for i3 in segments { print(i3). }
`;

const suffixSource = `
local atm is body:atm.
local length is list():length.
local parts is ship:parts.
local partFacing is ship:parts[0]:facing.
local distance is body:geopositionlatlng(10, 10):distance.

print(atm).
print(length).
print(parts).
print(partFacing).
print(distance).
`;

const symbolTests = (
  symbols: Map<string, KsBaseSymbol>,
  name: string,
  symbolKind: KsSymbolKind,
  targetType?: IType,
) => {
  expect(symbols.has(name)).toBe(true);
  const nameWrap = symbols.get(name);

  expect(nameWrap).toBeDefined();
  const nameUnWrap = unWrap(nameWrap);

  expect(nameUnWrap.name.lexeme).toBe(name);
  expect(nameUnWrap.tag).toBe(symbolKind);

  expect(nameUnWrap.name.tracker).toBeDefined();

  if (!empty(targetType)) {
    const nameTrack = unWrap(nameUnWrap.name.tracker);
    expect(nameTrack.declared.type).toBe(targetType);
  }
};

describe('Basic inferring', () => {
  test('Literal inferring', () => {
    const results = checkSource(literalSource);
    noErrors(results);

    const { table } = results;
    const symbols = table.allSymbols();
    const names = new Map(
      symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
    );

    symbolTests(names, 'b1', KsSymbolKind.variable, booleanType);
    symbolTests(names, 'b2', KsSymbolKind.variable, booleanType);

    symbolTests(names, 'd1', KsSymbolKind.variable, doubleType);
    symbolTests(names, 'd2', KsSymbolKind.variable, doubleType);

    symbolTests(names, 'i', KsSymbolKind.variable, integerType);

    symbolTests(names, 's', KsSymbolKind.variable, stringType);
    symbolTests(names, 'fi', KsSymbolKind.variable, stringType);
  });

  test('Identifier inferring', () => {
    const results = checkSource(identiferSource);
    noErrors(results);

    const { table } = results;
    const symbols = table.allSymbols();
    const names = new Map(
      symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
    );

    symbolTests(names, 'b3', KsSymbolKind.variable, booleanType);
    symbolTests(names, 'b4', KsSymbolKind.variable, booleanType);

    symbolTests(names, 'd3', KsSymbolKind.variable, doubleType);
    symbolTests(names, 'd4', KsSymbolKind.variable, doubleType);

    symbolTests(names, 'i2', KsSymbolKind.variable, integerType);

    symbolTests(names, 's2', KsSymbolKind.variable, stringType);
    symbolTests(names, 'fi2', KsSymbolKind.variable, stringType);
  });

  test('collection inferring', () => {
    const results = checkSource(collectionSource, true);
    noErrors(results);

    const { table } = results;
    const symbols = table.allSymbols();
    const names = new Map(
      symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
    );

    symbolTests(names, 'a', KsSymbolKind.variable, integerType);
    symbolTests(names, 'b', KsSymbolKind.variable, stringType);
    symbolTests(names, 'c', KsSymbolKind.variable, booleanType);

    symbolTests(names, 'l1', KsSymbolKind.variable, userListType);
    symbolTests(names, 'l2', KsSymbolKind.variable, userListType);

    symbolTests(names, 'x1', KsSymbolKind.variable, structureType);
    symbolTests(names, 'x2', KsSymbolKind.variable, structureType);

    symbolTests(names, 'i1', KsSymbolKind.variable, structureType);
    symbolTests(names, 'i2', KsSymbolKind.variable, structureType);

    symbolTests(names, 'p', KsSymbolKind.variable, pathType);
    symbolTests(
      names,
      'segments',
      KsSymbolKind.variable,
      listType.apply(stringType),
    );

    symbolTests(names, 'x3', KsSymbolKind.variable, stringType);
    symbolTests(names, 'i3', KsSymbolKind.variable, stringType);
  });

  test('suffix inferring', () => {
    const results = checkSource(suffixSource, true);
    noErrors(results);

    const { table } = results;
    const symbols = table.allSymbols();
    const names = new Map(
      symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
    );

    symbolTests(names, 'atm', KsSymbolKind.variable, bodyAtmosphereType);
    symbolTests(names, 'length', KsSymbolKind.variable, integerType);
    symbolTests(
      names,
      'parts',
      KsSymbolKind.variable,
      listType.apply(partType),
    );
    symbolTests(names, 'partFacing', KsSymbolKind.variable, directionType);
    symbolTests(names, 'distance', KsSymbolKind.variable, scalarType);
  });
});

const unarySource = `
function f { }
local x is 10.
lock l to x.

local d1 is defined f.
local d2 is defined x.
local d3 is defined l.

print(d1).
print(d2).
print(d3).

local b1 is not true.
local b2 is not false.
local b3 is not (10 > 5).

print(b1).
print(b2).
print(b3).

local n1 is -10.
local n2 is -16.3.
local n3 is +18.3.
lock n4 to -v(1, 1, 1).
local n5 is +q(1, 1, 1, 1).

print(n1).
print(n2).
print(n3).
print(n4).
print(n5).
`;

const unaryInvalidSource = `
function f {}.

local b1 is not f.
local n1 is -"test".

print(b1).
print(n1).
`;

const binaryMultiplicationSource = `
local s1 is 10 * 10.

local v1 is v(1, 1, 1) * v(1, 1, 1).
local v2 is v(1, 1, 1) * 10.

local d1 is q(1, 1, 1, 1) * v(1, 1, 1).
local d2 is q(1, 1, 1, 1) * q(1, 1, 1, 1).

local t1 is time * 10.

print(s1).

print(v1).
print(v2).

print(d1).
print(d2).

print(t1).
`;

const binaryAdditionSource = `
local s1 is 10 + 10.
local str1 is "cat" + "dog".

local v1 is v(1, 1, 1) + v(1, 1, 1).

local d1 is q(1, 1, 1, 1) + v(1, 1, 1).
local d2 is q(1, 1, 1, 1) + q(1, 1, 1, 1).

local t1 is time + time.
local t2 is time + 10.

print(s1).
print(str1).

print(v1).

print(d1).
print(d2).

print(t1).
print(t2).
`;

const binaryLogicalSource = `
local l1 is true and true.
local l2 is true or true.
local l3 is ship or true.
local l4 is 10 and 20.
local l5 is "true" or "false".


print(l1).
print(l2).
print(l3).
print(l4).
print(l5).
`;

const factorSource = `
local l1 is 10 ^ 10.
local l2 is 10 ^ 10.0.
local l3 is 10.0 ^ 10.
local l4 is 10.0 ^ 10.0.

local i is 10.
local d is 10.0.

local e1 is i ^ i.
local e2 is i ^ d.
local e3 is d ^ i.
local e4 is d ^ d.

print(l1).
print(l2).
print(l3).
print(l4).

print(e1).
print(e2).
print(e3).
print(e4).
`;

describe('Operators', () => {
  test('unary operators', () => {
    const results = checkSource(unarySource, true);
    noErrors(results);

    const { table } = results;
    const symbols = table.allSymbols();
    const names = new Map(
      symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
    );

    symbolTests(names, 'f', KsSymbolKind.function);
    symbolTests(names, 'x', KsSymbolKind.variable, integerType);
    symbolTests(names, 'l', KsSymbolKind.lock, integerType);

    symbolTests(names, 'd1', KsSymbolKind.variable, booleanType);
    symbolTests(names, 'd2', KsSymbolKind.variable, booleanType);
    symbolTests(names, 'd3', KsSymbolKind.variable, booleanType);

    symbolTests(names, 'b1', KsSymbolKind.variable, booleanType);
    symbolTests(names, 'b2', KsSymbolKind.variable, booleanType);
    symbolTests(names, 'b3', KsSymbolKind.variable, booleanType);

    symbolTests(names, 'n1', KsSymbolKind.variable, scalarType);
    symbolTests(names, 'n2', KsSymbolKind.variable, scalarType);
    symbolTests(names, 'n3', KsSymbolKind.variable, scalarType);
    symbolTests(names, 'n4', KsSymbolKind.lock, vectorType);
    symbolTests(names, 'n5', KsSymbolKind.variable, directionType);
  });

  const unaryLocations: Range[] = [
    { start: new Marker(3, 16), end: new Marker(3, 17) },
    { start: new Marker(4, 13), end: new Marker(4, 19) },
  ];

  test('unary invalid operators', () => {
    const results = checkSource(unaryInvalidSource, true);
    noResolverErrors(results);

    const { table } = results;
    const symbols = table.allSymbols();
    const names = new Map(
      symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
    );

    symbolTests(names, 'b1', KsSymbolKind.variable, booleanType);
    symbolTests(names, 'n1', KsSymbolKind.variable, structureType);

    const sortedErrors = results.typeCheckDiagnostics.sort(
      (a, b) => a.range.start.line - b.range.start.line,
    );

    for (const [error, location] of zip(sortedErrors, unaryLocations)) {
      expect(error.severity).toBe(DiagnosticSeverity.Hint);
      expect(location.start).toEqual(error.range.start);
      expect(location.end).toEqual(error.range.end);
    }
  });

  test('binary multiplication operators', () => {
    const results = checkSource(binaryMultiplicationSource, true);
    noErrors(results);

    const { table } = results;
    const symbols = table.allSymbols();
    const names = new Map(
      symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
    );

    symbolTests(names, 's1', KsSymbolKind.variable, scalarType);

    symbolTests(names, 'v1', KsSymbolKind.variable, scalarType);
    symbolTests(names, 'v2', KsSymbolKind.variable, vectorType);

    symbolTests(names, 'd1', KsSymbolKind.variable, vectorType);
    symbolTests(names, 'd2', KsSymbolKind.variable, directionType);

    symbolTests(names, 't1', KsSymbolKind.variable, timeSpanType);
  });

  test('binary plus operators', () => {
    const results = checkSource(binaryAdditionSource, true);
    noErrors(results);

    const { table } = results;
    const symbols = table.allSymbols();
    const names = new Map(
      symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
    );

    symbolTests(names, 's1', KsSymbolKind.variable, scalarType);

    symbolTests(names, 'str1', KsSymbolKind.variable, stringType);

    symbolTests(names, 'v1', KsSymbolKind.variable, vectorType);

    symbolTests(names, 'd1', KsSymbolKind.variable, vectorType);
    symbolTests(names, 'd2', KsSymbolKind.variable, directionType);

    symbolTests(names, 't1', KsSymbolKind.variable, timeSpanType);
    symbolTests(names, 't2', KsSymbolKind.variable, timeSpanType);
  });

  test('binary and operators', () => {
    const results = checkSource(binaryLogicalSource, true);
    noErrors(results);

    const { table } = results;
    const symbols = table.allSymbols();
    const names = new Map(
      symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
    );

    symbolTests(names, 'l1', KsSymbolKind.variable, booleanType);
    symbolTests(names, 'l2', KsSymbolKind.variable, booleanType);
    symbolTests(names, 'l3', KsSymbolKind.variable, booleanType);
    symbolTests(names, 'l4', KsSymbolKind.variable, booleanType);
    symbolTests(names, 'l5', KsSymbolKind.variable, booleanType);
  });

  test('factor operator', () => {
    const results = checkSource(factorSource, true);
    noErrors(results);

    const { table } = results;
    const symbols = table.allSymbols();
    const names = new Map(
      symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
    );

    symbolTests(names, 'i', KsSymbolKind.variable, integerType);
    symbolTests(names, 'd', KsSymbolKind.variable, doubleType);

    symbolTests(names, 'l1', KsSymbolKind.variable, scalarType);
    symbolTests(names, 'l2', KsSymbolKind.variable, scalarType);
    symbolTests(names, 'l3', KsSymbolKind.variable, scalarType);
    symbolTests(names, 'l4', KsSymbolKind.variable, scalarType);

    symbolTests(names, 'e1', KsSymbolKind.variable, scalarType);
    symbolTests(names, 'e2', KsSymbolKind.variable, scalarType);
    symbolTests(names, 'e3', KsSymbolKind.variable, scalarType);
    symbolTests(names, 'e4', KsSymbolKind.variable, scalarType);
  });
});
