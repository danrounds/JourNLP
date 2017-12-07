'use strict';

// State-oriented functions & data-structures
var state = {
    entries: [],
    current: null,
    author: localStorage.getItem('@JNLP/author'),
    jwtToken: localStorage.getItem('@JNLP/authToken'),
    globalTags: {},
    // This lets us map from tagged topics back to the posts that were tagged
    // with them. The rationale here is that we can group together common tags.
    //
    // E.g., multiple posts might be given the tag "food."
    // keys:   individual tags from nlpTopics, i.e. ...entry.nlpTopics[i]
    // values: arrays of `entries' that contained the given tag.

    clearState: function() {
        localStorage.removeItem('@JNLP/author');
        localStorage.removeItem('@JNLP/authToken');
        state = {
            entries: [],
            current: null,
            author: null,
            jwtToken: null,
            globalTags: {}
        };
    },
    populateState: function() {
        return getEntries()
            .done(function(data) {
                state.entries = data;
                state.resetCurrent();
            })
            .catch(function(err) {
                if ([401, 500].indexOf(err.status) !== -1)
                    state.clearState();
            });
    },
    resetCurrent: function() {
        state.current = state.entries[0];
    },
    setAuthor: function(value) {
        localStorage.setItem('@JNLP/author', value),
        state.author = value;
    },
    setJwt: function(value) {
        localStorage.setItem('@JNLP/authToken', value);
        state.jwtToken = value;
    },
    sortTags: function() {
        // This is the function that does the above mapping for us
        state.globalTags = {};
        state.entries.forEach(function(entry) {
            entry.nlpTopics.forEach(function(tag) {
                tag = tag.replace(/\n/g, '');
                // NLP tagger is weird & includes newlines with edge-case input
                var hasVal = state.globalTags[tag];
                if (hasVal)
                    state.globalTags[tag].push(entry);
                else
                    state.globalTags[tag] = [entry];
            });
        });
    },
    updateState: function() {
        state.current = findById(getQueryString()) || state.current;
    }
};

function findById(id) {
    // Returns the entry with the given id
    return state.entries.filter(function(obj) {
        return obj.id == id;
    })[0];
}

function findByIdAndRemove(id) {
    var entry = state.entries.filter(function(obj) {
        return obj.id == id;
    })[0];

    state.entries.splice( state.entries.indexOf(entry), 1 );
}

//// API-access functions
function makeRequest(url, httpVerb, data) {
    return $.ajax({
        url: url,
        type: httpVerb,
        headers: {
            'Authorization': 'Bearer '+ state.jwtToken,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(data)
    });
}

function submitLogIn(data) {
    return makeRequest('../api/log_in/', 'POST', data);
}

function submitSignUp(data) {
    return makeRequest('../api/user_account/', 'POST', data);
}

function getEntries() {
    return makeRequest('../api/entries/', 'GET');
}

function submitEntry(data) {
    return makeRequest('../api/entries/', 'POST', data);
}

function editEntry(data) {
    return makeRequest('../api/entries/'+data.id, 'PUT', data);
}

function deleteEntry(id) {
    return makeRequest('../api/entries/'+id, 'DELETE', { id: id });
}


//// Page updating functions (HTML and event handlers)
function getQueryString() {
    return document.location.search.substring(1);
}

function updateEntriesSidebar() {
    // write-entry.html AND view-entry.html
    // Updates the left pane on desktop--our listing of entries
    state.entries.forEach(function(ent) {
        $('.entries-container').append(
            `<div class="sidebar-entry"><a href="view-entry.html?${ent.id}">`
                +`<h4 class="sidebar-title">${ent.title}</h4>`
                +`<p class="line-limit sidebar-body">${ent.body}</p>`
                +`<p class="line-limit sidebar-topics">${ent.nlpTopics.join(', ')}</p>`
                +`<p>${ent.publishedAt}</p>`
                +`</a></div>`);
    });
}

function updateTagsSidebar() {
    // write-entry.html AND view-entry.html
    // Updates the right pane on desktop--our local document's tags
    if (findById(getQueryString())) {
        var tagsArray = [];
        state.current.nlpTopics.forEach(function(tag) {
            tagsArray.push(`<a href="listings.html?${encodeURIComponent(tag)}`
                           +`">${tag}</a>`);
        });
        $('.tags-title').text(`Tags for post "${state.current.title}":`);
        var tags = tagsArray.join(', ');
    } else {
        $('.tags-title').text('Tags will appear once you\'ve entered something.');
        tags = '';
    }
    $('.tags-text').html(tags);
}

function addListingsButtonsProperties(id, title) {
    // listings.html, subordinate
    // This adds properties to the individual entries on our entries screen

    // view button
    $('#view_'+id).click(function() {
        window.open(`view-entry.html?${id}`, '_self');
    });

    // edit button
    $('#edit_'+id).click(function() {
        window.open(`write-entry.html?${id}`, '_self');
    });

    // delete button
    $('#del_'+id).click(function() {
        var ans = confirm(`Are you sure you want to delete "${title}"?`);
        if (ans) {
            deleteEntry(id)
                .catch(function() { window.open('listings.html', '_self'); });
            //^This isn't especially robust error handling; it just reloads the
            // page if the deletion fails. I suppose so that the page reflects
            // the server's state
            findByIdAndRemove(id);
            state.sortTags();
            updateListingsView();
        }
    });
}

function displayGlobalTags() {
    // listings.html, subordinate
    var tagsHtml = ''; var tagsArray = [];
    for (var tagEntry in state.globalTags) {
        tagsArray.push(`<a href="listings.html?${encodeURIComponent(tagEntry)}`
                       +`">${tagEntry}</a>`);
    }
    $('.tags-text').html(tagsArray.join(', ')); // update global tags
}

function getListings() {
    // listings.html, subordinate
    // Returns the subset of entries for listings.html to display, and the
    // correct title
    var query = decodeURIComponent(getQueryString());
    if (state.globalTags[query]) {
        // we have a subset of entries
        var entries = state.globalTags[query];
        var title = `Entries for "${query}":`;
        var tail = true;
    } else {
        // all the entries
        entries = state.entries;
        title = `Entries, all:`;
    }
    return [title, entries, tail];
}
function updateListingsView() {
    // listings.html, main
    // I don't like pushing styling into our JavaScript, but I'm using vanilla
    // CSS; something like LESS would make this cleaner.

    var title, entries, tail;
    [title, entries, tail] = getListings();

    $('h1').text(title);
    $('.tags-title').text('Global tags. Click one to see the relevant documents:');
    displayGlobalTags();
    if (!tail)
        $('.listings-link').text('');

    $('.entries-list').html('');
    var nEntries = 0;
    entries.forEach(function(ent) {

        var tagsArray = [];
        ent.nlpTopics.forEach(function(tag) {
            tagsArray.push(`<a href="listings.html?${encodeURIComponent(tag)}`
                           +`">${tag}</a>`);
        });
        var id = ent.id;
        if (!(nEntries % 2))
            var containerOpenTag = '<div class="entry-listing even-entry">';
        else
            containerOpenTag = '<div class="entry-listing">';
        $('.entries-list').append(
            containerOpenTag
                +`<h4>${ent.title}</h4>`
                +`<p class="line-limit listing-body">${ent.body}</p>`
                +`<p listing-topics><em>topics: ${tagsArray.join(', ')}</em></p>`
                +`<p class="secondary">published: ${ent.publishedAt}</p>`
            // buttons
                + `<button class="btn btn-primary" id="${'view_'+id}">view</button>`
                + `<button class="btn btn-primary" id="${'edit_'+id}">edit</button>`
                + `<button class="btn btn-primary" id="${'del_'+id}">delete</button>`
            // closing tag
                +'</div>');
        addListingsButtonsProperties(id, ent.title);
        nEntries++;
    });
    return true;
}

function updateEntryView() {
    // view-entry.html, main
    if (state.current) {
        $('.title').text(state.current.title);
        var obj = $('.entry').text(state.current.body);
        obj.html(obj.html().replace(/\n/g,'<br/>'));
        if(state.current.lastUpdateAt)
            $('p#last-update-at').text(`last update: ${state.current.lastUpdateAt}`);
        $('a#edit-link').attr('href', `write-entry.html?${state.current.id}`);
        $('a#delete-link').click(function(e) {
            e.preventDefault();
            if (confirm(`Are you sure you want to delete ${state.current.title}?`)){
                deleteEntry(state.current.id);
                window.open('view-entry.html', '_self');
            }
        });
    }
}

function writeEditDisplayMain() {
    // write-entry.html, subordinate
    var current = findById(getQueryString());
    if (!current) {
        $('button#delete').css({'display': 'none'});
        $('h1').text('write an entry');
    } else {
        $('h1').text('edit an entry');
        $('#title-text').val(current.title);
        $('#body-text').val(current.body);
        if (current.lastUpdateAt)
            $('p#last-update-at').text(`last update at ${current.lastUpdateAt}`);
    }
}
function writeEditButtons() {
    // write-entry.html, subordinate
    // The logic for our two or three buttons, underneath our textarea

    $('button#discard').click(function(e) {
        e.preventDefault();

        var ans;
        var title = $('#title-text').val().trim();
        var body =  $('#body-text').val().trim();
        var inputs = findById(getQueryString()) || {};

        if (inputs.title === title && inputs.body === body) {
            window.open(`view-entry.html?${getQueryString()}`, '_self');
        } else if (title.length || body.length) {
            ans = confirm('Are you sure you want to discard your work?');
            if (ans) {
                window.open('write-entry.html', '_self');
            }
        } else {
            alert('You haven\'t even entered anything, yet.');
        }
    });

    ///////////////////
    $('button#save').click(submit);
    $(document).keydown(function(e) {
        if (e.ctrlKey && e.which === 13)
            submit(e);
    });
    function submit(e) {
        e.preventDefault();
        var title = $('#title-text').val().trim();
        var body = $('#body-text').val().trim();
        var original = findById(getQueryString()) || {};

        if (title.length === 0) { alert('Your entry needs a title'); }
        else if (body.length === 0) { alert('Your entry needs an actual body'); }
        else if (original.title === title && original.body === body)
            window.open(`view-entry.html?${getQueryString()}`, '_self');
        else {                  // we have an actual entry to submit
            var id = getQueryString();
            if (getQueryString()) {
                editEntry({id: id, title: title, body: body});
                window.open(`view-entry.html?${id}`, '_self');
            } else {
                submitEntry({title: title, body: body})
                    .done(function(res) {
                        window.open(`view-entry.html?${res.id}`, '_self');
                    });
            }
        }
    }

    ///////////////////
    $('button#delete').click(function(e) {
        e.preventDefault();

        var id = getQueryString();
        if (findById(id)) {
            if (confirm(`Are you sure you want to delete ${state.current.title}?`)){
                deleteEntry(id);
                window.open('write-entry.html', '_self');
            }
        }
    });
}

function preventErasedComment() {
    // This prevents hyperlinks from resolving if we've created or edited any
    // content. Decent amount of overlap with the logic in `button#discard' in
    // writeEditButtons()
    $('body').on('click', 'a', function(e) {
        e.preventDefault();

        var title = $('#title-text').val().trim();
        var body =  $('#body-text').val().trim();
        var inputs = findById(getQueryString()) || { title: '', body: '' };

        var ans = true;
        if (inputs.title !== title || inputs.body !== body) {
            ans = confirm(`Are you sure you want to discard your work?`);
        }
        ans && window.open($(this).attr('href'), '_self');
    });
}

function signUpLoginSetHeaders() {
    if (document.location.hash.includes('#log-in'))
        $('#log-in-h').addClass('sign-log-selected');
    else if (document.location.hash.includes('#sign-up'))
        $('#sign-up-h').addClass('sign-log-selected');

    $('#sign-up-h').click(function() {
        $('#log-in-h').removeClass('sign-log-selected');
        $('#sign-up-h').addClass('sign-log-selected');
    });

    $('#log-in-h').click(function() {
        $('#log-in-h').addClass('sign-log-selected');
        $('#sign-up-h').removeClass('sign-log-selected');
    });
}

function signUpLoginForm() {
    // Logic for sign-up-or-login.html
    signUpLoginSetHeaders();
    $('a#signup-login-submit').click(submitButton);

    $(document).keydown(function(e) {
        if (e.which === 13)
            submitButton(e);
    });
    function submitButton(e) {
        var username = $('#username').val().trim();
        var password = $('#password').val().trim();

        if (!username.length)
            $('p#username-taken').text('enter a username');
        else if (!password.length)
            $('p#username-taken').text('enter a password');
        else {
            var fn = document.location.hash.includes('#log-in') ? submitLogIn : submitSignUp;
            var submission = { username: username, password: password };
            fn(submission)
                .done(function(response) {
                    state.setAuthor(submission.username);
                    state.setJwt(response);
                    window.open(`write-entry.html?`, '_self');
                })
                .fail(function(err) {
                    if (err.status == 409)
                        $('p#username-taken').text('looks like that username\'s taken');
                    else if (err.status == 404)
                        $('p#username-taken').text('username doesn\'t exist');
                    else if (err.status == 401)
                        $('p#username-taken').text('wrong password');
                    else
                        $('p#username-taken').text('server error');
                });
        }
    }
}

function logoutBind() {
    if (state.author) {
        $('a.logout-link')
            .html(`${state.author}<br><em id=logout>logout</em>`)
            .click(function(e) {
                window.open(`sign-up-or-in.html#log-in`, '_self');
                state.clearState();
            });
    }
}

function demoLogin() {
    // This is eventually to be replaced with server-generated, on-demand demo
    // -accounts that we'll CRON-delete after some amount of inactivity
    $('a#demo-button').click(function(e) {
        e.preventDefault();
        submitLogIn({ username: 'demo_account', password: 'abc123' })
            .done(function(response) {
                state.setAuthor('demo_account');
                state.setJwt(response);
                window.open('listings.html', '_self');
            });
    });
}

function displayNotLoggedInDialog() {
    // This displays if we're trying to access pages that need API access, but
    // we're not logged in
    if (state.author === null)
        $('body').append(`<a class="not-logged-in" href="sign-up-or-in.html#log-in">Please log in</a>`);
}

//// High-level functions for our different screens
function viewEntryUpdate() {
    return state.populateState()
        .then(state.updateState)
        .then(updateEntriesSidebar)
        .then(updateEntryView)
        .then(updateTagsSidebar)
        .then(logoutBind)
        .then(displayNotLoggedInDialog);
}

function writeEntryUpdate() {
    return state.populateState()
        .then(state.updateState)
        .then(updateEntriesSidebar)
        .then(updateTagsSidebar)
        .then(writeEditDisplayMain)
        .then(writeEditButtons)
        .then(preventErasedComment)
        .then(logoutBind)
        .then(displayNotLoggedInDialog);
}

function listingsUpdate() {
    return state.populateState()
        .done(state.sortTags)
        .done(updateListingsView)
        .then(logoutBind)
        .then(displayNotLoggedInDialog);
}

function signUp() {
    return signUpLoginForm();
}

function dispatch() {
    if ($('body#view-entry').length)  { viewEntryUpdate(); };
    if ($('body#write-entry').length) { writeEntryUpdate(); };
    if ($('body#listings').length)    { listingsUpdate(); };
    if ($('body#sign-up').length)     { signUp(); };
    if ($('body#index'.length))       { demoLogin(); }
}

$( dispatch );
