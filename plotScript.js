window.addEventListener("load",run,false);

var transformScale = d3.scale.linear()
    .domain([0,15])
    .range([0,800]);


function run () {
	d3.json("data/rawCoordinates.json", function(json) {
    console.log(json);
    console.log(d3.entries(json));
    d3.select("#mbtaMap").selectAll("g")
    	.data(d3.entries(json))
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
    		.attr("r", 5);
});

	d3.json("data/spiderNetwork.json", function(json) {
		console.log(json);
	})

}
