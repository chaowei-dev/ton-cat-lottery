/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.spec.ts'
  ],
  
  // TypeScript configuration
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Module file extensions for importing
  moduleFileExtensions: [
    'ts', 'js', 'json'
  ],
  
  // Coverage settings
  collectCoverageFrom: [
    'build/**/*.compiled.json',
    '!build/**/*.d.ts',
    '!node_modules/**'
  ],
  
  // Test timeout (30 seconds for blockchain tests)
  testTimeout: 30000,
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Module resolution
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // Verbose output for better test reporting
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Collect coverage information
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/temp/'
  ],
  
  // TypeScript transformation configuration
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  }
};