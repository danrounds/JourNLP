const faker = require('faker');

const { Entry, UserAccount } = require('../api');

function _makeUsername(name=[], length=5) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
    for(let i = 0; i < length; i++) {
        name.push(possible[Math.floor(Math.random() * possible.length)]);
    }
    return name.join('');
}
const _makePassword = () => _makeUsername(undefined, 7);

function generateAccount() {
    console.log('Creating account');
    return {
        username: _makeUsername(),
        password: _makePassword(),
    };
}

// Populates our database with plausible-seeming journal-entry data
function postEntries(username) {
    console.log('Seeding notes/journal-entry db records');

    const dbQueries = [];
    for (let i = 0; i < 10; i++) {
        dbQueries.push(
            Entry.create(generateEntry(username))
                .then(entry => UserAccount
                      .findOne({ username })
                      .exec()
                      .then(user => {
                          user.posts.push(entry._id);
                          return user.save();
                      })));
    }
    return Promise.all(dbQueries);
}

// Faker makes us some nice-looking fake journal entries
function generateEntry(username) {
    return  {
        title: faker.random.words(4),
        body: faker.lorem.paragraph() + '\n\n'
            + faker.lorem.paragraph() + '\n\n'
            + faker.lorem.paragraph() + '\n\n'
            + faker.lorem.paragraph() + '\n\n'
            + faker.lorem.paragraph() + '\n\n'
            + faker.lorem.paragraph() + '\n\n'
            + faker.lorem.paragraph() + '\n\n'
            + faker.lorem.paragraph(),
        author: username,
        nlpTopics: ['abc', 'def', 'ghi', 'jkl', 'mno'],
    };
}

module.exports = { generateAccount, postEntries, generateEntry, };
