'use strict';

// state-oriented functions & data-structures
var state = {
    entries: [],
    current: null,
    resetCurrent: function() {
        state.current = state.entries[0];
    },
    globalTags: {},
    // This lets us map from tagged topics back to the posts that were tagged
    // with them. The rationale here is that we can group together common tags.
    // 
    // E.g., multiple posts might be given the tag "food."
    // keys:   individual tags from nlpTopics, i.e. ...entry.nlpTopics[i]
    // values: arrays of `entries' that contained the given tag.

    sortTags: function() {
        // this is the function that does the above mapping for us
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
    updateState:  function() {
        // var id = getQueryString();
        // if (getQueryString) {
        //     state.current = findById(id);
        // };
        state.current = findById(getQueryString()) || state.current;
    }
};

function findById(id) {
    let entry = state.entries.filter(function(obj) {
        return obj.id == id;
    })[0];
    return entry;
}

function findByIdAndRemove(id) {
    let entry = state.entries.filter(function(obj) {
        return obj.id == id;
    })[0];

    state.entries.splice( state.entries.indexOf(entry), 1 );
}

//// API-access functions

/////// The following five functions are a hack that lets us log out AND use
/////// a demo user account. I find them inelegant, but here they are.
function getAuthVal() {
    var re = new RegExp('Authorization' + "=([^;]+)");
    var value = re.exec(document.cookie);
    return (value != null) ? unescape(value[1]) : null;
}

function clearCredentials() {
    if (getAuthVal() !== btoa('demo-account:abc123'))
        document.cookie = 'Authorization=';
}

function setCredentials(username, password) {
    var auth = btoa(`${username}:${password}`);
    document.cookie = 'Authorization='+auth;
}

function setHeader(xhr) {
    if (getAuthVal()) {
        xhr.setRequestHeader('Authorization', 'Basic '+ getAuthVal());
    }
}

function authenticatedReq(username, password) {
    return $.ajax({
        beforeSend: function(xhr) {
            setCredentials(username, password);
            setHeader(xhr);
        },
        type: 'GET',
        url: '../api/entries'
    });
}
//////


function submitSignUp(data) {
    return $.post({
        url: '../api/user_account',
        beforeSend: setHeader,
        data: JSON.stringify(data),
        dataType: 'json',
        contentType: 'application/json'
    });
}

function populateState() {
    return $.getJSON({
        url:'../api/entries',
        beforeSend: setHeader
    })
        .done(function(data) {
            state.entries = data;
            state.resetCurrent();
        });
}

function submitEntry(data) {
    return $.post({
        url: '../api/entries',
        beforeSend: setHeader,
        data: JSON.stringify(data),
        dataType: 'json',
        contentType: 'application/json'
    });
}

function editEntry(data) {
    return $.ajax({
        url: '../api/entries/' + data.id,
        beforeSend: setHeader,
        type: 'PUT',
        data: JSON.stringify(data),
        dataType: 'json',
        contentType: 'application/json'
    });
}

function deleteEntry(id) {
    return $.ajax({
        url: '../api/entries/' + id,
        beforeSend: setHeader,
        type: 'DELETE',
        data: JSON.stringify({id: id}),
        dataType: 'json',
        contentType: 'application/json'
    });
}


//// Page updating functions (HTML and event handlers)
function getQueryString() {
    return document.location.search.substring(1);
}

function updateEntriesSidebar() {
    // write-entry.html AND view-entry.html
    // updates the left pane on desktop--our listing of entries
    // $('.sidebar').text('');
    // $('.entries-container').html('<h3 class="sidebar-entry">Entries:</h3>');

    state.entries.forEach(function(ent) {
        // var p = ent.publishedAt;
        // var e = ent.title;
        // var b = ent.body;
        // var n = ent.nlpTopics;
        // var link = ent.id;
        // $('.sidebar').append(`<a href="view-entry.html?${link}">${p} ${e} ${b} ${n}</a><br><br>`);
        $('.entries-container').append(
            `<div class="sidebar-entry"><a href="view-entry.html?${ent.id}">`
                +`<h4 class="sidebar-title">${ent.title}</h4>`
                +`<p class="line-limit sidebar-body">${ent.body}</p>`
                +`<p class="line-limit sidebar-topics">${ent.nlpTopics}</p>`
                +`<p>${ent.publishedAt}</p>`
                +`</a></div>`);
    });
}

function updateTagsSidebar() {
    // write-entry.html AND view-entry.html
    // updates the right pane on desktop--our local document's tags
    if (state.current) {
        var tags = state.current.nlpTopics;
        $('.tags-title').text(`Tags for post "${state.current.title}":`);

    } else
        tags = 'Tags will appear once you\'ve <a href="write-entry.html">entered something.</a>';
    $('.tags-text').html(tags);

}

////
function addListingsButtonsProperties(id, title) {
    // listings.html, subordinate
    // this adds properties to the individual entries on our entries screen

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
        var answer = confirm(`Are you sure you want to delete "${title}"?`);
        if (answer) {
            deleteEntry(id)
                .catch(function() { window.open('listings.html', '_self'); });
            //^this isn't especially robust error handling; it just reloads the
            // page if the deletion fails. I suppose so that the page reflects the
            // server's state
            findByIdAndRemove(id);
            updateListingsView();
        }
    });
}

function makeGlobalTagsHTML() {
    // listings.html, subordinate
    var tagsHtml = ''; var tagsArray = [];
    for (var tagEntry in state.globalTags) {
        tagsArray.push(`<a href="listings.html?${encodeURIComponent(tagEntry)}`
                       +`">${tagEntry}</a>`);
    }
    return tagsArray.join(', ');
}
function getListings() {
    // listings.html, subordinate
    // returns the subset of entries for listings.html to display, and the
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
    $('.tags-text').html(makeGlobalTagsHTML); // update global tags
    if (!tail)
        $('.listings-link').text('');

    var nEntries = 0;
    entries.forEach(function(ent) {
        var id = ent.id;
        if (!(nEntries % 2))
            var containerOpenTag = '<div class="entry-listing even-entry">';
        else
            containerOpenTag = '<div class="entry-listing">';
        $('.entries-list').append(
            containerOpenTag
                +`<h4>${ent.title}</h4>`
                +`<p class="line-limit listing-body">${ent.body}</p>`
                +`<p listing-topics><em>topics: </em>${ent.nlpTopics}</p>`
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
}

function updateEntryView() {
    // view-entry.html, main
    // var id = getQueryString();
    // if (id) {
    //     state.current = findById(id);
    // };
    if (state.current) {
        $('.title').text(state.current.title);
        $('.entry').text(state.current.body);
        $('.entry-display').append(`<a href="write-entry.html?${state.current.id}">edit</a>`);
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
    }
}
function writeEditButtons() {
    // write-entry.html, subordinate
    var ans;

    // var initialTitle = $('#title-text').val();
    // var initialBody = $('body-text').val();

    // $('a').click(function(e) {
    //     e.preventDefault();
    //     if (initialTitle !== $('#title-text') || initialBody !== $('#body-text')) {
    //         ans = confirm('You\'re sure you don\'t want to save your changes?');
    //     }
    //     if (ans) { return true; } else { return false; }
    // });

    $('button#discard').click(function(e) {
        e.preventDefault();
        if ($('#title-text').val().length !== 0 || $('#body-text').val().length !== 0) {
            ans = confirm('Are you sure you want to discard your entry?');
            if (ans) {
                window.open('write-entry.html', '_self');
            }
        }
    });

    $('button#save').click(function(e) {
        e.preventDefault();
        var title = $('#title-text').val().trim();
        var body = $('#body-text').val().trim();

        if (title.length === 0) { alert('Your entry needs a title'); }
        else if (body.length === 0) { alert('Your entry needs an actual body'); }

        else {                  // we have an actual entry to submit
            var id = getQueryString();
            if (id) {
                editEntry({id: id, title: title, body: body});
            } else {
                id = '';
                submitEntry({title: title, body: body});
            }
            window.open(`view-entry.html?${id}`, '_self');
        }
    });

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

function signUpForm() {
    $('a#signup-submit').click(function(e) {
        e.preventDefault();
        submitSignUp({ username: $('#username').val().trim(),
                       password: $('#password').val().trim() })
            .done(function() { window.open(`write-entry.html?`, '_self'); })
            .fail(function() { alert(); });
    });
}

function logoutBind() {
    // Here, we make a bad Basic Authentication request, and the resulting 401
    // error status should convince our browser to flush existing credentials
    $('a#logout-link').click(function(e) {
        window.open(`index.html`, '_self');
        authenticatedReq('A(W#JG(WJGAW(#JGW(#JGWJ#))))',
                         '0aw3g98gj03aw9gja30wgn9jg0n3ajg03gwj' );
    });
}

function demoLogin() {
    // This is eventually to be replaced with server-generated, on-demand demo
    // -accounts that we'll CRON-delete after some amount of inactivity
    $('a#demo-button').click(function(e) {
        e.preventDefault();
        authenticatedReq('demo-account', 'abc123')
            .done(function() { window.open('listings.html', '_self'); });
    });
}

//// high-level functions for our different screens
function viewEntryUpdate() {
    populateState()
        .then(state.updateState)
        .then(updateEntriesSidebar)
        .then(updateEntryView)
        .then(updateTagsSidebar);
}

function writeEntryUpdate() {
    populateState()
        .then(state.updateState)
        .then(updateEntriesSidebar)
        .then(updateTagsSidebar)
        .then(writeEditDisplayMain)
        .then(writeEditButtons);
}

function listingsUpdate() {
    populateState()
        .done(state.sortTags)
        .done(updateListingsView);
}

function signUp() {
    signUpForm();
}

function dispatch() {
    clearCredentials();
    logoutBind();
    if ($('body#view-entry').length)  { viewEntryUpdate(); };
    if ($('body#write-entry').length) { writeEntryUpdate(); };
    if ($('body#listings').length)    { listingsUpdate(); };
    if ($('body#sign-up').length)     { signUp(); };
    if ($('index'.length))            { demoLogin(); };
}

$( dispatch );
