// This is a utility function that we run with node-cron, on a 10-minute
// interval.
//
// It refreshes the database entries associated with our demo account
//
// The rationale here is that (conceivably), someone could vandalize our
// demo account. Our cron job ensures that the demo account is refreshed,
// periodically.
//
// A "better" (safer) strategy might be to generate unique demo accounts, based
// on IP, and then have a nightly cron job to delete them. This is good enough,
// for now, though.

const { http } = require('http');
const request = require('request-promise');
const mongoose = require('mongoose');

const { UserAccount, Entry } = require('../api');
const [ UserAccounts, Entries ] = [ UserAccount, Entry ];
const { PORT, DATABASE_URL } = require('../config');
const { data } = require('./data');

const username = 'demo_account';
const password = 'abc123';

function dropDemoAccount() {
    // Deletes our demo_account. We're skipping the endpoint, on the off chance
    // someone malicious has changed the password
    //
    // Subordinate function
    console.log('[bin/demo_account_refresh] :: Dropping `demo_account`');
    return Promise.all([ Entries.remove({ author: username }).exec(),
                         UserAccounts.remove({ username: username }).exec() ]);
}

function createDemoAccount() {
    // Subordinate function
    return request({
        method: 'POST',
        url: `http://localhost:${PORT}/api/user_account`,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
    });
}

function postPost(jwt, post) {
    // Subordinate function
    return request({
        method: 'POST',
        url: `http://localhost:${PORT}/api/entries`,
        headers: {
            Authorization: 'Bearer '+ JSON.parse(jwt),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(post),
    });
}

function resetDemoAccount() {
    // The function we actually call (with cron)
    // - Drops demo_account record
    // - POSTs a new demo_account
    // - POSTs the collection of posts in `data`
    //
    // Main function
    return dropDemoAccount()
        .then(createDemoAccount)
        .then(jwt => {
            let additions = [];
            console.log('[bin/demo_account_refresh] :: Creating posts for `demo_account`...');
            for (let post of data)
                // Issues a POST for every entry in our `data`, below
                additions.push(postPost(jwt, post));
            return Promise.all(additions);
        })
        .then(() => console.log('[bin/demo_account_refresh] :: `demo_account` refreshed!'))
        .catch(err => console.log('[bin/demo_account_refresh] :: '+ err));
}

module.exports = { resetDemoAccount };
