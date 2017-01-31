const express = require('express');
const jsonParser = require('body-parser').json();

const {Entry} = require('./model');
const Entries = Entry;          // I hate mongoose's naming conventions

const router = express.Router();

router.use(jsonParser);

router.get('/entries', (req, res) => {
    Entries
       .find()
        .sort({publishedAt: -1})
        .exec()
        .then(entries => {
            res.json(entries.map(entry => entry.apiRepr()));
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({error: 'something went wrong'});
        });
});

router.get('/entries/:id', (req, res) => {
    Entries
        .findById(req.params.id)
        .exec()
        .then(entry => res.json(entry.apiRepr()))
        .catch(err => {
            console.error(err);
            res.status(500).json({error: 'Something went wrong'});
        });
});

router.post('/entries/', (req, res) => {
    const requiredFields = ['title', 'body', 'author'];
    requiredFields.forEach(field => {
        if (!(field in req.body)) {
            res.status(400).json(
                {error: `Missing "${field}" in request body`});
        }
    });
    Entries
        .create({
            title: req.body.title,
            body: req.body.body,
            author: req.body.author
        })
        .then(entry => res.status(201).json(entry.apiRepr()))
        .catch(err => {
            console.error(err);
            res.status(500).json({error: 'Something went wrong'});
        });
});

router.put('/entries/:id', (req, res) => {
    if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        res.status(400).json({ error: 'Request\'s PATH id and BODY id values must match' });
    }

    const updated = {};
    const updateableFields = ['title', 'body', 'author'];
    // we'll make the client send all three of these values, but API users needn't
    updateableFields.forEach(field => {
        if (field in req.body) {
            updated[field] = req.body[field];
        }
    });
    Entries
        .findByIdAndUpdate(req.params.id, {$set: updated}, {new: true})
        .exec()
        .then(updatedPost => res.status(201).json(updatedPost.apiRepr()))
        .catch(err => res.status(500).json(
            {message: 'Something went wrong. Are you submitting a valid id AND the right fields?'}));
});

router.delete('/entries/:id', (req, res) => {
    Entries
        .findByIdAndRemove(req.params.id)
        .exec()
        .then(() => res.status(204).json({message: 'success'}))
        .catch(err => {
            console.error(err);
            res.status(500).json({error: 'Something went wrong. Perhaps you specified a wrong id?'});
        });
});

module.exports = {router};
