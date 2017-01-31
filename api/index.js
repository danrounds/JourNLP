// as a reminder for why this file is here: index.js is what node's module
// system looks for, when we "require" a directory

const {Entry} = require('./entry-model');
const {router} = require('./router');

module.exports = {Entry, router};
