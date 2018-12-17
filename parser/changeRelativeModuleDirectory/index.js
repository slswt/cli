import path from 'path';
import requiredParam from '../utils/requiredParam';

const changeRelativeModuleDirectory = ({
  hcl = requiredParam('hcl'),
  oldFolder = requiredParam('oldFolder'),
  newFolder = requiredParam('newFolder'),
}) => {
  const moduleSourceRe = /source\s*=\s*"([^"]+)"/g;
  return hcl.replace(moduleSourceRe, (searchValue, replaceValue) => {
    if (!replaceValue.match(/^\.{1,2}\//)) {
      return searchValue;
    }

    /* replaceValue is a relative path */
    return searchValue.replace(
      replaceValue,
      path.relative(newFolder, path.join(oldFolder, replaceValue)),
    );
  });
};

export default changeRelativeModuleDirectory;
