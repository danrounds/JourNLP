'use strict';

var state, google, $, displayGlobalTags, logoutBind;

// API calls
function drawMap() {
    var array =         [  ['Words',  'Parent', 'Frequency'],
                           ['Words',   null,        0      ]   ];
    // Data look like:     [tag,      'Words',      n      ],
    // where tag is one of our tags, and 'Words' is a literal string. An ideal
    // version of this graph is hierarchical. Ours isn't (unless you count a
    // single parent as hierarchical)
    for (var k in state.globalTags) {
        array.push([k, 'Words', state.globalTags[k].length]);
    }
    var data = google.visualization.arrayToDataTable(array);
    var wordMap = new google.visualization.TreeMap(document.getElementById('chart-div'));

    wordMap.draw(data, {
        minColor: '#ff9933',
        midColor: '#ff3300',
        maxColor: '#ff0000',
        headerHeight: 15,
        fontColor: 'black',
        fontFamily: 'Quicksand',
        showScale: true
    });
}

function drawTree() {
    // Data look like:
    // [ ['Phrases'],
    //   ['cats are better than dogs'],
    //   ['cats eat mice'],
    //   ['cats eat kibble'] ]
    var array = [ ['Phrases'] ];
    for (var k in state.globalTags) {
        array.push([k]);
    }
    var data = google.visualization.arrayToDataTable(array);
    var options = {
        fontName: 'Quicksand',
        format: 'implicit'
    };
    var tree = new google.visualization.WordTree(document.getElementById('chart-div'));
    tree.draw(data, options);
}


// Event handlers:
function handleMap() {
    $('li#map').click(function() {
        drawMap();
        $('#tree').removeClass('switched');
        $('#map').addClass('switched');
    });
}

function handleTree() {
    $('li#tree').click(function() {
        drawTree();
        $('#map').removeClass('switched');
        $('#tree').addClass('switched');
        // $('body').focus();
    });
}

$(function() {
    state.populateState()
        .done(function() {
            state.sortTags();

            if (state.entries.length < 6) {
                $('p#results-warning').text('Warning: Results aren\'t very robust when you don\'t have many entries');
            }

            displayGlobalTags();
            logoutBind();

            google.charts.load('current', {packages:['wordtree', 'treemap']});
            google.charts.setOnLoadCallback(handleMap);
            google.charts.setOnLoadCallback(handleTree);
            google.charts.setOnLoadCallback(drawMap); // Our initial view
        });
});
