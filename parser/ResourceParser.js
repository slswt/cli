import get from 'lodash/get';
import flowRight from 'lodash/flowRight';
import snakeCase from 'lodash/snakeCase';
import applyReplace from './utils/applyReplace';

class Resources {
  /* resource "aws_wef_wef" "somename" { */
  static getSpecificRe({ service, name }) {
    return new RegExp(
      `^\\s*resource\\s+"(${service})"\\s+"(${name})"\\s*{`,
      'gm',
    );
  }

  constructor(hcl) {
    this.hcl = hcl;
    this.definitionRe = /^\s*resource\s+"([^"]+)"\s+"([^"]+)"\s*\{/gm;
  }

  execRe() {
    const result = this.definitionRe.exec(this.hcl);
    const service = get(result, 1);
    const name = get(result, 2);
    if (!service || !name) {
      return false;
    }
    return {
      service,
      name,
    };
  }

  get definitions() {
    let definition = this.execRe();
    const definitions = [];
    while (definition) {
      definitions.push(definition);
      definition = this.execRe();
    }
    return definitions;
  }

  withPrefixedResources(prefix) {
    return flowRight(
      ...this.definitions.map(({ name, service }) => {
        const re = Resources.getSpecificRe({ name, service });
        const prefixedName = snakeCase(`${prefix}_${name}`);
        return flowRight(
          applyReplace(re, `\nresource "${service}" "${prefixedName}" {`),
          applyReplace(new RegExp(`${service}.${name}`, 'mg'), `${service}.${prefixedName}`),
        );
      }),
    );
  }
}

export default Resources;
