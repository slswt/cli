import get from 'lodash/get';
import last from 'lodash/last';
import has from 'lodash/has';

const isMatch = (hcl, matcher, startIndex, index) => {
  if (index < 0) {
    return false;
  }

  const slice = hcl.slice(index, index + matcher.length);

  if (slice === matcher) {
    /* only backtrack by the length of the matcher */
    if (startIndex - index <= matcher.length) {
      return true;
    }
    return !isMatch(hcl, matcher, startIndex, index - 1);
  }

  return false;
};

const newlineRegex = /[\r\n]/gm;
const getMatches = (matcher, hcl, matches = [], antiMatches = []) => {
  if (matcher.match(newlineRegex)) {
    throw new Error('The matcher cannot contain new lines');
  }
  if (antiMatches.length === 0) {
    antiMatches.push({
      start: 0,
      line: 1,
    });
  }
  /* leq as we have length - length */
  for (let i = 0, line = 1; i <= hcl.length - matcher.length; i += 1) {
    if (hcl[i].match(newlineRegex)) {
      line += 1;
    }
    const lastIndex = get(last(matches), 'end');
    const endOfBacktick = i + matcher.length;
    if (
      isMatch(hcl, matcher, i, i)
      && (!lastIndex || (lastIndex && i >= lastIndex + matcher.length))
    ) {
      if (
        matches.length === 0
        || (has(last(matches), 'start') && has(last(matches), 'end'))
      ) {
        matches.push({});
      }

      if (
        (has(last(antiMatches), 'start') && has(last(antiMatches), 'end'))
      ) {
        antiMatches.push({
          start: endOfBacktick,
          line,
        });
      }

      const match = last(matches);
      const antiMatch = last(antiMatches);

      if (has(match, 'start') && !has(match, 'end')) {
        match.end = i;
        i += matcher.length - 1;
      } else if (!has(match, 'start')) {
        /* new block */
        /* special case when code is === '' */
        if (isMatch(hcl, [matcher, matcher].join(''), i, i)) {
          match.start = endOfBacktick;
          match.end = endOfBacktick;
          antiMatch.end = i;
          /* -1 as the loop will increment by one */
          i += matcher.length * 2 - 1;
        } else {
          match.start = endOfBacktick;
          antiMatch.end = i;
          i += matcher.length - 1;
        }
        match.line = line;
      }
      if (has(match, 'start') && has(match, 'end')) {
        match.code = hcl.slice(match.start, match.end);
      }
      if (has(antiMatch, 'start') && has(antiMatch, 'end')) {
        antiMatch.code = hcl.slice(antiMatch.start, antiMatch.end);
      }
    }
  }
  const lastAntiMatch = last(antiMatches);
  if (!has(lastAntiMatch, 'end')) {
    lastAntiMatch.end = hcl.length;
    lastAntiMatch.code = hcl.slice(lastAntiMatch.start, lastAntiMatch.end);
  }
  return {
    matches,
    antiMatches,
  };
};

export default getMatches;
