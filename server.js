const bodyParser = require('body-parser');
const express = require('express');
const app = express();

const {Entries} = require('./API-fake.js');

app.use(bodyParser.json());

app.use(express.static('public')); // /public now serves static files
app.listen(process.env.PORT || 8080);

app.get('/api/entries', (req, res) => {
    Entries
        .find()
        .exec()
        .then(entries => res.json(entries))
        .catch(err => {
            console.error(err);
            res.status(500).json({error: 'something went wrong'});
        });
});

app.get('/api/entries/:id', (req, res) => {
    Entries
        .findById(req.params.id)
        .exec()
        .then(entry => res.json(entry))
        .catch(err => {
            console.error(err);
            res.status(500).json({error: 'something went wrong'});
        });
});

app.post('/api/entries/', (req, res) => {
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
        .then(entry => res.status(201).json(entry))
        .catch(err => {
            console.error(err);
            res.status(500).json({error: 'Something went wrong'});
        });
});

app.put('/api/entries/:id', (req, res) => {
    if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        res.status(400).json({ error: 'Request\'s PATH id and BODY id values must match' });
    }

    // if (!Entries.findById(req.params.id)) {
    //     res.status(400).json({ error: 'Requested entry id does not exist'});
    // }

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
        .then(updatedPost => res.status(201).json(updatedPost))
        .catch(err => res.status(500).json({message: 'Something went wrong'}));
});

app.delete('/api/entries/:id', (req, res) => {
    Entries
        .findByIdAndRemove(req.params.id)
        .exec()
        .then(() => res.status(204).json({message: 'success'}))
        .catch(err => {
            console.error(err);
            res.status(500).json({error: 'Something went wrong'});
        });
});

app.use('*', function(req, res) {
    res.status(404).json({message: 'Resource not found'});
});

module.exports = {app};

