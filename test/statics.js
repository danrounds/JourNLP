const chai = require('chai');
const chaiHttp = require('chai-http');
// const faker = require('faker'); --    we'll install and use this later for
//                                       database testing
// const mongoose = require('mongoose'); see above

// lets us use THING.should.have/THING.should.be-style constructs
const should = chai.should();

const { TEST_DATABASE_URL } = require('../config');
const { app, runServer, closeServer } = require('../server');

chai.use(chaiHttp);

describe('Pages', function() {

    before(() => runServer(TEST_DATABASE_URL);

    after(() => closeServer());

    describe('index.html', function() {
        let res;
        it('should return a 200 status code', function() {
            return chai.request(app)
                .get('/')
                .then((res_) => {
                    res = res_;
                    res.should.have.status(200) });
        });
        it('should return html', function() {
            res.should.be.html;
        });
    });

    describe('Text entry page (write-entry.html)', function() {
        let res;
        it('should return a 200 status code', function() {
            return chai.request(app)
                .get('/write-entry.html')
                .then((res_) => {
                    res = res_;
                    res.should.have.status(200)});
        });
        it('should return html', function() {
            res.should.be.html;
        });
    });

    describe('Entry-view page (view-entry.html)', function() {
        let res;
        it('should return a 200 status code', function() {
            return chai.request(app)
                .get('/view-entry.html')
                .then((res_) => {
                    res = res_;
                    res.should.have.status(200)});
        });
        it('should return html', function() {
            res.should.be.html;
        });
    });

    describe('Entries lists page', function() {
        let res;
        it('should return a 200 status code', function() {
            return chai.request(app)
                .get('/listings.html')
                .then((res_) => {
                    res = res_;
                    res.should.have.status(200)});
        });
        it('should return html', function() {
            res.should.be.html;
        });
    });

    describe('Listings analysis page', function() {
        let res;
        it('should return a 200 status code', function() {
            return chai.request(app)
                .get('/analysis.html')
                .then((res_) => {
                    res = res_;
                    res.should.have.status(200)});
        });
        it('should return html', function() {
            res.should.be.html;
        });
    });
});
