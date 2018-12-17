
const applyReplace = (re, replace) => (hcl) => hcl.replace(re, replace);

export default applyReplace;
