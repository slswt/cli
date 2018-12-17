const pkgDir = require('pkg-dir');
const snakeCase = require('lodash/snakeCase');
const get = require('lodash/get');
const fs = require('fs-extra');
const md5 = require('@slswt/utils/md5');
const glob = require('glob');
const path = require('path');
const vm = require('vm');
const confirmFileCreation = require('../../utils/confirmFileCreation');
const liveTemplate = require('../../utils/liveTemplate');
const askForRegion = require('../../utils/askForRegion');
const getDeployURI = require('../../utils/getDeployURI');
const getReleaseInfo = require('../../utils/getReleaseInfo');
const getDeploymentParams = require('../../utils/getDeploymentParams');
const readServiceParseDeploymentParams = require('../../utils/readServiceParseDeploymentParams');

const platformDeploymentData = () => {
  const data = JSON.stringify(
    {
      accountId: '325685129213',
      region: 'eu-central-1',
    },
    null,
    2,
  );
  const key = md5(data).substr(0, 6);
  return {
    data,
    key,
  };
  // if (platform === 'aws') {
  //   return {
  //     accountId: '123123123',
  //     region: 'eu-central-1',
  //   };
  // }
  // if (platform === 'cloudflare') {
  //   return {
  //     zone: '123123123',
  //   };
  // }
  // return {};
};

const changeModuleDirectory = (hcl, oldFolder, newFolder) => {
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

const included = [];

const getOutput = (sourceContent, moduleName) => {
  const re = /^output\s+"([^"]+)"\s+\{\s+value/gm;

  let match = get(re.exec(sourceContent), 1);
  const matches = [];
  while (match) {
    matches.push(match);
    match = get(re.exec(sourceContent), 1);
  }
  const hclOutputs = matches
    .map(
      (name) => `
output "${name}" {
  value = "\${module.${moduleName}.${name}}"
}
`,
    )
    .join('\n');
  return hclOutputs;
};

const prefix = (relativeSourceFolder, replaceValue) =>
  snakeCase(path.join(relativeSourceFolder, replaceValue));

const evalScripts = (
  sourceContent,
  sourceFolder,
  liveFolder,
  rawParams,
  rootDir,
) => {
  const scriptRe = /^```([\s\S]+(?!```))(```)/gm;
  let match = get(scriptRe.exec(sourceContent), 1);
  const matches = [];
  while (match) {
    matches.push(match);
    match = get(scriptRe.exec(sourceContent), 1);
  }

  const additionalContent = [];

  const code = matches.join('\n');
  const sandbox = {
    ...rawParams,
    fs,
    path,
    __dirname: sourceFolder,
    include: (fpath) => {
      if (!included.includes(fpath)) {
        return;
      }
      included.push(fpath);
      const hcl = fs.readFileSync(fpath);

      const parsed = evalScripts(hcl, path.parse(fpath).dir, liveFolder);

      additionalContent.push(parsed);
    },
  };
  vm.createContext(sandbox); // Contextify the sandbox.
  vm.runInContext(code, sandbox);

  /* single valued */
  const outputRe = /^output\s+"([^"]+)"\s*\{/gm;
  const moduleRe = /^module\s+"([^"]+)"\s*\{/gm;
  /* dual valued */
  const resourceRe = /^resource\s+"[^"]+"\s+"([^"]+)"\s*\{/gm;
  const dataRe = /^data\s+"[^"]+"\s+"([^"]+)"\s*\{/gm;

  /* prefix interpolations */
  /* find interpolation in strings */
  const interpolationRe = /"(.*\$\{[^}]+\}.*)+"/gm;

  /* replace module with prefix */
  const moduleInterpolationInnerRe = /module\.([^.]+)/gm;
  /* replace data with prefix */
  const dataInterpolationInnerRe = /data\.[^.]+\.([^.]+)/gm;

  const othersInterpolationInnerRe = /\$\{[\s]*(?:.+\()?([^.{}()]+)\.[^.{}()]+\.[\s\S]+\}/gm;

  const relativeSourceFolder = sourceFolder.replace(rootDir, '');

  const stripped = sourceContent
    .replace(scriptRe, '')
    /* prefixes all of the output with the folder path but in snake case */
    .replace(outputRe, (searchValue, replaceValue) =>
      searchValue.replace(
        replaceValue,
        prefix(relativeSourceFolder, replaceValue),
      ))
    /* prefixes all of the modules with the folder path but in snake case */
    .replace(moduleRe, (searchValue, replaceValue) =>
      searchValue.replace(
        replaceValue,
        prefix(relativeSourceFolder, replaceValue),
      ))
    /* Prefixes all data */
    .replace(dataRe, (searchValue, replaceValue) =>
      searchValue.replace(
        replaceValue,
        prefix(relativeSourceFolder, replaceValue),
      ))
    /* Prefixes all resources */
    .replace(resourceRe, (searchValue, replaceValue) =>
      searchValue.replace(
        replaceValue,
        prefix(relativeSourceFolder, replaceValue),
      ))
    /* prefixes all of the modules, resources, variables etc... used in interpolation */
    .replace(interpolationRe, (searchValue, replaceValue) =>
      searchValue
        .replace(
          replaceValue,
          replaceValue
            /* do replacements for data and modules */
            .replace(dataInterpolationInnerRe, (s, r) =>
              s.replace(r, prefix(relativeSourceFolder, r)))
            .replace(moduleInterpolationInnerRe, (s, r) =>
              s.replace(r, prefix(relativeSourceFolder, r))),
        )
        .replace(othersInterpolationInnerRe, (s, r) => {
          if (['data', 'module'].includes(r)) {
            return s;
          }
          return s.replace(r, prefix(relativeSourceFolder, r));
        }));

  const hcl = `
${stripped}
${additionalContent.join('\n\n')}
`;

  return changeModuleDirectory(hcl, sourceFolder, liveFolder);
};

module.exports = async (rootDir) => {
  const { join } = path;

  const slswtRc = JSON.parse(fs.readFileSync(join(rootDir, '.slswtrc')));
  const providers = JSON.parse(
    fs.readFileSync(join(rootDir, '.slswtrc.secrets')),
  );

  const { version, environment } = getReleaseInfo(rootDir);
  const { key: platformKey, data: platformData } = platformDeploymentData(
    providers,
  );
  const uri = join(slswtRc.projectId, environment, version, platformKey);

  const liveFolder = join(rootDir, '.Live', uri);
  const tfKey = join('.Live', uri, 'terraform.tfstate');

  const rawParams = getDeploymentParams(rootDir);
  // const parsedParams = readServiceParseDeploymentParams(dirname, rawParams);

  const concated = glob
    .sync(join(rootDir, '{services,data_stores}', '**', 'main.tf'))
    .map((hclEntryPath) => {
      const hcl = fs.readFileSync(hclEntryPath).toString();
      const sourceFolder = path.parse(hclEntryPath).dir;
      return evalScripts(hcl, sourceFolder, liveFolder, rawParams, rootDir);
    })
    .join('\n\n');

  console.log(concated);

  /* @TODO ask for which providers should be available */

  // const template = liveTemplate({
  //   stateBucket: slswtRc.tfRemoteStateBucket,
  //   stateBucketRegion: slswtRc.tfRemoteStateBucketRegion,
  //   moduleName,
  //   key,
  //   relativeSource: relative(liveFolder, dirname),
  //   liveFolder,
  //   sourceFolder: dirname,
  //   region,
  //   providers,
  //   parsedParams,
  //   sourceContent: fs.readFileSync(join(liveFolder, 'main.tf')),
  // });
};
