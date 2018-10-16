// Add tests for:
// - GET /user_account
// - PUT /user_account
// - DELETE /user_account

const chai = require('chai');
const chaiHttp = require('chai-http');

// const { Entry, UserAccount } = require('../api');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL, TEST_PORT } = require('../config');
const { tearDownDb, seedDb } = require('./_setup');

// Lets us use THING.should.have/THING.should.be-style constructs
const should = chai.should();
chai.use(chaiHttp);

const isBase64 = /^[A-Za-z0-9+/\-=_]+$/i;
// This is a really liberal regex, because base64 encodings can vary a little
// bit. `-` and '_' aren't standard, but they're what our encoder seems to use

// Our actual tests
describe('Journal/notes entries API endpoints,', function() {
    let dataToSend;
    this.timeout(5000);

    before(() => Promise.all([runServer(TEST_DATABASE_URL, TEST_PORT), tearDownDb()]));
    beforeEach(() => seedDb()
               .then(data => dataToSend = data));
    afterEach(() => tearDownDb());
    after(() => closeServer());

    describe('POST endpoint :: /api/user_account/', () => {
        // Strategy:
        // 1. POST new user account { username, password }
        // 2. Check to see that our response looks like a three-field JWT,
        //    i.e. three period-separated base64-encoded strings
        it('should return a JWT token', () => chai.request(app)
           .post('/api/user_account')
           .send({ username: 'made-up-name-guy',
                   password: '123fakestreet' })
           .then(res => {
               const jwtTokenParts = res.body.split('.');
               jwtTokenParts.should.have.length(3);
               for (const part of jwtTokenParts) {
                   isBase64.test(part).should.be.true;
               }
           }));

        it('should fail if we forget a password', () => chai.request(app)
           .post('/api/user_account')
           .send({ username: 'made-up-name-guy' })
           .catch(res => res.should.have.status(400)));

        it('should fail if we forget a username', () => chai.request(app)
           .post('/api/user_account')
           .send({ password: 'abc123' })
           .catch(res => res.should.have.status(400)));
    });

    describe('POST endpoint :: /api/log_in/', () => {
        // Strategy:
        // 1. Send POST log in request to /api/log_in
        // 2. Check response to see whether it looks like a three-field
        //    JWT authentication token, i.e. three period-separated
        //    base64-encoded strings
        it('should return a JWT token', () => {
            let { username, password } = dataToSend;
            return chai.request(app)
                .post('/api/log_in')
                .send({ username, password })
                .then(res => {
                    const jwtTokenParts = res.body.split('.');
                    jwtTokenParts.should.have.length(3);
                    for (const part of jwtTokenParts) {
                        isBase64.test(part).should.be.true;
                    }
                });
        });

        it('should fail if we request a non-existent user', () => {
            // Strategy: Make bad request, observe error code
            let { username, password } = dataToSend;
            username += 'some_standard_nonsense';

            return chai.request(app)
                .post('/api/log_in')
                .send({ username, password })
                .catch(res => res.should.have.status(404));
        });

        it('should fail if we user the wrong password', () => {
            // Strategy: Make bad request, observe error code
            let { username, password } = dataToSend;
            password += '!@#%!@%';

            return chai.request(app)
                .post('/api/log_in')
                .send({ username, password })
                .catch(res => res.should.have.status(401));
        });
    });
});
