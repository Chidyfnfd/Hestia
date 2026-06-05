module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['./jest.setup.js'],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      lines: 85,
      functions: 85,
      branches: 85,
      statements: 85,
    },
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/vendor/'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss)$': '<rootDir>/__mocks__/styleMock.js',
  },
  // Excluir tests E2E de Jest (los corre Playwright, no Jest)
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',
    '\\.spec\\.js$',
  ],
  // Solo incluir archivos de tests unitarios e integración
  testMatch: [
    '**/tests/unit/**/*.test.[jt]s?(x)',
    '**/tests/integration/**/*.test.[jt]s?(x)',
  ],
};