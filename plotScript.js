window.addEventListener("load",run,false);


var SVG_SIZE = 1000;
var SVG_MARGIN = 20;
var SVG_SCALE = d3.scale.linear()
    .domain([0,15])
    .range([SVG_MARGIN,SVG_SIZE - SVG_MARGIN]);

var MBTA_COLOR = {
	0: "red",
	1: "red",
	2: "blue",
	3: "orange"
}

var MBTA_COORD = {};
var MBTA_NETWORK = [];

var DATASET_LOADED = 0;
var DATASET_MAX = 2;

function run () {
	d3.select(".container")
		.append("svg")
		.attr("id","mbtaMap")
		.attr("width",SVG_SIZE)
		.attr("height", SVG_SIZE)

	d3.json("data/rawCoordinates.json", function(json) {
    console.log(json);
    MBTA_COORD = json;
    dataSetsLoaded += 1;
    if (DATASET_LOADED === DATASET_MAX) {
    	drawMap();
    }

});

	d3.json("data/stationPaths.json", function(json) {
		console.log(json);
		MBTA_NETWORK = json;
		dataSetsLoaded += 1;
		if (DATASET_LOADED === DATASET_MAX) {
			drawMap();
		}
	})

}

function drawMap() {
    d3.select("#mbtaMap").selectAll("g")
    	.data(d3.entries(MBTA_COORD))
    	.enter()
    	.append("g")
    		.append("circle")
    		.attr("cx",function(d) {
    			return SVG_SCALE(parseFloat(d.value[0]));
    		})
    		.attr("cy", function(d) {
    			return SVG_SCALE(parseFloat(d.value[1]));
    		})
    		.attr("id", function(d) {
    			return d.key;
    		})
    		.attr("fill", function(d) {
    			for (var color = 0; color < MBTA_NETWORK.length; color ++) {
    				for (var i =0; i < MBTA_NETWORK[color].length; i++) {
    					if (d.key == MBTA_NETWORK[color][i]) {
    						return MBTA_COLOR[color];
    					}
    						
    				}
    			}
    		})
    		.attr("r", 5);

    var mbtaMap = d3.select("#mbtaMap");
    for (var color = 0; color < MBTA_NETWORK.length; color ++) {
    	for (var i =0; i < MBTA_NETWORK[color].length - 1; i++) {
    		console.log("test");
    		var firstNode = d3.select("#" + MBTA_NETWORK[color][i]);
    		var secondNode = d3.select("#" + MBTA_NETWORK[color][i+1]);
    		var firstX  = firstNode.attr("cx");
			var firstY = firstNode.attr("cy");
			var secondX = secondNode.attr("cx");
			var secondY = secondNode.attr("cy");
			mbtaMap.append("line")
				.attr("x1", firstX)
				.attr("x2", secondX)
				.attr("y1", firstY)
				.attr("y2", secondY)
				.attr("stroke-width","2")
				.attr("stroke", MBTA_COLOR[color])
    						
    	}
    }
}
