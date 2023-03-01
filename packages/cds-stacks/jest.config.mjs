export default {
  rootDir: '.',
  moduleFileExtensions: ['mjs', 'js', 'mts', 'ts'],
  transform: {
    '^.+\\.(mj|j|mt|t)s$': '@swc/jest'
  },
  setupFilesAfterEnv: ['./jest.setup.mjs'],
  testMatch: ['**/?(*.)spec.ts'],
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  coverageProvider: 'v8',
  clearMocks: true,
  restoreMocks: true
};
