# JourNLP
---------------------------------------------------------------

_JourNLP_ is a journaling/note-taking web app that automatically categorizes your notes for you, using Natural Language Process. Type in your notes, submit, and _JourNLP_ categorizes them with NLP. Identical topics are grouped together, and data from your notes can be visualized.

---------------------------------------------------------------

## Platforms/libraries/frameworks used
* Express/Node.js
* [Passport](http://passportjs.org/), for authentication
* [Retext](https://github.com/wooorm/retext/) with [retext-keywords](https://github.com/wooorm/retext-keywords), for our categorization
* MongoDB, with [Mongoose](mongoosejs.com/) for schema, input validation, etc
* [bcryptjs](https://www.npmjs.com/package/bcryptjs) for password hashing & salting
* Mocha and Chai, for our tests
* [Travis-CI](https://travis-ci.org/) for test automation
* jQuery, for our client

Sidebar patterns, courtesy [subtlepatterns.com](http://www.subtlepatterns.com); fonts and data visualization courtesy Google (Fonts and Charts, respectively).

---------------------------------------------------------------

## API

The API here is RESTful (we manipulate the app and its data using basic HTTP requests and semantics). Most access involves [basic authentication](https://www.httpwatch.com/httpgallery/authentication/); the lone exception is account creation (`POST /user_account`). All request/response bodies are of type `application/json`.

The API endpoints for this project broadly do two things:
1. CRUD notes entries&#8212;that is (1) make posts, (2) access post data, (3) update posts, and (4) delete posts data
2. CRUD user accounts&#8212;i.e., (1) create user accounts, (2) get access to all the data associated with a user account, (3) change a user password, and (4) delete an account and all associated data

### API Endpoints

[API endpoints described here.](API-documentation.md)

---------------------------------------------------------------
