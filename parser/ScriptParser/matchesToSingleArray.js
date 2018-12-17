const matchesToSingleArray = ({ matches, antiMatches }) => {
  const lastIndex = matches.length + antiMatches.length - 1;

  const single = [];
  for (let i = 0, amIndex = 0, mIndex = 0; i <= lastIndex; i += 1) {
    if (i % 2 === 0) {
      single.push({
        ...antiMatches[amIndex],
        antiMatchIndex: amIndex,
        index: i,
        type: 'antimatch',
      });
      amIndex += 1;
    } else {
      single.push({
        ...matches[mIndex],
        matchIndex: mIndex,
        index: i,
        type: 'match',
      });
      mIndex += 1;
    }
  }

  return single;
};

export default matchesToSingleArray;
