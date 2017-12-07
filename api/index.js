// as a reminder for why this file is here: index.js is what node's module
// system looks for, when we "require" a directory

// const {Entry} = require('./entry-model');
const { Entry, UserAccount } = require('./models');
const { entriesRouter } = require('./entriesRouter');
const { accountRouter } = require('./accountRouter');
const { nlpCategorize } = require('./nlp');

module.exports =
    { Entry, UserAccount, entriesRouter, accountRouter, nlpCategorize };
