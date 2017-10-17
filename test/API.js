// Things you could add:
//  - Tests for bad input

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

// lets us use THING.should.have/THING.should.be-style constructs
const should = chai.should();

const {nlpCategorize, Entry, UserAccount} = require('../api'); 
const Entries = Entry;               // mongoose likes singular nouns
const UserAccounts = UserAccount;    // ...but I don't

const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

const [username, password] = ['test_account', 'password'];

// populates our database with plausible-seeming journal-entry data
// function postEntries() {
function postEntries() {
    console.info('Seeding notes/journal-entry db records');

    const dbQueries = [];
    return UserAccounts.hashPassword(password)
        .then(hash => {
            UserAccounts
                .create({
                    username: username,
                    password: hash
                });
        })
        .then(() => {
            for (let i = 0; i < 10; i++) {
                dbQueries.push(Entries
                    .create(generateEntry())
                    .then(entry => {
                        UserAccounts
                            .findOne({username: username})
                            .exec()
                            .then(user => {
                                user.posts.push(entry._id);
                                user.save();
                            });
                    }));
            }
        })
        .then(() => Promise.all(dbQueries));
}

// Faker makes us some nice-looking fake journal entries
function generateEntry() {
    return  {
        title: faker.random.words(4),
        body: faker.lorem.paragraph() + '\n\n' +
            faker.lorem.paragraph() + '\n\n' +
            faker.lorem.paragraph() + '\n\n' +
            faker.lorem.paragraph() + '\n\n' +
            faker.lorem.paragraph() + '\n\n' +
            faker.lorem.paragraph() + '\n\n' +
            faker.lorem.paragraph() + '\n\n' +
            faker.lorem.paragraph(),
        author: username,
        nlpTopics: ['abc', 'def', 'ghi', 'jkl', 'mno']
        // publishedAt: faker.date.past()
        // lastupdatedAt: faker.date.future()
    };
}

function tearDownDb() {
    console.warn('Clearing db records');
    return mongoose.connection.dropDatabase();
}

// our actual tests
describe('Journal/notes entries API endpoints,', () => {

    console.log('CAVEAT: Asyncrous factors will sometimes cause the tests to fail.'
          +'If that happens, try re-running; they\'ll probably pass');

    before(() => {
        runServer(TEST_DATABASE_URL);
        return tearDownDb();
    });

    beforeEach(() => postEntries());

    afterEach(() => tearDownDb());

    after(() => closeServer());


    describe('GET endpoint :: /api/entries/.*', () => {
        // strategy:
        //  1. GET journal entries (via server...and indirectly, our db)
        //  2. check returned status # and data type of response
        //  3. make sure returned entries's N equals the number of records we
        //     populated our db with
        it('should return all of our entries', () => {
            let res;
            return chai.request(app)
                .get('/api/entries')
                .auth(username, password)
                .then((_res) => {
                    res = _res;
                    res.should.have.status(200);
                    return Entries.count();
                })
                .then((count) => { res.body.should.have.length.of(count); });
        });

        it('should return entries (records) with the right fields and data', () => {
            // strategy:
            //  1. GET journal entries, via server (& db-backing)
            //  2. make sure response is a JSON array (as per our API)
            //  3. check that required keys are present in our response
            //  4. make sure our response's fields match the fields in the
            //     corresponding database record
            let resEntry;       // this'll be array[0], of our response
            return chai.request(app)
                .get('/api/entries')
                .auth(username, password)
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
                    // \/ look up db entry that corresponds with response[0]
                    return Entries.findById(resEntry.id).exec();
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
            // strategy:
            //  1. `fineOne` entry from the database and extracts its id
            //  2. make a get request to /api/entries/:id (the id from above)
            //  3. check that the response has the right status and that all
            //     its fields match the database entry's fields
            let record;
            return Entries
                .findOne()
                .exec()
                .then((_record) => {
                    record = _record;
                    return chai.request(app)
                        .get(`/api/entries/${record.id}`)
                        .auth(username, password);
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
    });

    describe('POST endpoint :: /api/entries/', () => {
        // strategy:
        //  1. generate random JSON data for a new journal entry
        //  2. make POST request
        //  3. check status and compare server response to the data we
        //     generated/submitted. They should obviously be the same
        //  4. examine the relevant database entry to see if it also matches
        //     the response
        it('should add a new entry', () => {
            const submittedEntry = generateEntry(); // random `entry' data

            return chai.request(app)
                .post('/api/entries')
                .auth(username, password)
                .send(submittedEntry)
                .then((res) => {
                    // compare our response to the object we created
                    res.should.have.status(201);
                    res.should.be.json;
                    res.body.should.include.keys('title', 'body', 'author');
                    res.body.title.should.equal(submittedEntry.title);
                    // res.body.title.should.equal(submittedEntry.body.title);
                    res.body.body.should.equal(submittedEntry.body);
                    res.body.author.should.equal(submittedEntry.author);
                    // and now return the relevant database entry
                    return Entries.findById(res.body.id);
                })
                .then((dbEntry) => {
                    dbEntry.title.should.equal(submittedEntry.title);
                    dbEntry.body.should.equal(submittedEntry.body);
                    dbEntry.author.should.equal(username);
                });
        });

        describe('PUT endpoint :: /api/entries/:id', () => {
            // strategy:
            //  1. generate random data for the fields that we'll replace with
            //     our PUT request
            //  2. find a(n arbitrary) journal entry in our database and
            //     extract the id
            //  3. make a PUT request using the id above, and our new fields
            //  4. KEY: examine the response code and compare the new database
            //     record with the object we sent in our put request; fields
            //     should be the same in both
            it('should update the fields that we specify, in our entry', () => {
                const updateData = {
                    body: faker.lorem.paragraphs(10),
                    title: faker.random.words()
                };

                return Entries
                    .findOne()
                    .exec()
                    .then((dbEntry) => {
                        // body's id needs to equal /api/entries/:id
                        updateData.id = dbEntry.id;

                        return chai.request(app)
                            .put(`/api/entries/${dbEntry.id}`)
                            .auth(username, password)
                            .send(updateData);
                    })
                    .then((res) => {
                        res.should.have.status(201);
                        // return our database record, for examination
                        return Entry.findById(updateData.id).exec();
                    })
                    .then((dbEntry) => {
                        dbEntry.body.should.equal(updateData.body);
                        dbEntry.title.should.equal(updateData.title);
                    });
            });
        });

        describe('DELETE endpoint :: /api/entries/:id', () => {
            // strategy:
            //  1. arbitrarily get a database record & extract its id
            //  2. make DELETE request using this id
            //  3. check response's status code and wee whether a record
            //     with that id exists in our database
            let dbEntry;
            return Entries
                .findOne()
                .exec()
                .then((_dbEntry) => {
                    dbEntry = _dbEntry;
                    // make request using our db entry's id
                    return chai.request(app)
                        .delete(`/api/entries/${dbEntry.id}`)
                        .auth(username, password);
                })
                .then((res) => {
                    res.should.have.status(204);
                    // post DELETE, we'll try to find the submitted entry in
                    // our database \/
                    return Entries.findById(dbEntry.id).exec();
                })
                .then((allegedlyDeleted) => {
                    // here's hoping that Entries.findById(...) doesn't exist
                    should.not.exist(allegedlyDeleted);
                });
        });
    });        
});
