module.exports = { 
  appname: "@dzangolab/generator-dzangolab-iac",
  buildCommand: () => null,
  publishCommand: ({ isYarn, tag, defaultCommand, dir }) => {
    return "npm publish --access public";
  },
};
