# API, JourNLP

The API here is RESTful (we manipulate the app and its data using basic HTTP requests and semantics). Most access involves [basic authentication](https://www.httpwatch.com/httpgallery/authentication/); the lone exception is account creation (`POST /api/user_account`). All request/response bodies are of type `application/json`.

## API Endpoints

The API endpoints for this project broadly do two things:
1. [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) notes entries&#8212;that is (1) make posts, (2) access post data, (3) update posts, and (4) delete posts data
2. CRUD user accounts&#8212;i.e., (1) create user accounts, (2) get access to all the data associated with a user account, (3) change a user password, and (4) delete an account and all associated data

Accordingly, our document is broken into two sections: [one about post endpoints](#anatomy-of-a-post), and [one about account endpoints](#anatomy-of-an-account).

Again, unless noted, all headers should include basic authentication (i.e., base-64-encoded `username:password`).

---------------------------------------------------------------

## Anatomy of a `post`

In this document, we'll refer to a journal/notes entry as a `post`. Our most oft used endpoints return or manipulate `posts` (or arrays of them).

`posts` are objects with keys (n.b., all values are strings, except for `nlpTopics`):
* `id`: Post id&#8212;unique id used in our CRUD endpoints
* `title`: The title of the given post
* `body`: The body text (main text) of the post
* `author`: The name of the user account that made the post
* `nlpTopics`: An array of strings, representing the NLP tags that our back-end generates on post submission (i.e. the topics in the post)
* `publishedAt`: A string representing the timestamp for when the post was submitted

---------------------------------------------------------------
## __`post`-oriented endpoints:__

#### GET /api/entries/
_This is our endpoint for getting a user's posts, in their entirety._
* Request
    Authenticated (BA) GET request
* _Success:_
    __Status:__ `200 OK`. 
    __Body:__ Array of [`post`s](#anatomy-of-a-post).
* _Failure:_
    __Statuses:__ `500 Internal Server Error`

#### GET /api/entries/:id
_Our endpoint for getting a single post (with `id` = `:id`)_
*  Request
    __URL:__ `:id` refers to a post id
*  _Success:_
    __Status:__ `200 OK`. 
    __Body:__ A single [`post`](#anatomy-of-a-post).
*  _Failure:_
    __Statuses:__ `403 Forbidden` if the API user is trying to access a post not belonging to her. `500 Internal Server Error` otherwise.

#### POST /api/entries/
_This endpoint creates a [`post`](#anatomy-of-a-post), with all the keys you'd expect, including `nlpTopics`_ That is, it submits text to our server, saves it, and our server analyzes it.
*  Request
    __Body:__ JSON object, with keys `title` and `body`
*  _Success:_
    __Status:__ `201 Created`
    __Body:__ [`post`](#anatomy-of-a-post) object
*  _Failure:_
    __Status:__ `500 Internal Server Error`

#### PUT /api/entries/:id
_This endpoint is for editing a [`post`](#anatomy-of-a-post), with `id` = `:id`_
*  Request
    __URL:__ `:id` refers to post id
    __Body:__ JSON object, with keys `id` = `:id` in the URL (required), and one or both of `title`, `body`
*  _Success:_
    __Status:__ `201 Created`
    __Body:__ the newly edited [`post`](#anatomy-of-a-post)
*  _Failure:_
    __Statuses:__ `403 Forbidden` or `500 Internal Server Error`

#### DELETE /api/entries/:id
_For deleting a post, `id` = `:id`_. Once it's gone, it's gone! No takebacks.
*  Request
    __URL:__ `:id` refers to post id
*  _Success:_
    __Status:__ `204 No Content`
*  _Failure:_
    __Status:__ `500 Internal Server Error`

---------------------------------------------------------------

## Anatomy of an `account`
`account`s are the data associated with an account. Our API includes methods to create accounts, change their passwords, delete them, and get user-pertinent data from them.

`posts` are objects with keys:
* `id`: Account id&#8212;unique id used in our CRUD endpoints (string)
* `username`: Self-explanatory, globally unique (string)
* `posts`: Array of `posts`. See [Anatomy of a `post`](#anatomy-of-a-post)]

---------------------------------------------------------------
## __`account`-oriented endpoints:__

#### GET /api/user_account/
Endpoint returns [`account`](#anatomy-of-an-account) associated with the request's authentication (username:password).
 Request
    Just an authenticated request to this URL
 _Success:_
    __Status:__ `200 OK`
    __Body:__ [`account`](#anatomy-of-an-account) object associated with the authenticated credentials
 _Failure:_
    __Status:__ `500 Internal Server Error`

#### POST /api/user_account/
Endpoint is for creating an account. _This is the lone endpoint of our API that doesn't require authentication._
*  Request
    __Body:__ JSON object with fields `username` and `password` (strings). `username` must be globally unique.
*  _Success:_
    __Status:__ `201 Created`
    __Body:__ [`account`](#anatomy-of-an-account) object with the `username` we just created. The `password` is stored in our database, but isn't exposed to the user.
*  _Failure:_
    __Statuses:__ `400 Bad Request` for missing required fields in the request body, `422 Unprocessable Entity` for a redundant username, `500 Internal Server Error` for everything else.

#### PUT /api/user_account/
Endpoint is for changing an account's password
*  Request
    __Body:__ required fields `username`, `password`
*  _Success:_
    __Status:__ `204 No Content`
*  _Failure:_
    __Statuses:__ `400 Bad Request` for missing fields. `500 Internal Server Error` for everything else.

#### DELETE /api/user_account/
Deletes an account and all the data associated with it. This is permanent.
*  Request
    Just a BA authenticated request
*  _Success:_
    __Status:__ `204 No Content`
*  _Failure:_
    __Status:__ `500 Internal Server Error`
    
