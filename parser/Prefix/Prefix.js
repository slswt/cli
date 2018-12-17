import requiredParam from '../utils/requiredParam';
import getResourcePrefix from '../utils/getResourcePrefix';

class Prefix {
  constructor({
    hcl = requiredParam('hcl'),
    relativeSourceFile = requiredParam('relativeSourceFile'),
  }) {
    this.hcl = hcl;
    this.relativeSourceFile = relativeSourceFile;
  }

  prefix() {
    /* single valued */
    const outputRe = /(output\s+")([^"]+"\s*\{)/gm;
    const moduleRe = /(module\s+")([^"]+"\s*\{)/gm;
    /* dual valued */
    const resourceRe = /(resource\s+"[^"]+"\s+")([^"]+"\s*\{)/gm;
    const dataRe = /(data\s+"[^"]+"\s+")([^"]+"\s*\{)/gm;

    /* prefix interpolations */
    /* find interpolation in strings */
    const interpolationRe = /"(.*\$\{[^}]+\}.*)+"/gm;

    /* replace module with prefix */
    const moduleInterpolationInnerRe = /(module\.)([^.]+)/gm;
    /* replace data with prefix */
    const dataInterpolationInnerRe = /(data\.[^.]+\.)([^.]+)/gm;

    const othersInterpolationInnerRe = /\$\{[\s]*(?:.+\()?([^.{}()]+)\.[^.{}()]+\.[\s\S]+\}/gm;

    const prx = getResourcePrefix(this.relativeSourceFile);

    const replaceString = `$1${prx}_$2`;

    return (
      this.hcl
        /* prefixes all of the output with the folder path but in snake case */
        .replace(outputRe, replaceString)
        /* prefixes all of the modules with the folder path but in snake case */
        .replace(moduleRe, replaceString)
        /* Prefixes all data */
        .replace(dataRe, replaceString)
        /* Prefixes all resources */
        .replace(resourceRe, replaceString)
        /* prefixes all of the modules, resources, variables etc... used in interpolation */
        .replace(interpolationRe, (searchValue) =>
          searchValue
            /* do replacements for data and modules */
            .replace(dataInterpolationInnerRe, replaceString)
            .replace(moduleInterpolationInnerRe, replaceString)
            .replace(othersInterpolationInnerRe, (s, r) => {
              if (['data', 'module'].includes(r)) {
                return s;
              }
              const nameRegex = new RegExp(`(${r}\\.)([^.]+)`, 'mg');
              return s.replace(nameRegex, replaceString);
            }))
    );
  }
}

export default Prefix;
