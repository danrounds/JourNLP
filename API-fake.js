const Fake = require('faker');

Promise.prototype.exec = function() { return this; };
// faking the .exec method that mongoose uses to convert its returned documents into promises

function makeEntry() {
    const entryInstance = {
        id: Fake.random.uuid(),
        title: toTitleCase(Fake.random.words(4)),
        body: Fake.lorem.paragraph() + '\n\n' +
            Fake.lorem.paragraph() + '\n\n' +
            Fake.lorem.paragraph() + '\n\n' +
            Fake.lorem.paragraph() + '\n\n' +
            Fake.lorem.paragraph() + '\n\n' +
            Fake.lorem.paragraph() + '\n\n' +
            Fake.lorem.paragraph() + '\n\n' +
            Fake.lorem.paragraph() + '\n\n',
        author: Fake.internet.userName(),
        NlpTopics: Fake.random.words(8),
        publishedAt: Fake.date.past()
        // lastupdatedAt: Fake.date.future()
    };
    return entryInstance;
}

// from http://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function initData() {
    const entries = [];
    for (let i = 0; i < 10; i++) {
        entries[i] = makeEntry();
    }
    return entries;
}

function create(obj) {
    obj.id = Fake.random.uuid();
    obj.publishedAt = Fake.date.future();
    obj.NlpTopics = Fake.random.words(8);
    obj.publishedAt = Fake.date.past();

    entries.unshift(obj);
    return Promise.resolve(obj);
}

function find() {
    return Promise.resolve(entries);
}

function findById(id) {
    // returns an array of one element. Not sure whether that's good or not.
    let entry = entries.filter(function(obj) {
        return obj.id == id;
    })[0];
    return Promise.resolve(entry);
}

function findByIdAndRemove(id) {
    let entry = entries.filter(function(obj) {
        return obj.id == id;
    })[0];

    entries.splice( entries.indexOf(entry), 1 );
    return Promise.resolve();
}

const entries = initData();
// console.log(entries);

const Entries = {
    create: create,
    entries: entries,
    find: find,
    findById: findById,
    findByIdAndRemove: findByIdAndRemove
};

module.exports = {Entries};
