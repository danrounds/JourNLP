module.exports = {
    DATABASE_URL:
    process.env.DATABASE_URL || global.DATABASE_URL
        || 'mongodb://localhost/journal-notes-app',

    TEST_DATABASE_URL:
    process.env.TEST_DATABASE_URL
        || 'mongodb://localhost/test-journal-notes-app',

    PORT: process.env.PORT || 8080,
    TEST_PORT: process.env.PORT || 8081,

    JWT_SECRET: process.env.JWT_SECRET || 'b01l34plat3_53c43t',
    JWT_SESSION: { session: false },
}
