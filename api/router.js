const express = require('express');
const jsonParser = require('body-parser').json();
const {BasicStrategy} = require('passport-http');
const passport = require('passport');

const {UserAccount, Entry} = require('./models');
const Entries = Entry;          // I hate mongoose's naming conventions
const UserAccounts = UserAccount;

const {nlpCategorize} = require('./nlp');

const router = express.Router();

router.use(jsonParser);

const strategy = new BasicStrategy((username, password, cb) => {
    let user;
    UserAccounts
        .findOne({username: username})
        .exec()
        .then(user => {
            if (!user)
                return cb(null, false, {message: 'Incorrect username'});
            return user.validatePassword(password)
                .then(isValid => {
                    if (!isValid)
                        return cb(null, false, {message: 'Incorrect password'});
                    return cb(null, user); // success!
                });
        })
        .catch(err => cb(err));

});

passport.use(strategy);
router.use(passport.initialize());

function checkFields(body, fields) {
    // checks for presence of fields[i] in our request body
    for (let field of fields) {
        if (!body.hasOwnProperty(field))
            return `Missing "${field}" in request body`;
    }
    return false;
}


// ENDPOINTS:
router.get('/entries/', passport.authenticate('basic', {session: false}), (req, res) => {
    // this returns an array of notes entries
    // add: sort-by-date
    UserAccounts
        .findOne({username: req.user.username}, 'posts')
        // .sort({publishedAt: -1})
        .populate('posts')
        .then(entries => {
            entries = entries.posts;
            res.json(entries.map(entry => entry.apiRepr()));
        })
        // .then(userData => res.json(userData))
        .catch(err => res.status(500).json({error: 'something went wrong'}));
});

router.get('/entries/:id', passport.authenticate('basic', {session: false}), (req, res) => {
    Entries
        .findById(req.params.id)
        .exec()
        .then(entry => {
            if (req.user.username === entry.author)
                res.json(entry.apiRepr());
            else
                res.status(403).send();
        })
        .catch(err => res.status(500).json({error: 'Something went wrong'}));
});

router.post('/entries/', passport.authenticate('basic', {session: false}), (req, res) => {
    const fieldMissing = checkFields(req.body, ['title','body']);
    if (fieldMissing) {
        return res.status(400).json(fieldMissing);
    }

    nlpCategorize(req.body.title + ' ' + req.body.body)
        .then(nlpTopics =>
              Entries
              .create({
                  title: req.body.title,
                  body: req.body.body,
                  author: req.user.username,
                  nlpTopics: nlpTopics
              })
             )
        .then(entry => {
            UserAccounts
                .findOne({username: req.user.username})
                .exec()
                .then(user => {
                    user.posts.push(entry._id);
                    user.save();
                });
            return entry;
        })
        .then(entry => res.status(201).json(entry.apiRepr()))
        .catch(err => res.status(500).json({error: 'Something went wrong'}));
});

router.put('/entries/:id', passport.authenticate('basic', {session: false}), (req, res) => {
    if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        res.status(400).json({ error: 'Request\'s PATH id and BODY id values must match' });
    }
    const updated = {};
    const updateableFields = ['title', 'body'];
    updateableFields.forEach(field => {
        if (field in req.body) {
            updated[field] = req.body[field];
        }
    });

    Entries
    // make sure the author is the one editing the entry
        .findById(req.params.id)
        .then(entry => {
            if (req.user.username !== entry.author)
                res.status(403).send(); // 403: Forbidden
            return req.body.title || entry.title;
        })
        .then((title) => {
            nlpCategorize(title + ' ' + req.body.body)
                .then(nlpTopics => {
                    updated.nlpTopics = nlpTopics;
                    Entries
                        .findByIdAndUpdate(req.params.id, {$set: updated}, {new: true})
                        .exec()
                        .then(updatedPost => res.status(201).json(updatedPost.apiRepr()))
                        .catch(err => res.status(500).json({message: 'Server Error'}));
                });
        });
});

router.delete('/entries/:id', passport.authenticate('basic', {session: false}), (req, res) => {
    Entries
        .findByIdAndRemove(req.params.id)
        .exec()
        .then(() => res.status(204).json({message: 'success'}))
        .catch(err => res.status(500).json({error: 'Something went wrong'}));
});

router.get('/user_account/', passport.authenticate('basic', {session: false}), (req, res) => {
    // returns the entire Mongo document associated with the authenticated user
    UserAccounts
        .findOne({username: req.user.username})
        .populate('posts')
        // .then(userData => res.json(userData))
        .then(userData => res.json(userData.apiRepr()))
        .catch(err => res.status(500).json({error: 'Something went wrong'}));
});

router.post('/user_account/', (req, res) => {
    // creates a user account, with username: username, and password: password
    const fieldMissing = checkFields(req.body, ['username', 'password']);
    if (fieldMissing) {
        return res.status(400).json({error: fieldMissing});
    }
    return UserAccounts.hashPassword(req.body.password)
        .then(hash => {
            UserAccounts
                .create({
                    username: req.body.username,
                    password: hash
                })
                .then(user => res.status(201).json(user.apiRepr()))
                .catch(err => {
                    if (err.name == 'ValidationError')
                        res.status(422).json({message: err.errors.username.message});
                    else
                        // I'm not sure I want the server exposing whether accounts exist
                        res.status(500).json({message: 'Something went wrong'});
                });
        });
});

router.put('/user_account/', passport.authenticate('basic', {session: false}), (req, res) => {
    // used solely to update a user's password
    const fieldMissing = checkFields(req.body, ['username','newPassword']);
    if (fieldMissing) {
        return res.status(400).json({error: fieldMissing});
    }
    UserAccounts
        .update(
            {username: req.user.username},
            {$set: {'password': req.body.newPassword}},
            {runValidators: true}
        )
        .then((updated) => res.status(204).json(updated))
        .catch(err => res.status(500).json({message: 'Server error'}));
});

router.delete('/user_account/', passport.authenticate('basic', {session: false}), (req, res) => {
    // deletes the authenticated user account
    UserAccounts
        .remove({username: req.user.username})
        .exec()
        .then(() => res.status(204).send()) // Success!
        .catch(err => res.status(500).json({error: 'Server error'}));
});

module.exports = {router};
