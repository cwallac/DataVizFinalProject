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
var MBTA_MAPPING = {};
var GLOBAL = {data : {},
            maxEntry: 0,
            maxExit:0 }

var DATASET_LOADED = 0;
var DATASET_MAX = 2;
    

function run () {

    var start = "2014-02-01 04:32:00";
    var end = "2014-02-01 05:32:00";


    d3.json("/data")
        .header("Content-Type", "application/json")
        .post(JSON.stringify({start: start, end: end}), function(error, data) {
    
        console.log("data", data);
        GLOBAL.data = data.data;
        GLOBAL.maxEntry = data.maxEntry;
        GLOBAL.maxExit = data.maxExit;
    });

	d3.select(".container")
		.append("svg")
		.attr("id","mbtaMap")
		.attr("width",SVG_SIZE)
		.attr("height", SVG_SIZE)

    d3.json("data/turnstile-gtfs-mapping.json", function(json) {
        MBTA_MAPPING = json;
    })

	d3.json("data/rawCoordinates.json", function(json) {
    MBTA_COORD = json;
    DATASET_LOADED += 1;
    if (DATASET_LOADED === DATASET_MAX) {
    	drawMap();
    	drawSlider();
    }

});

	d3.json("data/stationPaths.json", function(json) {
		MBTA_NETWORK = json;
		DATASET_LOADED += 1;
		if (DATASET_LOADED === DATASET_MAX) {
			drawMap();
			drawSlider();
		}
	})


}

function drawSlider() {
	d3.select('#timeSlider').call(d3.slider().axis(true).min(0).max(24).step(.25).value([12,13]).on("slide", function(evt, value) {
	}));
}


function drawMap() {
    data = []

    var radiusScale = d3.scale.linear()
    .domain([0,GLOBAL.maxEntry])
    .range([3, 30]);

    console.log(GLOBAL.data)
    d3.entries(MBTA_COORD).forEach(function(value){
        GLOBAL.data.forEach(function(station){
            if (MBTA_MAPPING[station.station] === value.key){
                // merge two objects
                for(var attrname in station){
                    value[attrname] = station[attrname];
                }
                data.push(value);
            }
        });
    });
    console.log(data);

    d3.select("#mbtaMap").selectAll("g")
    	.data(data)
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
    		.attr("r", function(d){
                return radiusScale(d.sumEntries);
                
            });

    var mbtaMap = d3.select("#mbtaMap");
    for (var color = 0; color < MBTA_NETWORK.length; color ++) {
    	for (var i =0; i < MBTA_NETWORK[color].length - 1; i++) {
    		var firstNode = d3.select("#" + MBTA_NETWORK[color][i]);
    		var secondNode = d3.select("#" + MBTA_NETWORK[color][i+1]);
    		var firstX  = firstNode.attr("cx");
			var firstY = firstNode.attr("cy");
			var secondX = secondNode.attr("cx");
			var secondY = secondNode.attr("cy");
			var positions = accountForStations(firstX, firstY, secondX, secondY, 5, 5);
			mbtaMap.append("line")
				.attr("x1", positions["x1"])
				.attr("x2", positions["x2"])
				.attr("y1", positions["y1"])
				.attr("y2", positions["y2"])
				.attr("stroke-width","2")
				.attr("stroke", MBTA_COLOR[color])
    						
    	}
    }
}

/**
*Nitpicky function to remove overhang of miscolored lines on T-stations
*Does some trig to figure out how far it will be
*/
function accountForStations(x1, y1, x2, y2, radius1, radius2) {
	var angle = Math.atan2(y2 - y1, x2 - x1);
	var calculatedObject = {};
	calculatedObject["x1"] = parseFloat(x1) + Math.cos(angle) * radius1;
	calculatedObject["x2"] = parseFloat(x2) - Math.cos(angle) * radius2;
	calculatedObject["y1"] = parseFloat(y1) + Math.sin(angle) * radius1;
	calculatedObject["y2"] = parseFloat(y2) - Math.sin(angle) * radius2;
	return calculatedObject;

}
