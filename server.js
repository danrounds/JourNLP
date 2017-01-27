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

module.exports = {app};

