const chai = require('chai');
const chaiHttp = require('chai-http');

const { TEST_DATABASE_URL, TEST_PORT } = require('../config');
const { app, runServer, closeServer } = require('../server');

// lets us use THING.should.have/THING.should.be-style constructs
const should = chai.should();
chai.use(chaiHttp);

describe('Pages', function() {
    // In retrospect, testing whether or not static files serve is kind of a
    // waste of time. Still kind of gratifying watching them pass, though.
    // I guess that worst case, it tells us we haven't done anything
    // catastrophically wrong
    function testEndpoint(getEndpoint) {
        let res;
        it('should return a 200 status code', () => chai.request(app)
           .get(getEndpoint)
           .then((res_) => {
               res = res_;
               res.should.have.status(200);
           }));
        it('should return html', () => res.should.be.html);
    }

    before(() => runServer(TEST_DATABASE_URL, TEST_PORT));
    after(() => closeServer());

    describe('Index', () => testEndpoint('/'));
    describe('Sign up/Log in page (sign-up-or-in.html)', () => testEndpoint('/sign-up-or-in.html'));
    describe('Text entry page (write-entry.html)', () => testEndpoint('/write-entry.html'));
    describe('Entry-view page (view-entry.html)', () => testEndpoint('/view-entry.html'));
    describe('Entries lists page (listings.html)', () => testEndpoint('/listings.html'));
    describe('Listings analysis page (analysis.html)', () => testEndpoint('/analysis.html'));
});
