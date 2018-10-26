const mongoose = require('mongoose');
const jwt = require('jwt-simple');

const { UserAccount } = require('../api');
const { generateAccount, postEntries } = require('./_fake');
const { JWT_SECRET } = require('../config');

mongoose.Promise = global.Promise;

function tearDownDb() {
    console.warn('Clearing db records');
    return mongoose.connection.dropDatabase();
}

function seedDb() {
    // This adds a single account and a full helping of entries to go with it
    let { username, password } = generateAccount();
    let token;
    return UserAccount
        .hashPassword(password)
        .then(hashed => UserAccount
              .create({ password: hashed, username, })
              .then(user => jwt.encode({
                  id: user._id,
                  username: user.username
              }, JWT_SECRET ))
              .then(_token => {
                  token = _token;
                  return { token: _token, username, password, };
              }))
        .then(() => postEntries(username))
        .then(() => ({ username, token, password }))
        .catch(err =>  console.warn(err));
}

module.exports = { tearDownDb, seedDb, };
