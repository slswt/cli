import path from 'path';
import last from 'lodash/last';
import fs from 'fs';
import requiredParam from '../utils/requiredParam';
import Resource from '../Resource';
import getRelativePath from '../utils/getRelativePath';
import getResourcePrefix from '../utils/getResourcePrefix';

const requiresNewDeployment = ({
  deploymentParams = requiredParam('deploymentParams'),
  newDeploymentParams = requiredParam('newDeploymentParams'),
}) =>
  newDeploymentParams.platform
  && deploymentParams.platform !== newDeploymentParams.platform;

class Sandbox {
  constructor({
    id = requiredParam('id'),
    sourceFile = requiredParam('sourceFile'),
    rootFolder = requiredParam('rootFolder'),
    deploymentParams = requiredParam('deploymentParams'),
    addDeploymentPlatform = requiredParam('addDeploymentPlatform'),
    addInclude = requiredParam('addInclude'),
    addInsert = requiredParam('addInsert'),
    addInplaceInsert = requiredParam('addInplaceInsert'),
    
    registerReference = requiredParam('registerReference'),
  }) {
    this.id = id;
    this.sourceFile = sourceFile;
    this.rootFolder = rootFolder;
    this.deploymentParams = deploymentParams;
    this.addDeploymentPlatform = addDeploymentPlatform;
    this.addInclude = addInclude;
    this.addInsert = addInsert;
    this.addInplaceInsert = addInplaceInsert;

    this.registerReference = registerReference;
  }

  getContext = () => ({
    ...this.deploymentParams,
    fs,
    path,
    __dirname: path.parse(this.sourceFile).dir,
    include: this.include,
    insert: this.insert,
    insertHere: this.insertHere,
    ref: this.ref,
    resource: this.resource,
    hclInterpolate: this.hclInterpolate,
  });

  include = (fpath = requiredParam('filePath'), newDeploymentParams = {}) => {
    let absolutePath = fpath;
    if (!path.isAbsolute(fpath)) {
      absolutePath = path.join(path.parse(this.sourceFile).dir, fpath);
    }
    if (!fs.lstatSync(absolutePath).isFile()) {
      throw new Error(
        `You can only include files, ${absolutePath} is not a file`,
      );
    }
    if (
      requiresNewDeployment({
        deploymentParams: this.deploymentParams,
        newDeploymentParams,
      })
    ) {
      this.addDeploymentPlatform({
        log: fpath,
        deploymentParams: this.deploymentParams,
        newDeploymentParams,
      });
    }
    this.addInclude({
      fpath: absolutePath,
      deploymentParams: {
        ...this.deploymentParams,
        ...newDeploymentParams,
      },
    });
  };

  insert = (hcl = requiredParam('hcl'), newDeploymentParams = {}) => {
    if (
      requiresNewDeployment({
        deploymentParams: this.deploymentParams,
        newDeploymentParams,
      })
    ) {
      this.addDeploymentPlatform({
        log: hcl,
        deploymentParams: this.deploymentParams,
        newDeploymentParams,
      });
    }
    this.addInsert({
      hcl,
      deploymentParams: {
        ...this.deploymentParams,
        ...newDeploymentParams,
      },
    });
  };

  insertHere = (value = requiredParam('value')) => {
    if (
      typeof value !== 'string'
      && typeof value !== 'number'
      && typeof value !== 'boolean'
    ) {
      throw new Error(
        'Invalid value provided to insertHere, must be string, number or boolean',
      );
    }
    this.addInplaceInsert({
      value,
      id: this.id,
    });
  };

  ref = (...args) => {
    if (![3, 4, 5].includes(args.length)) {
      throw new Error('You must provide 3, 4 or 5 arguments');
    }

    let type;
    let name;
    let key;
    let refRelSourceFile;
    let refSourceFile;
    let newDeploymentParams = {};

    let argLengthOffset = 0;
    if (typeof last(args) !== 'string') {
      newDeploymentParams = last(args);
      argLengthOffset = 1;
    }
    if (args.length === 3 + argLengthOffset) {
      [
        type = requiredParam('type'),
        name = requiredParam('name'),
        key = requiredParam('key'),
        newDeploymentParams = {},
      ] = args;
      /* same directory */
      refSourceFile = this.sourceFile;
      refRelSourceFile = getRelativePath(this.rootFolder, refSourceFile);
    } else {
      const [filePath = requiredParam('filePath')] = args;
      [,
        type = requiredParam('type'),
        name = requiredParam('name'),
        key = requiredParam('key'),
        newDeploymentParams = {},
      ] = args;
      if (!path.isAbsolute(filePath)) {
        refSourceFile = path.join(path.parse(this.sourceFile).dir, filePath);
      } else {
        /* it is absolute */
        refSourceFile = filePath;
      }
      refRelSourceFile = getRelativePath(this.rootFolder, refSourceFile);
      console.log(refSourceFile);
      /* the relative source is an absolute path, and now becomes truly relative to the root */
    }

    this.registerReference({
      sourceFile: refSourceFile,
      type,
      name,
      key,
      deploymentParams: {
        ...this.deploymentParams,
        ...newDeploymentParams,
      },
    });

    const interpolationReference = `${type}.${getResourcePrefix(
      refRelSourceFile,
    )}_${name}.${key}`;

    if (
      requiresNewDeployment({
        deploymentParams: this.deploymentParams,
        newDeploymentParams,
      })
    ) {
      this.addDeploymentPlatform({
        log: interpolationReference,
        deploymentParams: this.deploymentParams,
        newDeploymentParams,
      });
    }

    return interpolationReference;
  };

  resource = (
    resourceType,
    resourceName,
    resourceIdentifiers,
    resourceParams,
    newDeploymentParams = {},
  ) => {
    const resource = new Resource({
      deploymentParams: {
        ...this.deploymentParams,
        newDeploymentParams,
      },
      rootFolder: this.rootFolder,
      sourceFile: this.sourceFile,
      resourceType,
      resourceName,
      resourceIdentifiers,
      resourceParams,
    });
    const hcl = resource.generate();
    return this.insertHere(hcl);
  };

  hclInterpolate = (value = requiredParam('value')) => {
    if (typeof value !== 'string') {
      throw new Error('Invalid type');
    }
    return `\${${value}}`;
  };
}

export default Sandbox;
