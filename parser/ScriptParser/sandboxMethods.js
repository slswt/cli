import path, { relative } from 'path';
import snakeCase from 'lodash/snakeCase';
import fs from 'fs';
import requiredParam from '../utils/requiredParam';
import Resource from '../Resource';
import getRelativePath from '../utils/getRelativePath';
import getResourcePrefix from '../utils/getResourcePrefix';

const sandboxMethods = ({
  id = requiredParam('id'),
  includes = requiredParam('includes'),
  inplaceInserts = requiredParam('inplaceInserts'),
  sourceFile = requiredParam('sourceFile'),
  rootFolder = requiredParam('rootFolder'),
  references = requiredParam('references'),
  deploymentParams = requiredParam('deploymentParams'),
}) => ({
  include: (fpath = requiredParam('filePath'), newDeploymentParams) => {
    let absolutePath = fpath;
    if (!path.isAbsolute(fpath)) {
      absolutePath = path.join(path.parse(sourceFile).dir, fpath);
    }
    if (!fs.lstatSync(absolutePath).isFile()) {
      throw new Error(
        `You can only include files, ${absolutePath} is not a file`,
      );
    }
    includes.push({
      fpath: absolutePath,
      id,
      deploymentParams: {
        ...deploymentParams,
        ...newDeploymentParams,
      },
    });
  },

  insert: (hcl = requiredParam('hcl'), newDeploymentParams) => {
    includes.push({
      hcl,
      id,
      deploymentParams: {
        ...deploymentParams,
        ...newDeploymentParams,
      },
    });
  },

  insertHere: (value = requiredParam('value')) => {
    if (
      typeof value !== 'string'
      && typeof value !== 'number'
      && typeof value !== 'boolean'
    ) {
      throw new Error(
        'Invalid value provided to insertHere, must be string, number or boolean',
      );
    }
    inplaceInserts.push({
      value,
      id,
    });
  },
  ref: (...args) => {
    if (args.length !== 3 && args.length !== 4) {
      throw new Error('You must provide 3 or 4 arguments');
    }
    let type;
    let name;
    let key;
    let refRelSourceFile;
    let refSourceFile;
    if (args.length === 3) {
      [
        type = requiredParam('type'),
        name = requiredParam('name'),
        key = requiredParam('key'),
      ] = args;
      /* same directory */
      refSourceFile = sourceFile;
      refRelSourceFile = getRelativePath(rootFolder, refSourceFile);
    } else {
      const [filePath = requiredParam('filePath')] = args;
      [,
        type = requiredParam('type'),
        name = requiredParam('name'),
        key = requiredParam('key'),
      ] = args;
      if (!path.isAbsolute(filePath)) {
        refSourceFile = path.join(path.parse(sourceFile).dir, filePath);
      } else {
        /* it is absolute */
        refSourceFile = filePath;
      }
      refRelSourceFile = getRelativePath(rootFolder, refSourceFile);
      console.log(refSourceFile);
      /* the relative source is an absolute path, and now becomes truly relative to the root */
    }

    references.push({
      sourceFile: refSourceFile,
      type,
      name,
      key,
    });

    return `${type}.${getResourcePrefix(refRelSourceFile)}_${name}.${key}`;
  },

  resource: (
    resourceType,
    resourceName,
    resourceIdentifiers,
    resourceParams,
    newDeploymentParams = {},
  ) => {
    const resource = new Resource({
      deploymentParams: {
        ...deploymentParams,
        newDeploymentParams,
      },
      rootFolder,
      sourceFile,
      resourceType,
      resourceName,
      resourceIdentifiers,
      resourceParams,
    });
    return resource.generate();
  },

  hclInterpolate: (value = requiredParam('value')) => {
    if (typeof value !== 'string') {
      throw new Error('Invalid type');
    }
    return `\${${value}}`;
  },
});

export default sandboxMethods;
