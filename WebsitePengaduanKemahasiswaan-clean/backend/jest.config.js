module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  // Integration tests have their own config (tests/integration/jest.config.js)
  // and require Docker. Exclude them from the default `npm test` run.
  testPathIgnorePatterns: ['/node_modules/', '/tests/integration/'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/services/**/*.js',
    'src/middlewares/**/*.js',
    'src/controllers/**/*.js',
    '!src/**/index.js'
  ],
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40
    }
  },
  testTimeout: 10000
};
