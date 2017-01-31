const mongoose = require('mongoose');

const notesEntrySchema = mongoose.Schema({
    title: {type: String, required: true},
    body: {type: String, required: true},
    author: {type: String, required: true},             // account name
    NlpTopics: {type: String},
    publishedAt: {type: Date, default: Date.now}
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


// mongoose automagically pluralizes its model names for you. Thanks, mongoose!
const Entry = mongoose.model('Entry', notesEntrySchema);

module.exports = {Entry};
