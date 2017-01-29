const mongoose = require('mongoose');

const notesEntrySchema = mongoose.Schema({
    title: {type: String, required: true},
    body: {type: String, required: true},
    author: {type: String},             // account name
    NlpTopics: {type: String},
    publishedAt: {type: Date, default: Date.now}
    // , lastupdatedAt: {type: String}
});

// If we wanted the data our API return to be different from our database
// documents, we could define some virtual methods and an API representation/
// We're not doing this, but it could be useful for (e.g.) the NLP data.
//  :::
// notesEntrySchema.virtual('authorName').get(function() {
//     return `${this.author.firstName} ${this.author.lastName}`.trim();
// });

// notesEntrySchema.methods.apiRepr = function() {
//     return {
//         id: this._id,
//         title: this.authorName,
//         body: this.body,
//         author: this.author,
//         NlpTopics: this.NlpTopics,
//         publishedAt: this.publishedAt
//     };
// };

// mongoose automagically pluralizes its model names for you. Thanks, mongoose!
const Entry = mongoose.model('Entry', notesEntrySchema);

module.exports = {Entry};
