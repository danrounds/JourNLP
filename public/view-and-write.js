'use strict';

var state = {
    entries: [],
    current: null
};

// &sidebar
//   &sidebar-entry
//     &entry-link
//       date, excerpt, keywords
//
// &entry-display
//   &title
//   p (no class nor id -- might need one) -- our entry text
//   button[edit]
//
// &tags-bar
//   tags-text

function getEntries() {
    // returns a JSON array, from our API
    return $.getJSON('../api/entries');
}

function populateState() {
    if (!state.entries.length) {
        // If our state isn't populated, we get data via API
        return getEntries().
            done(function(data) {
                state.entries = data;
                state.current = data[0];
            });
    }
    return $.Deferred().resolve(state);
    // lets us use the same interface, whether our data are async or synchronous
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
    ;
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
