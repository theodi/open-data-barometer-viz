// The SVG container
var width  = 800,
    height = 400;

var color = d3.scale.category10();

var projection = d3.geo.mercator()
                .translate([410, 260])
                .scale(140);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(d3.behavior.zoom()
    .on("zoom", redraw))
    .append("g");

function redraw() {
    svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

var tooltip = d3.select("#map").append("div")
    .attr("class", "tooltip");

queue()
    .defer(d3.json, "data/world-50m.json")
    .defer(d3.tsv, "data/world-country-names.tsv")
    .defer(d3.json, "data/cities.json")
    .defer(d3.csv, "data/ODB-2013-Rankings.csv")
    .await(ready);

function getColor(d,i){
	var overlayHueMin = 238,
	overlayHueMax = 240,
	overlaySatMin = 1,
	overlaySatMax = 1,
	overlayValMin = 0.95,
	overlayValMax = 0.8;
	if (d.odbdata === undefined) {
		return d3.rgb(255,255,255);
	} else {
		var p = d.odbdata["ODB-Scaled"] / 40;
		var h = overlayHueMin + p * (overlayHueMax - overlayHueMin);
		var s = overlaySatMin + p * (overlaySatMax - overlaySatMin);
		var v = overlayValMin + p * (overlayValMax - overlayValMin);
		return d3.hsl(h,s,v);
	}
}

function ready(error, world, names, points, odbdata) {
  console.log(names);
  console.log(odbdata);
  var countries = topojson.object(world, world.objects.countries).geometries,
      neighbors = topojson.neighbors(world, countries),
      i = -1,
      n = countries.length;

  countries.forEach(function(d) { 
    var tryit = names.filter(function(n) { return d.id == n.id; })[0];
    if (typeof tryit === "undefined"){
      d.name = "Undefined";
      console.log(d);
    } else {
      d.name = tryit.name; 
    }
    var tryit2 = odbdata.filter(function(n) { return d.name == n.Country; })[0];
    if (typeof tryit2 === "undefined"){
//	console.log("Failed to find " + d.name);
    } else {
    	d.odbdata = tryit2;
    }
  });

var country = svg.selectAll(".country").data(countries);

  country
   .enter()
    .insert("path")
    .attr("class", "country")    
      .attr("title", function(d,i) { return d.name; })
      .attr("d", path)
      .style("fill", function(d, i) { return getColor(d); });

    //Show/hide tooltip
    country
      .on("mousemove", function(d,i) {
//	  document.getElementById("info").innerHTML = d.name;
//        var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
//
//        tooltip
//          .classed("hidden", false)
//          .attr("style", "left:"+(mouse[0])+"px;top:"+mouse[0]+"px")
//          .html(d.name)
      })
      .on("click", function(d,i) {
	document.getElementById("country").innerHTML = d.name;
	if (d.odbdata) {
		document.getElementById("score").innerHTML = d.odbdata["ODB-Rank"];
		console.log(d.odbdata);
		var top = [];
		var data = [];
		var obj = {};
		obj.axis = "Readiness: Government";
		obj.value = d.odbdata["Readiness_Government-Scaled"] / 100;
		data.push(obj);
		var obj = {};
		obj.axis = "Impacts: Economic";
		obj.value = d.odbdata["Impacts_Economic-Scaled"] / 100;
		data.push(obj);
		var obj = {};
		obj.axis = "Impacts: Social";
		obj.value = d.odbdata["Impact_Social-Scaled"] / 100;
		data.push(obj);
		var obj = {};
		obj.axis = "Impacts: Political";
		obj.value = d.odbdata["Impact_Political-Scaled"] / 100;
		data.push(obj);
		var obj = {};
		obj.axis = "Datasets: Innovation";
		obj.value = d.odbdata["Datasets_Innovation"] / 100;
		data.push(obj);
		var obj = {};
		obj.axis = "Datasets: Social Policy";
		obj.value = d.odbdata["Datasets_Social_Policy"] / 100;
		data.push(obj);
		var obj = {};
		obj.axis = "Datasets: Accountability";
		obj.value = d.odbdata["Datasets_Accountability"] / 100;
		data.push(obj);
		var obj = {};
		obj.axis = "Readiness: Enterpreneurs & Business";
		obj.value = d.odbdata["Readiness_Entrepreneurs-Scaled"] / 100;
		data.push(obj);
		var obj = {};
		obj.axis = "Readiness: Citizens & Civil Society";
		obj.value = d.odbdata["Readiness_Citizens-Scaled"] / 100;
		data.push(obj);
		top.push(data);
		console.log(top);
		RadarChart.draw("#radar", top);	
	}
      })
      .on("mouseout",  function(d,i) {
        tooltip.classed("hidden", true)
      });

}
