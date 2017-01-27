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

module.exports = {app};

