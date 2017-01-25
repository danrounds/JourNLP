const chai = require('chai');
const chaiHttp = require('chai-http');
// const faker = require('faker'); --    we'll install and use this later for
//                                       database testing
// const mongoose = require('mongoose'); see above

// lets us use THING.should.have/THING.should.be-style constructs
const should = chai.should();

const {app} = require('../server');

chai.use(chaiHttp);

describe('Server', function() {
    describe('GET endpoint', function() {
        it('should return a 200 status code', function() {
            return chai.request(app)
                .get('/')
                .then((res) => res.should.have.status(200));
        });
    });
});

describe('Pages', function() {
    describe('Text entry page', function() {
        it('should return a 200 status code', function() {
            return chai.request(app)
                .get('/entry.html')
                .then((res) => res.should.have.status(200));
        });
    });

    describe('Editing page', function() {
        it('should return a 200 status code', function() {
            return chai.request(app)
                .get('/edit.html')
                .then((res) => res.should.have.status(200));
        });
    });

    describe('Entry listings page', function() {
        it('should return a 200 status code', function() {
            return chai.request(app)
                .get('/listings.html')
                .then((res) => res.should.have.status(200));
        });
    });

    describe('Listings analysis page', function() {
        it('should return a 200 status code', function() {
            return chai.request(app)
                .get('/analysis.html')
                .then((res) => res.should.have.status(200));
        });
    });


});
