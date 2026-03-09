/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  testMatch: ['**/tests/**/*.test.js'],
  clearMocks: true,
  // Variabel env untuk test
  testTimeout: 15000
};
