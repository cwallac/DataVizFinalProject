window.addEventListener("load",run,false);

var transformScale = d3.scale.linear()
    .domain([0,15])
    .range([0,780]);

var RED_PATH = 1;
var colorMap = {
	0: "red",
	1: "red",
	2: "blue",
	3: "orange"
}

var mapCoordinates = {};
var network = [];

var dataSetsLoaded = 0;
var maxDatasets = 2;

function run () {
	d3.json("data/rawCoordinates.json", function(json) {
    console.log(json);
    mapCoordinates = json;
    dataSetsLoaded += 1;
    if (dataSetsLoaded === maxDatasets) {
    	drawMap();
    }

});

	d3.json("data/stationPaths.json", function(json) {
		console.log(json);
		network = json;
		dataSetsLoaded += 1;
		if (dataSetsLoaded === maxDatasets) {
			drawMap();
		}
	})

}

function drawMap() {
    d3.select("#mbtaMap").selectAll("g")
    	.data(d3.entries(mapCoordinates))
    	.enter()
    	.append("g")
    		.append("circle")
    		.attr("cx",function(d) {
    			return transformScale(parseFloat(d.value[0])) + 10;
    		})
    		.attr("cy", function(d) {
    			return transformScale(parseFloat(d.value[1]))+ 10;
    		})
    		.attr("id", function(d) {
    			return d.key;
    		})
    		.attr("fill", function(d) {
    			for (var color = 0; color < network.length; color ++) {
    				for (var i =0; i < network[color].length; i++) {
    					if (d.key == network[color][i]) {
    						return colorMap[color];
    					}
    						
    				}
    			}
    		})
    		.attr("r", 5);

    var mbtaMap = d3.select("#mbtaMap");
    for (var color = 0; color < network.length; color ++) {
    	for (var i =0; i < network[color].length - 1; i++) {
    		console.log("test");
    		var firstNode = d3.select("#" + network[color][i]);
    		var secondNode = d3.select("#" + network[color][i+1]);
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
				.attr("stroke", colorMap[color])
    						
    	}
    }
}
