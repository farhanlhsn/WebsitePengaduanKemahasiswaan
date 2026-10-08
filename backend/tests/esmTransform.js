/**
 * Jest config fragment shared by the unit and integration configs.
 *
 * sanitize-html >= 2.18 depends on htmlparser2 12, which (with its dom*
 * helpers and entities) ships as ES modules only. Node 20.19+ can require()
 * them directly, but Jest's own module loader cannot, so these packages are
 * transpiled to CommonJS for tests only. Project files are left untouched.
 */
const ESM_PACKAGES = [
  'htmlparser2',
  'domhandler',
  'domutils',
  'domelementtype',
  'dom-serializer',
  'entities',
];

module.exports = {
  transform: {
    [`/node_modules/(${ESM_PACKAGES.join('|')})/.+\\.js$`]: [
      'babel-jest',
      {
        babelrc: false,
        configFile: false,
        plugins: [
          '@babel/plugin-transform-export-namespace-from',
          '@babel/plugin-transform-modules-commonjs',
        ],
      },
    ],
    // Overriding `transform` drops Jest's default, so restore it for every
    // other file (it hoists jest.mock calls above require()).
    '\\.[jt]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [`/node_modules/(?!(${ESM_PACKAGES.join('|')})/)`],
};
