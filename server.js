const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');

const {DATABASE_URL, PORT} = require('./config');

const {router: apiRouter} = require('./api');

// ES6-style promises for mongoose
mongoose.Promise = global.Promise;

const app = express();
app.use(morgan('common'));
app.use(bodyParser.json());

// getting down to some actual serving:
app.use(express.static('public')); // /public/ now serves static files

app.use('/api/', apiRouter);

app.use('*', function(req, res) {
    res.status(404).json({message: 'Resource not found'});
});

let server;
function runServer(databaseUrl=DATABASE_URL, port=PORT) {
    return new Promise((resolve, reject) => {
        mongoose.connect(databaseUrl, err => {
            if (err) {
                return reject(err);
            }
            server = app.listen(port, () => {
                console.log(`Journal/Notes app is listening on port ${port}`);
                resolve();
            })
                .on('error', err => {
                    mongoose.disconnect();
                    reject(err);
                });
        });
    });
}

function closeServer() {
    return mongoose.disconnect().then(() => {
        return new Promise((resolve, reject) => {
            console.log('Closing server');
            server.close(err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    });
}

// if we call server.js, directly (`node server.js'). this block runs
if (require.main === module) {
    runServer().catch(err => console.error(err));
}

// we export runServer and closeServer so that other code (right now, just
// tests) can start/close the server, at will. Our db-oriented test will need
// to start & close, over and over.
module.exports = {runServer, closeServer, app};
