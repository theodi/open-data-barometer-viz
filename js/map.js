// The SVG container
var width  = 850,
    height = 400;

var year = 2013;
var current;
var countries;

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
    .defer(d3.csv, "data/ODB-2013-Datasets-Scored.csv")
    .defer(d3.csv, "data/ODB-2014-Rankings-FAKE.csv")
    .defer(d3.csv, "data/ODB-2014-Datasets-Scored-FAKE.csv")
    .defer(d3.csv, "data/countries_income.csv")
    .await(ready);

function getColor(d,i){
	var overlayHueMin = 238,
	overlayHueMax = 240,
	overlaySatMin = 1,
	overlaySatMax = 1,
	overlayValMin = 0.95,
	overlayValMax = 0.8;
	if (d.odbdata[year] === undefined) {
		return d3.rgb(255,255,255);
	} else {
		var p = d.odbdata[year]["ODB-Scaled"] / 40;
		var h = overlayHueMin + p * (overlayHueMax - overlayHueMin);
		var s = overlaySatMin + p * (overlaySatMax - overlaySatMin);
		var v = overlayValMin + p * (overlayValMax - overlayValMin);
		return d3.hsl(h,s,v);
	}
}

function ready(error, world, names, points, odbdata2013, datasetScores2013, odbdata2014, datasetScores2014,income) {
  countries = topojson.object(world, world.objects.countries).geometries,
      neighbors = topojson.neighbors(world, countries),
      i = -1,
      n = countries.length;
    
  countries.forEach(function(d) {
    d.odbdata = {};
    d.datasets = {};
    var tryit = names.filter(function(n) { return d.id == n.id; })[0];
    if (typeof tryit === "undefined"){
      console.log("Failed in match 1: " + d);
    } else {
      d.name = tryit.name; 
    }
    d.odbdata = {};
    d.datasets = {};
    var tryit2 = odbdata2013.filter(function(n) { return d.name == n.Country; })[0];
    if (typeof tryit2 === "undefined"){
//	console.log("Failed in match 2: " + d.name);
    } else {
    	d.odbdata["2013"] = tryit2;
    }
    var tryit3 = datasetScores2013.filter(function(n) { return d.name == n.Country; });
    if (typeof tryit3 === "undefined"){
//	console.log("Failed in match 3: " + d.name);
    } else {
	d.datasets["2013"] = tryit3;
    } 
    var tryit2 = odbdata2014.filter(function(n) { return d.name == n.Country; })[0];
    if (typeof tryit2 === "undefined"){
//	console.log("Failed in match 2: " + d.name);
    } else {
    	d.odbdata["2014"] = tryit2;
    }
    var tryit3 = datasetScores2014.filter(function(n) { return d.name == n.Country; });
    if (typeof tryit3 === "undefined"){
//	console.log("Failed in match 3: " + d.name);
    } else {
	d.datasets["2014"] = tryit3;
    } 
    var tryit4 = income.filter(function(n) { return d.name == n.Country; })[0];
    if (typeof tryit4 === "undefined"){
//	console.log("Failed in match 3: " + d.name);
    } else {
	d.income = tryit4.Tier;
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
      })
      .on("click", function(d,i) {
	current = d;
	drawStats(d);
      })
      .on("mouseout",  function(d,i) {
        tooltip.classed("hidden", true)
      });
};

function drawStats(d) {

  var country = svg.selectAll(".country").data(countries);
  country
   .style("fill", function(d, i) { return getColor(d); });

	document.getElementById("country").innerHTML = d.name;
	
	var incomeSpan = document.createElement("sup");
	incomeSpan.setAttribute("id","income");
	if (d.income == "Low Income") {
		incomeSpan.innerHTML = "$";
		incomeSpan.setAttribute("title","Low Income");
	} else if (d.income == "Lower Middle Income") {
		incomeSpan.innerHTML = "$$";
		incomeSpan.setAttribute("title","Lower Middle Income");
	} else if (d.income == "Upper Middle Income") {
		incomeSpan.innerHTML = "$$$";
		incomeSpan.setAttribute("title","Upper Middle Income");
	} else if (d.income == "High Income") {
		incomeSpan.innerHTML = "$$$$";
		incomeSpan.setAttribute("title","High Income");
	} else {
		incomeSpan.innerHTML = "";
	}
	document.getElementById("country").appendChild(incomeSpan);
	document.getElementById("score").innerHTML = "X";
	document.getElementById("radar").innerHTML = "";
	document.getElementById("datasets").innerHTML = "";
	document.getElementById("arrow").innerHTML = "";
	document.getElementById("movement").innerHTML = "";
	

	if (d.datasets[year]) {
		Datasets.draw("#datasets",d.datasets[year]);
	}
	if (d.odbdata[year]) {
		document.getElementById("score").innerHTML = d.odbdata[year]["ODB-Rank"];
		if (d.odbdata[year-1]) {
			movement = d.odbdata[year-1]["ODB-Rank"] - d.odbdata[year]["ODB-Rank"];
			if (movement > 0) {
				document.getElementById("arrow").innerHTML = "&nearr;";
				document.getElementById("movement").innerHTML = movement;
				document.getElementById("arrow").style.color = "green";
				document.getElementById("movement").style.color = "green";
				
			} 
			if (movement < 0) {
				movement = movement * -1;
				document.getElementById("arrow").innerHTML = "&searrow;";
				document.getElementById("movement").innerHTML = movement;
				document.getElementById("arrow").style.color = "red";
				document.getElementById("movement").style.color = "red";
			}
			console.log(d.odbdata[year-1]["ODB-Rank"]);
		}
		var top = [];
		var data = [];
		var obj = {};
		obj.axis = "Readiness: Government";
		obj.value = d.odbdata[year]["Readiness_Government-Scaled"] / 100;
		data.push(obj);
		var obj = {};
		obj.axis = "Impacts: Economic";
		obj.value = d.odbdata[year]["Impacts_Economic-Scaled"] / 100;
		data.push(obj);
		var obj = {};
		obj.axis = "Impacts: Social";
		obj.value = d.odbdata[year]["Impact_Social-Scaled"] / 100;
		data.push(obj);
		var obj = {};
		obj.axis = "Impacts: Political";
		obj.value = d.odbdata[year]["Impact_Political-Scaled"] / 100;
		data.push(obj);
		var obj = {};
		obj.axis = "Datasets: Innovation";
		obj.value = d.odbdata[year]["Datasets_Innovation"] / 100;
		data.push(obj);
		var obj = {};
		obj.axis = "Datasets: Social Policy";
		obj.value = d.odbdata[year]["Datasets_Social_Policy"] / 100;
		data.push(obj);
		var obj = {};
		obj.axis = "Datasets: Accountability";
		obj.value = d.odbdata[year]["Datasets_Accountability"] / 100;
		data.push(obj);
		var obj = {};
		obj.axis = "Readiness: Enterpreneurs & Business";
		obj.value = d.odbdata[year]["Readiness_Entrepreneurs-Scaled"] / 100;
		data.push(obj);
		var obj = {};
		obj.axis = "Readiness: Citizens & Civil Society";
		obj.value = d.odbdata[year]["Readiness_Citizens-Scaled"] / 100;
		data.push(obj);
		top.push(data);
		RadarChart.draw("#radar", top);	
	}
}

function changeYear() {
	year = document.getElementById("year").value;
	drawStats(current);
}
