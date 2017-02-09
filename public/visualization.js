'use strict';

var state, google, populateState, $, displayGlobalTags;

function drawMap() {
    var array =         [  ['Words',  'Parent', 'Frequency'],
                           ['Words',   null,        0      ]   ];
    // data look like:     [tag,      'Words',      n      ],
    // where tag is one of our tags, and 'Words' is a literal string. An ideal
    // version of this graph is hierarchical. Ours isn't (unless you count a
    // single parent as hierarchical)
    for (var k in state.globalTags) {
        array.push([k, 'Words', state.globalTags[k].length]);
    }
    var data = google.visualization.arrayToDataTable(array);
    var tree = new google.visualization.TreeMap(document.getElementById('chart-div'));

    tree.draw(data, {
        minColor: '#c70039',
        midColor: '#900c3f',
        maxColor: '#581845',
        headerHeight: 15,
        fontColor: 'black',
        showScale: true
    });
}

function drawTree() {
    // data look like:
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
        wordtree: {
            format: 'implicit'
        }
    };
    var chart = new google.visualization.WordTree(document.getElementById('chart-div'));
    chart.draw(data, options);
}

function handleMap() {
    $('li#map').click(drawMap);
}

function handleTree() {
    $('li#tree').click(drawTree);
}

$(function() {
    populateState()
        .done(function() {
            state.sortTags();

            if (state.entries.length < 6) {
                $('p#results-warning').text('Warning: Results aren\'t very robust when you don\'t have many entries');
            }

            displayGlobalTags();

            google.charts.load('current', {packages:['wordtree', 'treemap']});
            google.charts.setOnLoadCallback(handleMap);
            google.charts.setOnLoadCallback(handleTree);
            google.charts.setOnLoadCallback(drawMap); // our initial view
        });
});



