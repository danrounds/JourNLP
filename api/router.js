const express = require('express');
const router = express.Router();
const jwt = require('jwt-simple');

const { UserAccount, Entry } = require('./models');
const { nlpCategorize } = require('./nlp');
const auth = require('./jwtAuthentication');
const cfg = require('../config');

// Our authentication
router.use(auth.initialize());

function isFieldMissing(body, fields) {
    // Checks for presence of fields[i] in our request body
    for (let field of fields) {
        if (!body.hasOwnProperty(field))
            return `Missing "${field}" in request body`;
    }
    return false;
}

// ENDPOINTS:
// /entries/.* endpoints
router.get('/entries/', auth.authenticate(), (req, res) => {
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
        .catch(err => res.sendStatus(500));
});

router.get('/entries/:id', auth.authenticate(), (req, res) => {
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
        .catch(err => res.sendStatus(500));
});

router.post('/entries/', auth.authenticate(), (req, res) => {
    // Submits/saves an entry, associated with the given user account
    const fieldMissing = isFieldMissing(req.body, ['title','body']);
    if (fieldMissing) {
        return res.status(400).json(fieldMissing);
    }

    const title = req.body.title;
    const body = req.body.body;
    return nlpCategorize(title + '. ' + body)
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

router.put('/entries/:id', auth.authenticate(), (req, res) => {
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
        .then(title => nlpCategorize(title + '. ' + req.body.body)
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
        .catch(err => res.sendStatus(500));
});

router.delete('/entries/:id', auth.authenticate(), (req, res) => {
    // Deletes the entry with the given id
    return Entry
        .findByIdAndRemove(req.params.id)
        .exec()
        .then(() => res.sendStatus(204))
        .catch(err => res.sendStatus(500));
});

// /user_account/ endpoints
router.get('/user_account/', auth.authenticate(), (req, res) => {
    // Returns the user-relevant data associated with the authenticated user
    return UserAccount
        .findOne({ username: req.user.username })
        .populate('posts')
        .then(userData => res.json(userData.apiRepr()))
        .catch(err => res.sendStatus(500));
});

router.post('/log_in', (req, res) => {
    // Log in endpoint -- returns the relevant JWT token
    if (req.body.username && req.body.password) {
        return UserAccount.findOne({ username: req.body.username })
            .then(userAccount => {
                if (!userAccount)
                    return res.sendStatus(404); // Name doesn't exist

                return userAccount.validatePassword(req.body.password)
                    .then(isValid => {
                        if (isValid) {
                            const payload = { id: userAccount._id, username: userAccount.username };
                            const token = jwt.encode(payload, cfg.JWT_SECRET);
                            res.status(200).json(token);
                        } else {
                            res.sendStatus(401);
                        }
                    });
            })
            .catch(() => res.sendStatus(500));
    }
    res.sendStatus(401);
});

router.post('/user_account/', (req, res) => {
    // Creates a user account, with { username, password }
    // Returns the relevant JWT token
    const fieldMissing = isFieldMissing(req.body, ['username', 'password']);
    if (fieldMissing) {
        return res.status(400).json({ error: fieldMissing });
    }

    return UserAccount.findOne({ username: req.body.username })
        .then(exists => {
            if (exists)
                return res.sendStatus(409); // name conflict
        })
        .then(() => UserAccount.hashPassword(req.body.password)
              .then(hashed => UserAccount
                    .create({
                        username: req.body.username,
                        password: hashed
                    })
                    .then(userAccount => {
                        console.log(userAccount);
                        const payload = { id: userAccount._id, username: userAccount.username };
                        const token = jwt.encode(payload, cfg.JWT_SECRET);
                        return res.status(201).json(token);
                    })
                    .catch(err => {
                        if (err.name == 'ValidationError')
                            res.status(422).json({ message: err.errors.username.message });
                        else
                            // I'm not sure I want the server exposing whether accounts exist
                            res.sendStatus(500);
                    })));
});

router.put('/user_account/', auth.authenticate(), (req, res) => {
    // Used solely to update a user's password
    const fieldMissing = isFieldMissing(req.body, ['username','newPassword']);
    if (fieldMissing) {
        return res.status(400).json({ error: fieldMissing });
    }
    return UserAccount.hashPassword(req.body.newPassword)
        .then(hashed => UserAccount
              .update(
                  { username: req.user.username },
                  { $set: { 'password': hashed }},
                  { runValidators: true }
              )
              .then(updated => res.sendStatus(204))
              .catch(err => res.sendStatus(500)));
});

router.delete('/user_account/', auth.authenticate(), (req, res) => {
    // Deletes entries and the authenticated user account
    const p1 = Entry
              .remove({ author: req.user.username })
              .exec();
    const p2 = UserAccount
              .remove({ username: req.user.username })
              .exec();

    return Promise.all([p1, p2])
        .then(() => res.sendStatus(204)) // Success!
        .catch(err => res.sendStatus(500));
});

module.exports = { router };
