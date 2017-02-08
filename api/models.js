// schema and wrapper method(s) for our our journal entries

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

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
    nlpTopics: [{ type: String }],
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
        nlpTopics: this.nlpTopics,
        // nlpTopics: this.cleanedUpNlpTopics
        publishedAt: this.publishedAt
    };
};

// notesEntrySchema.virtual('cleanedUpNlpTopics').get(function() {
//     return this.nlpTopics.join(', ');
// });

// user accounts will have an array of journal entries
const userAccountSchema = mongoose.Schema({
    username: {
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
    posts: [{type: mongoose.Schema.Types.ObjectId, ref: 'Entry'}]   // /journal entries/notes/whatever
});

userAccountSchema.methods.validatePassword = function(password) {
    return bcrypt
        .compare(password, this.password)
        .then(isValid => isValid);
};

userAccountSchema.statics.hashPassword = function(password) {
    return bcrypt
        .hash(password, 10)
        .then(hash => hash);
};

userAccountSchema.methods.apiRepr = function() {
    return {
        id: this._id,
        username: this.username,
        posts: this.posts
    };
};


// mongoose automagically pluralizes its model names for you. Thanks, mongoose!
const Entry = mongoose.model('Entry', notesEntrySchema);
const UserAccount = mongoose.model('UserAccount', userAccountSchema);

// Create demo account for site demos:
UserAccount
    .create({
        account: 'demo_account',
        password: 'abc123'
    })
    .catch(err => {
        // we'll get this error if we've already added this account.
           if (err.code == 11000)
               return;
    });

module.exports = {UserAccount, Entry};
