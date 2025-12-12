module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    collectCoverageFrom: ['**/*.js', '!**/node_modules/**', '!**/coverage/**'],
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50,
        },
    },
};
