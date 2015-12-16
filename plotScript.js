window.addEventListener("load",run,false);

var DATE_SLIDER_HEIGHT = 100;
var SVG_SIZE = 1000;
var SVG_MARGIN = 30;
var SVG_SCALE = d3.scale.linear()
    .domain([0,15])
    .range([SVG_MARGIN,SVG_SIZE - SVG_MARGIN]);


var MBTA_COLOR = {
	0: "red",
	1: "red",
	2: "blue",
	3: "orange"
}

var TOOLTIP = {width:150, height:80}

var MBTA_COORD = {};
var MBTA_NETWORK = [];
var MBTA_MAPPING = {};
var GLOBAL = {data : {},
            maxEntry: 0,
            maxExit:0,
            showEntry: true 
        } 

var DATASET_LOADED = 0;
var DATASET_MAX = 3;
var DATE_INFO = {
    startTime: "04:32:00",
    endTime: "14:32:00",
    date: '2014-02-15'
}

function toggle(){
    // function to toggle between showing number of entries and exits
    d3.select('button').on('click', function() {
        GLOBAL.showEntry = !GLOBAL.showEntry
        drawMap();
        if (GLOBAL.showEntry){
            d3.select(this).text("Entries");
        } else {
            d3.select(this).text("Exits");
        }

    });
}


function drawDateSlider() {
    // var s = computeSizes()
    var dateSlider = d3.select("#dateSlider");
    dateSlider
        .attr

    formatDate = d3.time.format("%a %b %d");
// scale function
    var timeScale = d3.time.scale()
        .domain([new Date('2014-02-02'), new Date('2014-03-02')])
        .range([100, 900])
        .clamp(true);

    var startValue = timeScale(new Date('2014-02-15'));
        startingValue = new Date('2014-02-15');

// defines brush
    var brush = d3.svg.brush()
        .x(timeScale)
        .extent([startingValue, startingValue])
        .on("brush", brushed)
        .on("brushend", function() {
            requestData();
        });


    dateSlider.append("g")
        .attr("class", "x axis")
// put in middle of screen
        .attr("transform", "translate(0," + DATE_SLIDER_HEIGHT / 2 + ")")
// inroduce axis
        .call(d3.svg.axis()
        .scale(timeScale)
        .orient("bottom")
        .tickFormat(function(d) {
            return formatDate(d);
        })
        .tickSize(0)
        .tickPadding(12)
        .tickValues([timeScale.domain()[0], timeScale.domain()[1]]))
        .select(".domain")
        .select(function() {
            return this.parentNode.appendChild(this.cloneNode(true));
        })
        .attr("class", "halo");

    var slider = dateSlider.append("g")
        .attr("class", "slider")
        .call(brush);

    slider.selectAll(".extent,.resize")
        .remove();

    slider.select(".background")
        .attr("height", DATE_SLIDER_HEIGHT);

    var handle = slider.append("g")
        .attr("class", "handle")

    handle.append("path")
        .attr("transform", "translate(0," + DATE_SLIDER_HEIGHT / 2 + ")")
        .attr("d", "M 0 -20 V 20")

    handle.append('text')
        .text(startingValue)
        .attr("transform", "translate(" + (-18) + " ," + (DATE_SLIDER_HEIGHT / 2 - 25) + ")");

    slider
        .call(brush.event)

    function brushed() {
        var value = brush.extent()[0];

        if (d3.event.sourceEvent) { // not a programmatic event
            value = timeScale.invert(d3.mouse(this)[0]);
            brush.extent([value, value]);
            DATE_INFO.date = d3.time.format("%Y-%m-%d")(value);   
        }

        handle.attr("transform", "translate(" + timeScale(value) + ",0)");
        handle.select('text').text(formatDate(value));
    }

}

function requestData() {
    // makes the request to our backend with the start and the end date which are extracted\
    // from the sliders
    var start = DATE_INFO.date + " " + DATE_INFO.startTime;
    var end = DATE_INFO.date + " " + DATE_INFO.endTime;
        d3.json("/data")
        .header("Content-Type", "application/json")
        .post(JSON.stringify({start: start, end: end}), function(error, data) {
            GLOBAL.data = data.data;
            GLOBAL.maxEntry = data.maxEntry;
            GLOBAL.maxExit = data.maxExit;

            drawMap();
    });
}

function run () {

    drawDateSlider();
    drawTimeSlider();
    toggle();

	d3.select(".container")
		.append("svg")
        .style("margin","auto")
		.attr("id","mbtaMap")
		.attr("width",SVG_SIZE)
		.attr("height", SVG_SIZE)

    // load all of the files that we need from the data folder
    d3.json("data/turnstile-gtfs-mapping.json", function(json) {
        MBTA_MAPPING = json;
        d3.json("data/rawCoordinates.json", function(json) {
        MBTA_COORD = json;
            d3.json("data/stationPaths.json", function(json) {
                MBTA_NETWORK = json;
                    requestData();
            });
    });
    });
}

function convertToHour(timeValue) {
    var minutesScale = d3.scale.linear()
        .domain([0,1])
        .range([0,60]);
    var minutes = minutesScale(timeValue % 1)
    var hours = Math.floor(timeValue);
    
    if (minutes === 0) {
        minutes = "00";
    }

    if (hours < 10) {
        hours = "0" + hours;
    }
    return  hours + ":" + minutes + ":00";
}

function drawTimeSlider() {
	d3.select('#timeSlider').call(d3.slider().axis(true).min(0).max(24).step(.25).value([12,13])
        .on("slideend", function(evt, value) {

            DATE_INFO.endTime = convertToHour(value[1]);
            DATE_INFO.startTime = convertToHour(value[0]);

            requestData();
    	}));
}


function drawMap() {
    var data = []

    // scale the circles correctly depending on the max
    var radiusScale = d3.scale.linear()
        .domain([0,(GLOBAL.showEntry ? GLOBAL.maxEntry : GLOBAL.maxExit)])
        .range([3, 30]);

    // combine the mbta map data with entries and exit data
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

    // clears previous graph
    d3.select("#mbtaMap").html("");

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
        .on("mouseover", function(d) {
            d3.selectAll(".tooltip1")
                .attr("transform",d3.select(this.parentNode).attr("transform"));
            this.style.fill = "#772310";
            showToolTip(SVG_SCALE(parseFloat(d.value[0])), SVG_SCALE(parseFloat(d.value[1])), d.station, 
                GLOBAL.showEntry ? d.sumEntries.toString() : d.sumExits.toString());
        })
        .on("mouseout", function(d) {
            hideToolTip();
            for (var color = 0; color < MBTA_NETWORK.length; color ++) {
                for (var i =0; i < MBTA_NETWORK[color].length; i++) {
                    if (d.key == MBTA_NETWORK[color][i]) {
                        this.style.fill = MBTA_COLOR[color];
                    }
                        
                }
            }
        })
		.attr("r", function(d){
            // radius depends on the entry or exit data
            return radiusScale(GLOBAL.showEntry ? d.sumEntries : d.sumExits);
            
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
			var positions = accountForStations(firstX, firstY, secondX, secondY, firstNode.attr("r"), secondNode.attr("r"));
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



function showToolTip (cx,cy,text1,text2) {

    var svg = d3.select("#mbtaMap");
    var yDirection = 1;
    var Y_OFFSET = 90;

    var X_OFFSET = 0;

    if (cx - TOOLTIP.width/2 < 0) {
        X_OFFSET = 90;
    }

    if (cx + TOOLTIP.width/2 > SVG_SIZE) {
        X_OFFSET = -90;
    }

    console.log(cy);
    console.log(TOOLTIP.height/2);
    if (cy + TOOLTIP.height/2 + Y_OFFSET > SVG_SIZE) {
        yDirection = -1;
    }

    var box = svg.append("rect");
    box
        .attr("class","tooltip1")
        .attr("x",cx-  TOOLTIP.width/2 + X_OFFSET)
        .attr("y",yDirection * Y_OFFSET+cy-TOOLTIP.height/2)
        .attr("width",TOOLTIP.width)
        .attr("height",TOOLTIP.height)
        .style("fill","rgba(128,128,128, 0.5)")
        .style("stroke","#000000")
        .style("stroke-width","2px");

    var stationText = svg.append("text");
    stationText
        .attr("class","tooltip1")
        .attr("x",cx + X_OFFSET)
        .attr("y",yDirection * Y_OFFSET+cy-7)
        .attr("dy","0.3em")
        .style("text-anchor","middle")
        .style("font-size",24)
        .text(text1);

    svg.append("text")
        .attr("class","tooltip1")
        .attr("x",cx + X_OFFSET)
        .attr("y",yDirection * Y_OFFSET+cy+20)
        .attr("dy","0.3em")
        .style("text-anchor","middle")
        .style("font-size",20)
        .text(GLOBAL.showEntry ? "Entries: " + text2: "Exits: " + text2);

    if (parseInt(box.attr("width")) < stationText.node().getComputedTextLength()) {
        var correctWidth = stationText.node().getComputedTextLength() + 15;
        box.attr("width", correctWidth);
        box.attr("x", cx - correctWidth/2);
        stationText.attr("x");
    }

}

function hideToolTip () {
    d3.selectAll(".tooltip1").remove();
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
