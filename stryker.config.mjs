/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  testRunner: 'vitest',
  vitest: {
    configFile: 'vitest.config.ts',
  },
  mutate: ['src/lib/**/*.ts', '!src/lib/**/*.test.ts', '!src/lib/**/*.d.ts'],
  reporters: ['html', 'clear-text', 'progress'],
  htmlReporter: {
    fileName: 'reports/mutation/index.html',
  },
  coverageAnalysis: 'perTest',
  timeoutMS: 30000,
  concurrency: 2,
};

export default config;
