const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

// lets us use THING.should.have/THING.should.be-style constructs
const should = chai.should();

const {Entry} = require('../model'); // mongoose likes singular nouns
const Entries = Entry;               // ...but I don't

// ES6-style promises for mongoose
mongoose.Promise = global.Promise;

const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

// populates our database with plausible-seeming journal-entry data
function initNotesData() {
    console.info('Seeding notes/journal-entry db records');
    const entries = [];
    for (let i = 0; i < 10; i++) {
        entries[i] = generateEntry();
    }
    return Entries.insertMany(entries);
}

// Faker makes us some nice-looking fake journal entries
function generateEntry() {
    const entryInstance = {
        id: faker.random.uuid(),
        title: faker(faker.random.words(4)),
        body: faker.lorem.paragraph() + '\n\n' +
            faker.lorem.paragraph() + '\n\n' +
            faker.lorem.paragraph() + '\n\n' +
            faker.lorem.paragraph() + '\n\n' +
            faker.lorem.paragraph() + '\n\n' +
            faker.lorem.paragraph() + '\n\n' +
            faker.lorem.paragraph() + '\n\n' +
            faker.lorem.paragraph() + '\n\n',
        author: faker.internet.userName(),
        NlpTopics: faker.random.words(8),
        publishedAt: faker.date.past()
        // lastupdatedAt: faker.date.future()
    };
    return entryInstance;
}

function tearDownDb() {
    console.warn('Clearing db records');
    return mongoose.connection.dropDatabase();
}


// our actual tests
describe('Journal/notes entries API endpoints', function() {

    // each of our hook functions returns a callback
    before(function() {
        return runServer(TEST_DATABASE_URL);
    });

    beforeEach(function() {
        return initNotesData();
    });

    afterEach(function() {
        return tearDownDb();
    });

    after(function() {
        return closeServer();
    });


    describe('GET endpoint :: /api/entries/', function() {
        // strategy:
        //  1. GET journal entries (via server...and indirectly, our db)
        //  2. check returned status # and data type of response
        //  3. make sure returned entries's N equals the number of records we
        //     populated our db with
        it('should return all of our entries', function() {
            let res;
            return chai.request(app)
                .get('/api/entries')
                .then(function(_res) {
                    res = _res;
                    res.should.have.status(200);
                    return Entries.count();
                })
                .then(function(count) {
                    res.body.should.have.length.of(count);
                });
        });

        it('should return entries (records) with the right fields and data', function() {
            // strategy:
            //  1. GET journal entries, via server (& db-backing)
            //  2. make sure response is a JSON array (as per our API)
            //  3. check that required keys are present in our response
            //  4. make sure our response's fields match the fields in the
            //     corresponding database record
            let resEntry;       // this'll be array[0], of our response
            return chai.request(app)
                .get('/api/entries')
                .then(res => {
                    res.should.be.json
                    res.body.should.be.a('array')
                    res.body.should.have.length.of.at.least(1);

                    res.body.forEach(entry => {
                        entry.should.be.a('object');
                        entry.should.include.keys(
                            'title', 'body', 'author', 'NlpTopics');
                    });
                    resEntry = res.body[0];
                    // \/ look up db entry that corresponds with response[0]
                    return Entries.findById(resEntry);
                })
                .then(entryRecord => {
                    resEntry.id.should.equal(entryRecord.id);
                    resEntry.title.should.equal(entryRecord.title);
                    resEntry.body.should.equal(entryRecord.body);
                    resEntry.author.should.equal(entryRecord.author);
                    resEntry.NlpTopics.should.equal(entryRecord.NlpTopics);
                });
        });

});
