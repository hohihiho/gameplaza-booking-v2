const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/src/(.*)$': '<rootDir>/src/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/components/(.*)$': '<rootDir>/app/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/app/hooks/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^lib/(.*)$': '<rootDir>/lib/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/tests/e2e/', // Playwright 테스트만 제외
    '<rootDir>/tests/puppeteer/', // Puppeteer 테스트 제외
    '<rootDir>/tests/k6/', // K6 테스트 제외
    '<rootDir>/cypress/', // Cypress 테스트 제외
    '\\.spec\\.js$', // Playwright 스펙 파일 제외
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'src/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/jest.setup.js',
    '!**/jest.config.js',
    '!src/mocks/**',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  transformIgnorePatterns: [
    'node_modules/(?!(isows|@supabase|ws|@cross-spawn|cross-spawn|@supabase/realtime-js|@supabase/supabase-js|jose|openid-client)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // 프로젝트별 설정
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/src/**/*.test.[jt]s?(x)',
        '<rootDir>/tests/unit/**/*.test.[jt]s?(x)',
      ],
      testPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/.next/',
        '<rootDir>/src/components/', // UI 컴포넌트 테스트 제외
        '<rootDir>/app/', // App 디렉토리 UI 테스트 제외
      ],
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/jest.env.setup.js'], // 환경 변수 로드
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@/src/(.*)$': '<rootDir>/src/$1',
        '^@/lib/(.*)$': '<rootDir>/lib/$1',
        '^@/app/(.*)$': '<rootDir>/app/$1',
        '^lib/(.*)$': '<rootDir>/lib/$1',
        '^src/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', { presets: ['next/babel'] }],
      },
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.[jt]s?(x)'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@/src/(.*)$': '<rootDir>/src/$1',
        '^@/lib/(.*)$': '<rootDir>/lib/$1',
        '^@/app/(.*)$': '<rootDir>/app/$1',
        '^lib/(.*)$': '<rootDir>/lib/$1',
        '^src/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', { presets: ['next/babel'] }],
      },
      transformIgnorePatterns: [
        'node_modules/(?!(isows|@supabase|ws|@cross-spawn|cross-spawn|@supabase/realtime-js|@supabase/supabase-js|jose|openid-client)/)',
      ],
    },
    {
      displayName: 'realdb',
      testMatch: ['<rootDir>/app/api/v2/__tests__/realdb/**/*.test.[jt]s?(x)'],
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/jest.env.setup.js'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@/src/(.*)$': '<rootDir>/src/$1',
        '^@/lib/(.*)$': '<rootDir>/lib/$1',
        '^@/app/(.*)$': '<rootDir>/app/$1',
        '^lib/(.*)$': '<rootDir>/lib/$1',
        '^src/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', { presets: ['next/babel'] }],
      },
      transformIgnorePatterns: [
        'node_modules/(?!(isows|@supabase|ws|@cross-spawn|cross-spawn|@supabase/realtime-js|@supabase/supabase-js|jose|openid-client)/)',
      ],
      testTimeout: 10000, // 실제 DB 연결 시간 고려
    },
    {
      displayName: 'component',
      testMatch: ['<rootDir>/app/**/*.test.[jt]s?(x)', '<rootDir>/src/components/**/*.test.[jt]s?(x)'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@/src/(.*)$': '<rootDir>/src/$1',
        '^@/lib/(.*)$': '<rootDir>/lib/$1',
        '^@/app/(.*)$': '<rootDir>/app/$1',
        '^lib/(.*)$': '<rootDir>/lib/$1',
        '^src/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', { presets: ['next/babel'] }],
      },
      transformIgnorePatterns: [
        'node_modules/(?!(isows|@supabase|ws|@cross-spawn|cross-spawn|@supabase/realtime-js|@supabase/supabase-js|jose|openid-client)/)',
      ],
    },
  ],
  coverageReporters: ['text', 'lcov', 'html'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)