import path from 'path';
import snakeCase from 'lodash/snakeCase';
import requiredParam from './requiredParam';

const getResourcePrefix = (relativeSourceFile = requiredParam('relativeSourceFile')) =>
  snakeCase(path.join(path.parse(relativeSourceFile).dir, path.parse(relativeSourceFile).name));

export default getResourcePrefix;
