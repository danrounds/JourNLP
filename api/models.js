// schema and wrapper method(s) for our our journal entries

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const notesEntrySchema = mongoose.Schema({
    title:{
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    author: {             // account name
        type: String,
        required: true
    },
    NlpTopics: { type: String },
    publishedAt: {
        type: Date,
        default: Date.now
    }
    // , lastupdatedAt: {type: String}
});


// This is provided only to future-proof our API representation.
// The commented-out function below is an example of why we might
// want to define some virtual methods for our API-returned data.
notesEntrySchema.methods.apiRepr = function() {
    return {
        id: this._id,
        title: this.title,
        body: this.body,
        author: this.author,
        NlpTopics: this.NlpTopics,
        // NlpTopics: this.cleanedUpNlpTopics
        publishedAt: this.publishedAt
    };
};

// notesEntrySchema.virtual('cleanedUpNlpTopics').get(function() {
//     return this.NlpTopics.join(', ');
// });

// user accounts will have an array of journal entries
const userAccountSchema = mongoose.Schema({
    account: {
        type: String,
        require: true,
        unique: true,
        validate: {
            validator: (str) => /[a-zA-Z0-9_]+/.test(str),
            message: 'Poorly-formed name'
        }
    },
    password: {
        type: String,
        require: true,
        validate: {
            validator: (str) => str.length > 5,
            message: 'Password\'s not long enough'
        }
    },
    posts: [notesEntrySchema]   // /journal entries/notes/whatever
});

// userAccountSchema.methods.validatePassword = (password) => {
userAccountSchema.methods.validatePassword = function(password) {
    // return bcrypt
    //     .compare(password, this.password)
    //     .then(isValid => isValid);
    return password === this.password;
};

userAccountSchema.statics.hashPassword = (password) => {
    return bcrypt
        .hash(password, 10)
        .then(hash => hash);
};



// mongoose automagically pluralizes its model names for you. Thanks, mongoose!
const Entry = mongoose.model('Entry', notesEntrySchema);
const UserAccount = mongoose.model('UserAccount', userAccountSchema);

UserAccount
    .create({
        account: 'test_account',
        password: 'abc123'
    });

module.exports = {UserAccount, Entry};
// module.exports = {UserAccount};

