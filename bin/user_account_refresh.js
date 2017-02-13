#!/usr/bin/env node

const {app, runServer, closeServer} = require('../server');
const {http} = require('http');
const request = require('request-promise');

const {UserAccount, Entry} = require('../api');
const [UserAccounts, Entries] = [UserAccount, Entry];

const {PORT} = require('../config');

const username = 'demo_account';
const password = 'abc123';

function dropDemoAccount() {
    // Deletes our demo_account. We're skipping the endpoint, on the off chance
    // someone malicious has changed the password
    const p1 = Entries
              .remove({author: username})
              .exec();
    const p2 = UserAccounts
              .remove({username: username})
              .exec();
    return Promise.all([p1, p2]);
}

const base = {
    method: 'POST',
    headers: {
        'content-type': 'application/json'
    }
};
function createDemoAccount() {
    const req = {
        url: `http://localhost:${PORT}/api/user_account`,
        body: JSON.stringify({
            username: username,
            password: password
        })
    };
    return request(Object.assign(req, base));
}

function postPost(post) {
    // this will, um...POST a post
    const req = {
        url: `http://localhost:${PORT}/api/entries`,
        auth: {
            user: username,
            password: password
        },
        body: JSON.stringify(post)
    };
    return request(Object.assign(req, base));
}

const data = [
    {title: 'pizza town', body: 'yer body is a 1derlan'},
    {title: 'another title', body: 'one mobotdy'},
    {title: 'ok', body: 'gurl i liek y0 body'}
];

function createPosts() {
    for (let post of data)
        postPost(post);
}

runServer(undefined, 3000) // need to actually create a server instance,
    .then(dropDemoAccount) // so we can interact with the database
    .then(closeServer)
    .then(createDemoAccount)
    .then(createPosts);
