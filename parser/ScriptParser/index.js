import fs from 'fs';
import path from 'path';
import vm from 'vm';
import get from 'lodash/get';
import last from 'lodash/last';
import requiredParam from '../utils/requiredParam';
import getMatches from './getMatches';
import replaceMatches from './replaceMatches';
import Prefix from '../Prefix/Prefix';
import getRelativePath from '../utils/getRelativePath';
import changeRelativeModuleDirectory from '../changeRelativeModuleDirectory';
import matchesToSingleArray from './matchesToSingleArray';
import Sandbox from './Sandbox';
import HclPrettier from '../HclPrettier';

class ScriptParser {
  constructor({
    hcl = requiredParam('hcl'),
    deploymentParams = requiredParam('deploymentParams'),
    sourceFile = requiredParam('sourceFile'),
    deployFolder = requiredParam('deployFolder'),
    rootFolder = requiredParam('rootFolder'),
    alreadyIncludedFiles = [],
  }) {
    this.hcl = hcl;
    this.deploymentParams = deploymentParams;
    this.sourceFile = sourceFile;
    this.deployFolder = deployFolder;
    this.rootFolder = rootFolder;
    this.alreadyIncludedFiles = alreadyIncludedFiles;

    this.includes = [];
    this.inserts = [];
    this.inplaceInserts = [];
    this.references = [];
  }

  addDeploymentPlatform = ({ newDeploymentParams, log }) => {
    console.log(
      `As the folloing: ${log}\n`,
      'is referenced under another platform',
      'this needs to be deployed separately',
    );
    /* @todo add functionality for adding deployment platform */
  };

  addInclude = ({
    fpath = requiredParam('fpath'),
    deploymentParams = requiredParam('deploymentParams'),
  }) => {
    this.includes.push({
      fpath,
      deploymentParams,
    });
  };

  addInsert = ({
    hcl = requiredParam('hcl'),
    deploymentParams = requiredParam('deploymentParams'),
  }) => {
    this.inserts.push({ hcl, deploymentParams });
  };

  addInplaceInsert = ({
    value = requiredParam('value'),
    id = requiredParam('id'),
  }) => {
    this.inplaceInserts.push({
      value,
      id,
    });
  };

  registerReference = ({
    sourceFile = requiredParam('sourceFile'),
    type = requiredParam('type'),
    name = requiredParam('name'),
    key = requiredParam('key'),
    deploymentParams = requiredParam('deploymentParams'),
  }) => {
    /* @todo */
  };

  evalScripts(scripts) {
    scripts.forEach(({ code, id, line }) => {
      const sandbox = new Sandbox({
        id,
        deploymentParams: this.deploymentParams,
        sourceFile: this.sourceFile,
        rootFolder: this.rootFolder,
        addDeploymentPlatform: this.addDeploymentPlatform,

        addInclude: this.addInclude,
        addInsert: this.addInsert,
        addInplaceInsert: this.addInplaceInsert,
        registerReference: this.registerReference,
      });
      const context = sandbox.getContext();
      vm.createContext(context); // Contextify the sandbox.
      try {
        vm.runInContext(code, context);
      } catch (err) {
        console.log(code, `@ line ${line} in ${this.sourceFile}`);
        throw new Error(err.stack);
      }
    });
  }

  parse() {
    const matches = matchesToSingleArray(getMatches('```', this.hcl));

    /* This will be a bunch of side effects */
    this.evalScripts(
      matches
        .map((props) => ({ ...props, id: props.index }))
        .filter(({ type }) => type === 'match'),
    );

    const generateInsertableHcl = ({ hcl, deploymentParams, sourceFile }) => {
      const parser = new ScriptParser({
        hcl,
        deploymentParams: {
          deploymentParams,
          ...this.deploymentParams,
        },
        sourceFile,
        rootFolder: this.rootFolder,
        deployFolder: this.deployFolder,
        alreadyIncludedFiles: this.alreadyIncludedFiles,
      });
      return parser.parse();
    };

    const includes = this.includes.map(({ fpath, deploymentParams }) => {
      const hcl = fs.readFileSync(fpath).toString();
      return generateInsertableHcl({
        hcl,
        deploymentParams,
        sourceFile: fpath,
      });
    });

    const inserts = this.inserts.map(({ hcl, deploymentParams }) =>
      generateInsertableHcl({
        hcl,
        deploymentParams,
        sourceFile: this.sourceFile,
      }));

    const inplaceInserts = this.inplaceInserts.reduce(
      (a, { value, id }) => ({
        ...a,
        [id]: a[id] ? `${a[id]}\n${value}` : value,
      }),
      {},
    );
    let parsedHcl = replaceMatches({
      hcl: this.hcl,
      matches,
      matcher: '```',
      replacer: ({ code, type, index }) => {
        if (type === 'match') {
          return inplaceInserts[index];
        }

        const prefixer = new Prefix({
          hcl: code,
          relativeSourceFile: getRelativePath(this.rootFolder, this.sourceFile),
        });
        const prefixedHcl = prefixer.prefix();
        const bakedHcl = changeRelativeModuleDirectory({
          hcl: prefixedHcl,
          oldFolder: path.parse(this.sourceFile).dir,
          newFolder: this.deployFolder,
        });
        return bakedHcl;
      },
    });

    parsedHcl += includes.join('\n');
    parsedHcl += inserts.join('\n');

    return parsedHcl;
  }
}

export default ScriptParser;
