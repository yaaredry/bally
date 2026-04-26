module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  globalSetup: './tests/globalSetup.js',
  setupFiles: ['./tests/loadEnv.js'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',        // Server entry point — not testable via supertest
    '!src/socket/**/*.js',  // Socket.io handlers — tested separately if needed
  ],
  coverageThreshold: {
    global: { lines: 85, functions: 85, branches: 75, statements: 85 },
  },
  testTimeout: 30000,
  forceExit: true,
  maxWorkers: 1,
};
