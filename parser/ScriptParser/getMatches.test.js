/* eslint-env jest */
import getMatches from './getMatches';

test('getMatches handle empty code case', () => {
  const result = getMatches('```', '````````````', []);

  expect(result.matches).toEqual([
    {
      start: 3,
      end: 3,
      line: 1,
      code: '',
    },
    {
      start: 9,
      end: 9,
      line: 1,
      code: '',
    },
  ]);
});

test('getMatches handle empty code case', () => {
  const result = getMatches('```', '```omg``````123```', []);
  expect(result.matches).toEqual([
    {
      start: 3,
      line: 1,
      end: 6,
      code: 'omg',
    },
    {
      start: 12,
      line: 1,
      end: 15,
      code: '123',
    },
  ]);
});

test('getMatches handle empty code case', () => {
  const result = getMatches('```', '```omg``` ```123```', []);
  expect(result.matches).toEqual([
    {
      start: 3,
      line: 1,
      end: 6,
      code: 'omg',
    },
    {
      start: 13,
      line: 1,
      end: 16,
      code: '123',
    },
  ]);
});

test('getMatches handle antimatches', () => {
  const result = getMatches(
    '```',
    '//```omg```-_-antimatches_-_```123```@wef$',
    [],
  );

  expect(result.antiMatches).toEqual([
    {
      start: 0,
      line: 1,
      end: 2,
      code: '//',
    },
    {
      start: 11,
      line: 1,
      end: 28,
      code: '-_-antimatches_-_',
    },
    {
      start: 37,
      line: 1,
      end: 42,
      code: '@wef$',
    },
  ]);
});

test('getMatches handle antimatches', () => {
  const result = getMatches('```', '```omg``````123``````123```', []);

  expect(result.antiMatches).toEqual([
    {
      start: 0, line: 1, end: 0, code: '',
    },
    {
      start: 9, line: 1, end: 9, code: '',
    },
    {
      start: 18, line: 1, end: 18, code: '',
    },
    {
      start: 27, line: 1, end: 27, code: '',
    },
  ]);
});
