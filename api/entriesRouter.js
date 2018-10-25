const express = require('express');
const entriesRouter = express.Router();

const { UserAccount, Entry } = require('./models');
const auth = require('./jwtAuthentication');
const { isFieldMissing } = require('./commonFns');

let nlpCategorizeD;             // Initialized by our exported function.
// ^ Reminder that this is basically being run as a "daemon"

// Our authentication
entriesRouter.use(auth.initialize());

// /entries/.* endpoints
entriesRouter.get('/entries/', auth.authenticate(), (req, res) => {
    // This returns an array of the authenticated user's notes entries.
    // The simplest way to add entries (see, POST) is to just push onto the end
    // of an array of post ids; the result is sorted with oldest posts, first.
    // This isn't quite what we want, hence `entries.posts.reverse()`, below.
    return UserAccount
        .findOne({ username: req.user.username }, 'posts')
        .populate('posts')
        .then(entries => {
            entries = entries.posts.reverse();
            return res.json(entries.map(entry => entry.apiRepr()));
        })
        .catch(() => res.sendStatus(500));
});

entriesRouter.get('/entries/:id', auth.authenticate(), (req, res) => {
    // This returns the entry with the specific id, assuming it belongs to the
    // authenticated user
    return Entry
        .findById(req.params.id)
        .exec()
        .then(entry => {
            if (req.user.username === entry.author)
                return res.json(entry.apiRepr());
            else
                return res.sendStatus(403);
        })
        .catch(() => res.sendStatus(500));
});

entriesRouter.post('/entries/', auth.authenticate(), (req, res) => {
    // Submits/saves an entry, associated with the given user account
    const fieldMissing = isFieldMissing(req.body, ['title','body']);
    if (fieldMissing) {
        return res.status(400).json(fieldMissing);
    }

    const title = req.body.title;
    const body = req.body.body;
    return nlpCategorizeD.postMessage(title + '. ' + body)
        .then(nlpTopics => Entry
              .create({
                  author: req.user.username,
                  title,
                  body,
                  nlpTopics,
              })
              .then(entry => {
                  UserAccount
                      .findOne({ username: req.user.username })
                      .exec()
                      .then(user => {
                          user.posts.push(entry._id);
                          user.save();
                      });

                  return entry;
              })
              .then(entry => res.status(201).json(entry.apiRepr()))
              .catch(() => res.sendStatus(500)));
});

entriesRouter.put('/entries/:id', auth.authenticate(), (req, res) => {
    // For editing an entry--either its `title' and/or its `body'
    if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        res.status(400).json({ error: 'Request\'s PATH id and BODY id values must match' });
    }
    const updated = {};
    const updateableFields = ['title', 'body'];
    updateableFields.forEach(field => {
        if (field in req.body) {
            updated[field] = req.body[field].trim();
        }
    });

    return Entry.findById(req.params.id)
    // Make sure the author is the one editing the entry
        .then(entry => {
            if (req.user.username !== entry.author)
                res.sendStatus(403); // 403: Forbidden
            return req.body.title || entry.title;
        })
        .then(title => nlpCategorizeD.postMessage(title + '. ' + req.body.body)
              .then(nlpTopics => {
                  updated.nlpTopics = nlpTopics;
                  updated.lastUpdateAt = Date.now();
                  return Entry
                      .findByIdAndUpdate(req.params.id,
                                         { $set: updated },
                                         { new: true })
                      .exec()
                      .then(updatedPost => res.status(201).json(updatedPost.apiRepr()));
              }))
        .catch(() => res.sendStatus(500));
});

entriesRouter.delete('/entries/:id', auth.authenticate(), (req, res) => {
    // Deletes the entry with the given id
    return Entry
        .findByIdAndRemove(req.params.id)
        .exec()
        .then(() => res.sendStatus(204))
        .catch(() => res.sendStatus(500));
});

// /user_account/ endpoints
entriesRouter.get('/user_account/', auth.authenticate(), (req, res) => {
    // Returns the user-relevant data associated with the authenticated user
    return UserAccount
        .findOne({ username: req.user.username })
        .populate('posts')
        .then(userData => res.json(userData.apiRepr()))
        .catch(() => res.sendStatus(500));
});

module.exports = function initializer(nlpFn) {
    nlpCategorizeD = nlpFn;
    return entriesRouter;
};
