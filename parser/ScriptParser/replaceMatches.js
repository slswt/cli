import requiredParam from '../utils/requiredParam';

const replaceMatches = ({
  hcl = requiredParam('hcl'),
  matches = requiredParam('matches'),
  matcher = requiredParam('matcher'),
  replacer = () => false,
}) => {
  let parsedHcl = hcl;
  let offset = 0;
  matches.forEach((props, index) => {
    const { start, end, type } = props;
    const value = replacer({ ...props, index }) || '';
    /* only slice the matcher when it is a match */
    const matcherOffset = type === 'antimatch' ? 0 : matcher.length;
    const sliceStart = start - offset - matcherOffset;
    const sliceEnd = end - offset + matcherOffset;
    parsedHcl = `${parsedHcl.slice(0, sliceStart)}${value}${parsedHcl.slice(
      sliceEnd,
    )}`;
    offset += sliceEnd - sliceStart - value.length;
  });

  return parsedHcl;
};

export default replaceMatches;
