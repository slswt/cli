import requiredParam from './requiredParam';

const getRelativePath = (
  rootFolder = requiredParam('rootFolder'),
  sourceFile = requiredParam('sourceFile'),
) => sourceFile.replace(rootFolder, '').replace(/^\//, '');

export default getRelativePath;
