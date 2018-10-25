const express = require('express');
const accountRouter = express.Router();
const jwt = require('jwt-simple');

const { UserAccount, Entry } = require('./models');
const auth = require('./jwtAuthentication');
const cfg = require('../config');
const { isFieldMissing } = require('./commonFns');

// Our authentication
accountRouter.use(auth.initialize());

// /user_account/ endpoints
accountRouter.get('/user_account/', auth.authenticate(), (req, res) => {
    // Returns the user-relevant data associated with the authenticated user
    return UserAccount
        .findOne({ username: req.user.username })
        .populate('posts')
        .then(userData => res.json(userData.apiRepr()))
        .catch(() => res.sendStatus(500));
});

accountRouter.post('/log_in', (req, res) => {
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

accountRouter.post('/user_account/', (req, res) => {
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

accountRouter.put('/user_account/', auth.authenticate(), (req, res) => {
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
              .then(() => res.sendStatus(204))
              .catch(() => res.sendStatus(500)));
});

accountRouter.delete('/user_account/', auth.authenticate(), (req, res) => {
    // Deletes entries and the authenticated user account
    return Promise.all([ Entry.remove({ author: req.user.username }).exec(),
                         UserAccount.remove({ username: req.user.username }).exec() ])
        .then(() => res.sendStatus(204)) // Success!
        .catch(() => res.sendStatus(500));
});

module.exports = { accountRouter };
