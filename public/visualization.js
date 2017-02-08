'use strict';

function drawChart() {
    // var data = google.visualization.arrayToDataTable(
    //   [ ['Phrases'],
    //     ['cats are better than dogs'],
    //     ['cats eat kibble'],
    //     ['cats are better than hamsters'],
    //     ['cats are awesome'],
    //     ['cats are people too'],
    //     ['cats eat mice'],
    //     ['cats meowing'],
    //     ['cats in the cradle'],
    //     ['cats eat mice'],
    //     ['cats in the cradle lyrics',],
    //     ['cats eat kibble'],
    //     ['cats for adoption'],
    //     ['cats are family'],
    //     ['cats eat mice'],
    //     ['cats are better than kittens'],
    //     ['cats are evil'],
    //     ['cats are weird'],
    //     ['cats eat mice'],
    //   ]
    // );
    var array = [];
    for (var k in state.globalTags) {
        array.push([k]);
    }

    console.log(array);
    var data = google.visualization.arrayToDataTable(array);

    var options = {
        wordtree: {
            format: 'implicit'
        }
    };

    var chart = new google.visualization.WordTree(document.getElementById('wordtree_basic'));
    chart.draw(data, options);
}

var arrayy;

function drawChart2() {
    // var data = google.visualization.arrayToDataTable([
    //     ['Location', 'Parent', 'Market trade volume (size)', 'Market increase/decrease (color)'],
    //     ['Global',    null,                 0,                               0],
    //     ['America',   'Global',             0,                               0],
    //     ['Europe',    'Global',             0,                               0],
    //     ['Asia',      'Global',             0,                               0],
    //     ['Australia', 'Global',             0,                               0],
    //     ['Africa',    'Global',             0,                               0],
    //     ['Brazil',    'America',            11,                              10],
    //     ['USA',       'America',            52,                              31],
    //     ['Mexico',    'America',            24,                              12],
    //     ['Canada',    'America',            16,                              -23],
    //     ['France',    'Europe',             42,                              -11],
    //     ['Germany',   'Europe',             31,                              -2],
    //     ['Sweden',    'Europe',             22,                              -13],
    //     ['Italy',     'Europe',             17,                              4],
    //     ['UK',        'Europe',             21,                              -5],
    //     ['China',     'Asia',               36,                              4],
    //     ['Japan',     'Asia',               20,                              -12],
    //     ['India',     'Asia',               40,                              63],
    //     ['Laos',      'Asia',               4,                               34],
    //     ['Mongolia',  'Asia',               1,                               -5],
    //     ['Israel',    'Asia',               12,                              24],
    //     ['Iran',      'Asia',               18,                              13],
    //     ['Pakistan',  'Asia',               11,                              -52],
    //     ['Egypt',     'Africa',             21,                              0],
    //     ['S. Africa', 'Africa',             30,                              43],
    //     ['Sudan',     'Africa',             12,                              2],
    //     ['Congo',     'Africa',             10,                              12],
    //     ['Zaire',     'Africa',             8,                               10]
    // ]);

    var array = [['Words', 'Parent', 'Frequency'], ['Words', null, 0]];


    for (var k in state.globalTags) {
        array.push([k, 'Words', state.globalTags[k].length]);
    }

    arrayy = array;

    console.log(array);
    var data = google.visualization.arrayToDataTable(array);


    var tree = new google.visualization.TreeMap(document.getElementById('chart_div'));

    tree.draw(data, {
        minColor: '#c70039',
        midColor: '#900c3f',
        maxColor: '#581845',
        headerHeight: 15,
        fontColor: 'black',
        showScale: true
    });
}



$(function() {
    populateState()
        .done(function() {
            state.sortTags();
            google.charts.load('current', {packages:['wordtree', 'treemap']});
            google.charts.setOnLoadCallback(drawChart);
            google.charts.setOnLoadCallback(drawChart2);

            // google.charts.load('current', {'packages':['treemap']});
        });
});



