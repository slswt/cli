/* eslint-env jest */
import matchesToSingleArray from './matchesToSingleArray';

test('getMatches handle empty code case', () => {
  const result = matchesToSingleArray({
    matches: [
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
      {
        start: 21,
        line: 1,
        end: 24,
        code: '123',
      },
    ],
    antiMatches: [
      {
        start: 0,
        line: 1,
        end: 0,
        code: '',
      },
      {
        start: 9,
        line: 1,
        end: 9,
        code: '',
      },
      {
        start: 18,
        line: 1,
        end: 18,
        code: '',
      },
      {
        start: 27,
        line: 1,
        end: 27,
        code: '',
      },
    ],
  });

  expect(result).toEqual([
    {
      antiMatchIndex: 0,
      code: '',
      end: 0,
      index: 0,
      line: 1,
      start: 0,
      type: 'antimatch',
    },
    {
      code: 'omg',
      end: 6,
      index: 1,
      line: 1,
      matchIndex: 0,
      start: 3,
      type: 'match',
    },
    {
      antiMatchIndex: 1,
      code: '',
      end: 9,
      index: 2,
      line: 1,
      start: 9,
      type: 'antimatch',
    },
    {
      code: '123',
      end: 15,
      index: 3,
      line: 1,
      matchIndex: 1,
      start: 12,
      type: 'match',
    },
    {
      antiMatchIndex: 2,
      code: '',
      end: 18,
      index: 4,
      line: 1,
      start: 18,
      type: 'antimatch',
    },
    {
      code: '123',
      end: 24,
      index: 5,
      line: 1,
      matchIndex: 2,
      start: 21,
      type: 'match',
    },
    {
      antiMatchIndex: 3,
      code: '',
      end: 27,
      index: 6,
      line: 1,
      start: 27,
      type: 'antimatch',
    },
  ]);
});
