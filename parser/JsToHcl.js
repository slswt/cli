import requiredParam from './utils/requiredParam';

class JsToHcl {
  constructor(js) {
    this.js = js;
  }

  stringify() {
    const unformated = this.main(this.js);
    return unformated;
  }

  main = (value = requiredParam('value')) => {
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value)) {
      return `[
        ${value.map(this.arrayItemString).join(',\n')}
      ]`;
    }
    return `{
      ${Object.entries(value)
      .map(this.keyValString)
      .join('\n')}
    }`;
  };

  keyValString = ([
    key = requiredParam('key'),
    value = requiredParam('value'),
  ]) => {
    let parsedValue;
    if (typeof value !== 'string') {
      parsedValue = this.main(value);
    } else {
      parsedValue = `"${value}"`;
    }
    return `${key} = ${parsedValue}`;
  };

  arrayItemString = (ival) => {
    let val;
    if (typeof ival !== 'string') {
      val = this.main(ival);
    } else {
      val = `"${ival}"`;
    }
    return val;
  };
}

export default JsToHcl;
