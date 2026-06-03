/**
 * Jest configuration for the backend.
 *
 * Tests live next to the code they cover (e.g. src/modules/auth/auth.test.js)
 * plus cross-module integration tests under tests/integration.
 */
module.exports = {
  testEnvironment: "node",
  testMatch: [
    "**/src/**/*.test.js",
    "**/tests/**/*.test.js",
  ],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/*.test.js",
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  clearMocks: true,
  verbose: true,
};
