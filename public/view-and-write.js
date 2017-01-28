'use strict';


// state-oriented functions & data-structures
var state = {
    entries: [],
    current: null
};

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
function submitEntry(data) {
    return $.post(
        { url: '../api/entries',
          data: JSON.stringify(data),
          dataType: 'json',
          contentType: 'application/json'
        }
    );
}

function editEntry(data) {
    return $.ajax({
        url: '../api/entries/' + data.id,
        type: 'PUT',
        data: JSON.stringify(data),
        // id: data.id,
        // title: data.title,
        // body: data.body,
        dataType: 'json',
        contentType: 'application/json'
    });
}

function deleteEntry(id) {
    return $.ajax({
        url: '../api/entries/' + id,
        type: 'DELETE',
        data: JSON.stringify({id: id}),
        dataType: 'json',
        contentType: 'application/json'
    });
}

////
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
////

////
function addEntriesButtonsProperties(id, title) {
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
        var answer = confirm(`Are you sure you wanna delete "${title}"?`);
        deleteEntry(id)
            .catch(function() { window.open('listings.html', '_self') });
        // this isn't especially robust error handling; it just reloads the
        // page if the deletion fails. I suppose so that the page reflects the
        // server's state

        findByIdAndRemove(id);
        updateEntriesView();
    });
}

function updateEntriesView() {
    $('.tags-text').text('HERE YOU NEED A FUNCTION TO GET THE GLOBAL TAGS');
    $('.entries-list').text('');
    state.entries.forEach(function(ent) {
        var p = ent.publishedAt;
        var title = ent.title;
        var b = ent.body;
        var n = ent.NlpTopics;
        var id = ent.id;
        $('.entries-list').append(
            `${p} ${title} ${b} ${n}<br/>`
                + `<button id="${'view_'+id}">view</button>`
                + `<button id="${'edit_'+id}">edit</button>`
                + `<button id="${'del_'+id}">delete</button><br/><br/>`);
        addEntriesButtonsProperties(id, title);
    });
}

function queryStringId() {
    return document.location.search.substring(1);
}
function updateEntryView() {
    var id = queryStringId();
    if (id) {
        state.current = findById(id);
    };
    $('.title').text(state.current.title);
    $('.entry').text(state.current.body);
    $('.entry-display').append(`<a href="write-entry.html?${state.current.id}">edit</a>`);
}

function writeEditDisplayMain() {
    var current = findById(queryStringId());
    if (!current) {
        $('h1').text('write an entry');
    } else {
        $('h1').text('edit an entry')
        $('#title-text').val(current.title);
        $('#body-text').val(current.body);
    }
}
function writeEditButtons() {
    $('button#discard').click(function(e) {
        e.preventDefault();
        if ($('#title-text').val().length !== 0 || $('#body-text').val().length !== 0) {
            confirm('Are you sure you want to discard your entry?'); }
    });

    $('button#save').click(function(e) {
        e.preventDefault();
        var title = $('#title-text').val(); var body = $('#body-text').val();

        if (title.length === 0) { alert('Your entry needs a title'); }
        else if (body.length === 0) { alert('Your entry needs an actual body'); }

        else {
            var id = queryStringId();
            if (id) {
                editEntry({id: id, title: title, body: body});
            } else {
                submitEntry({title: title, body: body});
                id = state.current.id;
            }
            window.open(`view-entry.html?${id}`, '_self');
        }
    });
}

/////////////
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
        .then(writeEditDisplayMain)
        .then(writeEditButtons);
}

function listingsUpdate() {
    populateState()
        .then(updateEntriesView);
}

function dispatch() {
    if ($('body#view-entry').length)  { viewEntryUpdate(); };
    if ($('body#write-entry').length) { writeEntryUpdate(); };
    if ($('body#listings').length)    { listingsUpdate(); };
}

$( dispatch );
