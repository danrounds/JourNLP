// Things you could add:
//  - Tests for bad input

const chai = require('chai');
const chaiHttp = require('chai-http');

const { Entry } = require('../api');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL, TEST_PORT } = require('../config');
const { tearDownDb, seedDb } = require('./_setup');
const { generateEntry } = require('./_fake');

// Lets us use THING.should.have/THING.should.be-style constructs
const should = chai.should();
chai.use(chaiHttp);

// Our actual tests
describe('Journal/notes entries API endpoints,', function() {
    let dataToSend;
    this.timeout(5000);

    before(() => Promise.all([runServer(TEST_DATABASE_URL, TEST_PORT), tearDownDb()]));
    beforeEach(() => seedDb()
               .then(data => dataToSend = data));
    afterEach(() => tearDownDb());
    after(() => closeServer());

    describe('GET endpoint :: /api/entries/.*', () => {
        // Strategy:
        //  1. GET journal entries (via server...and indirectly, our db)
        //  2. Check returned status # and data type of response
        //  3. Make sure returned entries's N equals the number of records we
        //     populated our db with
        it('should return all of our entries', () => {
            let res;
            return chai.request(app)
                .get('/api/entries')
                .set('Authorization', `Bearer ${dataToSend.token}`)
                .then((_res) => {
                    res = _res;
                    res.should.have.status(200);
                    return Entry.count(); // This is an async action
                })
                .then(count => { res.body.should.have.length.of(count); });
        });

        it('should return entries (records) with the right fields and data', () => {
            // Strategy:
            //  1. GET journal entries, via server (& db-backing)
            //  2. Make sure response is a JSON array (as per our API)
            //  3. Check that required keys are present in our response
            //  4. Make sure our response's fields match the fields in the
            //     corresponding database record
            let resEntry;       // this'll be array[0], of our response
            return chai.request(app)
                .get('/api/entries')
                .set('Authorization', `Bearer ${dataToSend.token}`)
                .then(res => {
                    res.should.be.json;
                    res.body.should.be.a('array');
                    res.body.should.have.length.of.at.least(1);

                    res.body.forEach(entry => {
                        entry.should.be.a('object');
                        entry.should.include.keys(
                            'title', 'body', 'author', 'nlpTopics');
                    });
                    resEntry = res.body[0];
                    // \/ Look up db entry that corresponds with response[0]
                    return Entry.findById(resEntry.id).exec();
                })
                .then(entryRecord => {
                    resEntry.id.should.equal(entryRecord.id);
                    resEntry.title.should.equal(entryRecord.title);
                    resEntry.body.should.equal(entryRecord.body);
                    resEntry.author.should.equal(entryRecord.author);
                    resEntry.nlpTopics.join().should.equal(entryRecord.nlpTopics.join());
                });
        });

        it('should return a specific journal/note entry if accessed as /api/entries/:id endpoint', () => {
            // Strategy:
            //  1. `fineOne` entry from the database and extracts its id
            //  2. Make a get request to /api/entries/:id (the id from above)
            //  3. Check that the response has the right status and that all
            //     its fields match the database entry's fields
            let record;
            return Entry
                .findOne()
                .exec()
                .then((_record) => {
                    record = _record;
                    return chai.request(app)
                        .get(`/api/entries/${record.id}`)
                        .set('Authorization', `Bearer ${dataToSend.token}`);
                })
                .then((res) => {
                    res.should.have.status(200);
                    const entry = res.body;
                    entry.id.should.equal(record.id);
                    entry.title.should.equal(record.title);
                    entry.author.should.equal(record.author);
                    entry.body.should.equal(record.body);
                    entry.nlpTopics.join().should.equal(record.nlpTopics.join());
                });
        });

        it('should fail on bad authorization', () => chai.request(app)
           .get('/accounts')
           .set('Authorization', `Bearer ${dataToSend.token+123}`) // bad token
           .catch(res => res.status.should.equal(404)));
    });

    describe('POST endpoint :: /api/entries/', () => {
        // Strategy:
        //  1. Generate random JSON data for a new journal entry
        //  2. Make POST request
        //  3. Check status and compare server response to the data we
        //     generated/submitted. They should obviously be the same
        //  4. Examine the relevant database entry to see if it also matches
        //     the response
        it('should add a new entry', () => {
            // Random `entry' data:
            const submittedEntry = generateEntry(dataToSend.username);

            return chai.request(app)
                .post('/api/entries')
                .set('Authorization', `Bearer ${dataToSend.token}`)
                .send(submittedEntry)
                .then((res) => {
                    // Compare our response to the object we created:
                    res.should.have.status(201);
                    res.should.be.json;
                    res.body.should.include.keys('title', 'body', 'author');
                    res.body.title.should.equal(submittedEntry.title);
                    res.body.body.should.equal(submittedEntry.body);
                    res.body.author.should.equal(submittedEntry.author);
                    // And now return the relevant database entry:
                    return Entry.findById(res.body.id);
                })
                .then((dbEntry) => {
                    dbEntry.title.should.equal(submittedEntry.title);
                    dbEntry.body.should.equal(submittedEntry.body);
                    dbEntry.author.should.equal(dataToSend.username);
                });
        });

        describe('PUT endpoint :: /api/entries/:id', () => {
            // Strategy:
            //  1. Generate random data for the fields that we'll replace with
            //     our PUT request
            //  2. Find a(n arbitrary) journal entry in our database and
            //     extract the id
            //  3. Make a PUT request using the id above, and our new fields
            //  4. KEY: examine the response code and compare the new database
            //     record with the object we sent in our put request; fields
            //     should be the same in both
            it('should update the fields that we specify, in our entry', () => {
                // const updateData = {
                //     body: faker.lorem.paragraphs(10),
                //     title: faker.random.words()
                // };
                const updateData = generateEntry();

                return Entry
                    .findOne()
                    .exec()
                    .then((dbEntry) => {
                        // Body's id needs to equal /api/entries/:id
                        updateData.id = dbEntry.id;

                        return chai.request(app)
                            .put(`/api/entries/${dbEntry.id}`)
                            .set('Authorization', `Bearer ${dataToSend.token}`)
                            .send(updateData);
                    })
                    .then((res) => {
                        res.should.have.status(201);
                        // Return our database record, for examination:
                        return Entry.findById(updateData.id).exec();
                    })
                    .then((dbEntry) => {
                        dbEntry.body.should.equal(updateData.body);
                        dbEntry.title.should.equal(updateData.title);
                    });
            });
        });

        describe('DELETE endpoint :: /api/entries/:id', () => {
            // Strategy:
            //  1. Arbitrarily get a database record & extract its id
            //  2. Make DELETE request using this id
            //  3. Check response's status code and wee whether a record
            //     with that id exists in our database
            it('should delete records upon DELETE request', () => {
                let dbEntry;
                return Entry
                    .findOne()
                    .exec()
                    .then((_dbEntry) => {
                        dbEntry = _dbEntry;
                        // Make request using our db entry's id
                        return chai.request(app)
                            .delete(`/api/entries/${dbEntry.id}`)
                            .set('Authorization', `Bearer ${dataToSend.token}`);
                    })
                    .then((res) => {
                        res.should.have.status(204);
                        // Post-DELETE, we'll try to find the submitted entry in
                        // our database \/
                        return Entry.findById(dbEntry.id).exec();
                    })
                    .then((allegedlyDeleted) => {
                        // Here's hoping that Entry.findById(...) doesn't exist
                        should.not.exist(allegedlyDeleted);
                    });
            });
        });
    });
});
