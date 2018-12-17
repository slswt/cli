const get = require('lodash/get');
const flowRight = require('lodash/flowRight');
const camelCase = require('lodash/camelCase');
const Resources = require('./Resources');

const outputDefinitionRe = /^\s*output\s+"([^"]+)"\s*\{/gm;
const moduleDefinitionRe = /^\s*module\s+"([^"]+)"\s*\{/gm;
const dataDefinitionRe = /^\s*data\s+"[^"]+"\s+"([^"]+)"\s*\{/gm;

/* prefix interpolations */
/* find interpolation in strings */
const interpolationRe = /"(.*\$\{[^}]+\}.*)+"/gm;

/* replace module with prefix */
const moduleInterpolationRe = /module\.([^.]+)/gm;
/* replace data with prefix */
const dataInterpolationRe = /data\.[^.]+\.([^.]+)/gm;

const resourceInterpolationRe = /\$\{[\s]*(?:.+\()?([^.{}()]+)\.[^.{}()]+\.[\s\S]+\}/gm;

class HclParser {
  constructor(hcl) {
    this.hcl = hcl;
  }

  getResources() {
    if (this.resources) {
      return this.resources;
    }
    this.resources = new Resources(this.hcl);
    return this.resources;
  }


  parse(prefix) {
    /* prefix resources */
    const resources = this.getResources();
    const withResourcePrefix = resources.withPrefixedResources(prefix);
    
  }
}
