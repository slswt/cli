import JsToHcl from './JsToHcl';
import HclPrettier from './HclPrettier';
import requiredParam from './utils/requiredParam';
import getRelativePath from './utils/getRelativePath';
import getResourcePrefix from './utils/getResourcePrefix';
import md5 from './utils/md5';

/* Generates a new resource */

class Resource {
  constructor({
    deploymentParams: {
      project = requiredParam('project'),
      environment = requiredParam('environment'),
      version = requiredParam('version'),
      platform = requiredParam('platform'),
    } = requiredParam('deploymentParams'),
    sourceFile = requiredParam('sourceFile'),
    rootFolder = requiredParam('rootFolder'),
    resourceType = requiredParam('resourceType'),
    resourceName = requiredParam('resourceName'),
    resourceIdentifiers = requiredParam('resourceIdentifiers'),
    resourceParams = requiredParam('resourceParams'),
  }) {
    this.deploymentParams = {
      project,
      environment,
      version,
      platform,
    };
    this.sourceFile = sourceFile;
    this.rootFolder = rootFolder;
    this.resourceType = resourceType;
    this.resourceName = resourceName;
    this.resourceIdentifiers = resourceIdentifiers;
    this.resourceParams = resourceParams;
  }

  generate() {
    const {
      project, environment, version, platform,
    } = this.deploymentParams;
    const relativeSourceFile = getRelativePath(
      this.rootFolder,
      this.sourceFile,
    );
    const resourcePrefix = getResourcePrefix(relativeSourceFile);
    const id = `${project}/${environment}/${version}/${platform}/${
      this.resourceType
    }.${resourcePrefix}_${this.resourceName}`;

    const hashName = `${project}-${md5(id).slice(0, 6)}`;

    let nameKey = this.resourceIdentifiers;
    let descriptionKey = null;
    if (Array.isArray(this.resourceIdentifiers)) {
      [nameKey, descriptionKey] = this.resourceIdentifiers;
    }

    const js = {
      ...this.resourceParams,
    };
    if (nameKey) {
      /* @todo should md5 the id */
      js[nameKey] = hashName;
    }
    if (descriptionKey) {
      js[descriptionKey] = id;
    }

    const stringifier = new JsToHcl(js);

    const hcl = `resource "${this.resourceType}" "${
      this.resourceName
    }" ${stringifier.stringify()}`;
    return hcl;
  }
}

export default Resource;
