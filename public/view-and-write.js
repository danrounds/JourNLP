'use strict';

var state = {
    entries: [],
    current: null
};

// function getEntries() {
//     // returns a JSON array, from our API
//     return $.getJSON('../api/entries');
// }

function populateState() {
    if (!state.entries.length) {
        // If our state isn't populated, we get data via API
        // return getEntries().
        return $.getJSON('../api/entries')
            .done(function(data) {
                state.entries = data;
                state.current = data[0];
            });
    }
    return $.Deferred().resolve(state);
    // lets us use the same interface, whether our data are async or synchronous
}

function submitEntry(data) {
    return $.post(
        { url: '../api/entries',
          data: JSON.stringify(data),
          dataType: 'json',
          contentType: 'application/json'
        }
    );
}

function updateEntriesSidebar() {
    $('.sidebar').text('');
    state.entries.forEach(function(ent) {
        var p = ent.publishedAt;
        var e = ent.title;
        var b = ent.body;
        var n = ent.NlpTopics;
        var link = ent.id;
        $('.sidebar').append(`<a href="view-entry.html?${link}">${p} ${e} ${b} ${n}</a><br/><br/>`);
    });
    ;
}

function updateTagsSidebar() {
    $('.tags-text').text('tags: ' + state.current.NlpTopics);
}

function updateEntryView() {
    $('.title').text(state.current.title);
    $('.entry').text(state.current.body);
    $('.entry-display').append(`<a href="write-entry.html?${state.current.id}">edit</a>`);
}


function updateWriteEditView() {
    $('button#discard').click(function(e) {
        e.preventDefault();
        if ($('#title-text').val().length !== 0 || $('#body-text').val().length !== 0) {
            confirm('Are you sure you want to discard your entry?'); }
    });
    $('button#save').click(function(e) {
        e.preventDefault();
        var title = $('#title-text').val();
        var body = $('#body-text').val()

        if (title.length === 0) { alert('Your entry needs a title'); }
        else if (body.length === 0) { alert('Your entry needs an actual body'); }
        else {
            submitEntry({title: title, body: body});
            window.open(`view-entry.html?${state.current.id}`, '_self');
        }
    });
}

function viewEntryUpdate() {
    populateState()
        .then(updateEntriesSidebar)
        .then(updateTagsSidebar)
        .then(updateEntryView);
}

function writeEntryUpdate() {
    populateState()
        .then(updateEntriesSidebar)
        .then(updateTagsSidebar)
        .then(updateWriteEditView);
}

function dispatch() {
    if ($('body#view-entry').length)  { viewEntryUpdate(); };
    if ($('body#write-entry').length) { writeEntryUpdate(); };
}

$( dispatch );
