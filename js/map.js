// The SVG container
var width  = 850,
    height = 400;

var year = 2014;
var prevyear;
var current;
var countries;
var centered;
var stories; 
var storyPanelHidden = true;
var print = false;
var clusters = {};
clusters["One sided initiative"] = true;
clusters["High capacity"] = false;
clusters["Capacity constrained"] = true;
clusters["Emerging and advancing"] = true;

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

$.ajaxSetup ({
    // Disable caching of AJAX responses
    cache: false
});

odb_table();

$(document).keypress(function(e) {
	if (e.which == 109) {
		mop = $("#map").css('opacity');
		if (mop > 0) {
			mop = $("#map").css('opacity',0);
		} else {
			mop = $("#map").css('opacity',1);
		}
	}
	if (e.which == 116) {
		rop = $("#rankings").css('opacity');
		if (rop > 0) {
			switchView("map");
		} else {
			switchView("table");
		}
	}
	if (e.which == 112 && print) {
		print = false;
		$("body").css('background-color','#404040');
		$("body").css('color','#eee');
		$("#rankings").css('background','#404040');
		$(".fixedHeader").css('background','#404040');
		$("#rankings").css('color','#eee');
		$("#rankings").css('border','1px solid white');
		$("#credit > a").css('color','#eee');
		$(".logoimg").attr("src","img/ODB_white.png");
		$("#githubimg").attr("src","img/github-128_white.png");
		$("#helpimg").attr("src","img/help_white.png");
	} else if (e.which == 112 && !print) {
		print = true;
		$("body").css('background-color','white');
		$("body").css('color','#111');
		$("#rankings").css('background','white');
		$(".fixedHeader").css('background','white');
		$("#rankings").css('color','#111');
		$("#rankings").css('border','1px solid black');
		$("#credit > a").css('color','#111');
		$(".logoimg").attr("src","img/ODB_black.png");
		$("#githubimg").attr("src","img/github-128_black.png");
		$("#helpimg").attr("src","img/help_black.png");
	}
	if (e.which == 112) {
		if (current) {
			drawStats(current,false);
		} else {
			drawStats(null,false);
		}
	}
});

var g = svg.selectAll("g");

function redraw() {
    svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

function switchView(id) {
	id = id.replace("View","");
	if (id == "table") {
		rop = $("#rankings").css('opacity',1);
		rop = $("#rankings").css('z-index',30);
		$("#tableLab").css("background","#eee");
		$("#tableLab").css("color","#404040");
		$("#mapLab").css("background","#404040");
		$("#mapLab").css("color","#eee");
	} else {
		rop = $("#rankings").css('opacity',0);
		rop = $("#rankings").css('z-index',-100);
		$("#mapLab").css("background","#eee");
		$("#mapLab").css("color","#404040");
		$("#tableLab").css("background","#404040");
		$("#tableLab").css("color","#eee");
	}
}

function updateClusters(id,checked) {
	id = id.replace("clusters_","");
	id = id.replace(/_/g," ");
	if (id == "all" && checked) {
		for (cluster in clusters) {
			clusters[cluster] = true;
			out_id = "clusters_" + cluster.replace(/ /g,"_");
			$("#"+out_id).prop('checked',true);
			
		}
	} else {
		clusters[id] = checked;
		if (!checked) {
			$("#clusters_all").prop('checked',false);
		}
	}
	all = true;
	for (cluster in clusters) {
		if(!clusters[cluster]) {
			all = false;
		}
	}
	if (all) {
		$("#clusters_all").prop('checked',true);
	}
	if (current) {
		drawStats(current,true);
	} else {
		drawStats(null,true);
	}
}

function updateScore(oldScore,newScore) {
	oldScore = parseInt(oldScore);
	if (oldScore < newScore) {
		oldScore = oldScore + 1;
	} else if (oldScore > newScore) {
		oldScore = oldScore - 1;
	}
	document.getElementById("score").innerHTML = oldScore;
	if (oldScore != newScore) {
		setTimeout(function() { updateScore(oldScore,newScore)}, 50);
	}
}

var tooltip = d3.select("#map").append("div")
    .attr("class", "tooltip");

queue()
    .defer(d3.json, "data/world-50m.json")
    .defer(d3.tsv, "data/world-country-names.tsv")
    .defer(d3.json, "data/cities.json")
    .defer(d3.csv, "data/ODB-2013-Rankings.csv")
    .defer(d3.csv, "data/ODB-2013-Datasets-Scored.csv")
    .defer(d3.csv, "data/ODB-2014-Rankings.csv")
    .defer(d3.csv, "data/ODB-2014-Datasets-Scored.csv")
    .defer(d3.csv, "data/countries_income.csv")
    .await(ready);

function getColor(d,i){
	if (!clusters[d.cluster]) {
		return d3.rgb(255,255,255);
	}
	var overlayHueMin = 238,
	overlayHueMax = 240,
	overlaySatMin = 1,
	overlaySatMax = 1,
	overlayValMin = 0.95,
	overlayValMax = 0.8;
	if (year == 2014) {	
		var overlayHueMin = 269,
		overlayHueMax = 271,
		overlaySatMin = 0.39,
		overlaySatMax = 0.39,
		overlayValMin = 0.82,
		overlayValMax = 0.57;
	}
	
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

function ready(error, world, names, points, odbdata2013, datasetScores2013, odbdata2014, datasetScores2014, income) {
  countries = topojson.object(world, world.objects.countries).geometries,
      neighbors = topojson.neighbors(world, countries),
      i = -1,
      n = countries.length;
    
  countries.forEach(function(d) {
    d.odbdata = {};
    d.datasets = {};
    d.cluster = "";
    var tryit = names.filter(function(n) { return d.id == n.id; })[0];
    if (typeof tryit === "undefined"){
//      console.log("Failed in match 1: " + d);
    } else {
      d.name = tryit.name; 
      d.ISO2 = tryit.ISO2
    }
    d.odbdata = {};
    d.datasets = {};
    var tryit2 = odbdata2013.filter(function(n) { return d.ISO2 == n.ISO2;  })[0];
    if (typeof tryit2 === "undefined"){
//	console.log("Failed in match 2: " + d.name);
    } else {
    	d.odbdata["2013"] = tryit2;
    }
    var tryit3 = datasetScores2013.filter(function(n) { return d.ISO2 == n.ISO2; });
    if (typeof tryit3 === "undefined"){
//	console.log("Failed in match 3: " + d.name);
    } else {
	d.datasets["2013"] = tryit3;
    } 
    var tryit2 = odbdata2014.filter(function(n) { return d.ISO2 == n.ISO2; })[0];
    if (typeof tryit2 === "undefined"){
//	console.log("Failed in match 4: " + d.name);
    } else {
    	d.odbdata["2014"] = tryit2;
	d.cluster = d.odbdata["2014"].Cluster;
    }
    var tryit3 = datasetScores2014.filter(function(n) { return d.ISO2 == n.ISO2; });
    if (typeof tryit3 === "undefined"){
//	console.log("Failed in match 5: " + d.name);
    } else {
	d.datasets["2014"] = tryit3;
    } 
    var tryit4 = income.filter(function(n) { return d.name == n.Country; })[0];
    if (typeof tryit4 === "undefined"){
//	console.log("Failed in match 6: " + d.name);
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
	drawStats(d,false);
	current = d;
	zoomTo(d);
      })
      .on("mouseout",  function(d,i) {
        tooltip.classed("hidden", true)
      });
};

function zoomCountry(countryName) {
  
  countries.forEach(function(d) {
	if (d.name == countryName) {
		drawStats(d,false);
		current = d;
		zoomTo(d);
	}
  });	
}

function selectCountry(countryName) {
  countries.forEach(function(d) {
	if (d.name == countryName) {
		drawStats(d,false);
		current = d;
	}
  });	
}

function zoomTo(d) {
	
	var x, y, k;

	if (d && centered !== d) {
		var centroid = path.centroid(d);
		x = centroid[0];
		y = centroid[1];
		if (path.area(d) > 2000) {
			k = 2;
		} else if (path.area(d) > 1000) {
			k = 4;
		} else if (path.area(d) > 750) {
			k = 8;
		} else if (path.area(d) > 500) {
			k = 8;
		} else if (path.area(d) > 250) {
			k = 10;
		} else if (path.area(d) < 250) {
			k = 12;
		}
		centered = d;
	} else {
		x = width / 2;
		y = height / 2;
		k = 1;
		centered = null;
	}

	svg.selectAll("path")
		.classed("active", centered && function(d) { return d === centered; });

	svg.transition()
		.duration(750)
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
		.style("stroke-width", 1.5 / k + "px");
}

function drawStats(d,changedYear) {
  var country = svg.selectAll(".country").data(countries);
  country
   .style("fill", function(d, i) { return getColor(d); });
	var oldScore;
	if (current) {
		if (current.name == d.name) {
			oldScore = document.getElementById("score").innerHTML;
		}
	}
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
	document.getElementById("arrow").innerHTML = "";
	document.getElementById("movement").innerHTML = "";
	document.getElementById("odb-score").innerHTML = "---";
	document.getElementById("odb-score-change").innerHTML = "";
	$("#movement").hide();
	$("#arrow").hide();
	
	if (!changedYear || print) {
		document.getElementById("datasetsinner").innerHTML = '<nav id="datasets-nav-horizontal" onClick="hideDatasetsHistory();"><span id="nav-inner-horizontal">......</span></nav>';
		redraw = true;
		for (y in d.datasets) {
			Datasets.draw("#datasetsinner",d.datasets[y],y,redraw,print);
			redraw = false;
		}
	}
	if (year != 2013) {
		$("#datasets-nav-vertical").fadeTo("fast",1);
	}

	if (d.odbdata[year]) {
		newScore = d.odbdata[year]["ODB-Rank"];
		if (oldScore > 0 && prevyear < year) {
			updateScore(oldScore,newScore);
		} else {
			document.getElementById("score").innerHTML = d.odbdata[year]["ODB-Rank"];
		}
		document.getElementById("odb-score").innerHTML = parseFloat(d.odbdata[year]["ODB-Scaled"]).toFixed(2);
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
			odbscorechange = d.odbdata[year]["ODB-Scaled"] - d.odbdata[year-1]["ODB-Scaled"];
			odbscorechange = parseFloat(odbscorechange.toFixed(2));
			if (odbscorechange > 0) {
				document.getElementById("odb-score-change").innerHTML = "+" + odbscorechange;
				document.getElementById("odb-score-change").style.color = "green";
				document.getElementById("odb-score-change").style.left = "160px";
				if (d.odbdata[year]["ODB-Score"] < 0) {
					document.getElementById("odb-score-change").style.left = "166px";
				}
			}
			if (odbscorechange < 0) {
				document.getElementById("odb-score-change").innerHTML = odbscorechange;
				document.getElementById("odb-score-change").style.color = "red";
				document.getElementById("odb-score-change").style.left = "172px";
				if (d.odbdata[year]["ODB-Score"] < 0) {
					document.getElementById("odb-score-change").style.left = "178px";
				}
			}
			$("#odb-score-change").fadeIn();
			$("#movement").fadeIn();
			$("#arrow").fadeIn();
		}
		var top = [];
		if (d.odbdata[year-1] && year>2013) {
			startYear = year - 1;	
		} else {
			startYear = year;
		}
		for (i=(year-1);i<=year;i++) {
			if (d.odbdata[i]) {
			var data = [];
			var obj = {};
			obj.axis = "Readiness: Government";
			obj.value = d.odbdata[i]["Readiness_Government-Scaled"] / 100;
			data.push(obj);
			var obj = {};
			obj.axis = "Impacts: Economic";
			obj.value = d.odbdata[i]["Impact_Economic-Scaled"] / 100;
			data.push(obj);
			var obj = {};
			obj.axis = "Impacts: Social";
			obj.value = d.odbdata[i]["Impact_Social-Scaled"] / 100;
			data.push(obj);
			var obj = {};
			obj.axis = "Impacts: Political";
			obj.value = d.odbdata[i]["Impact_Political-Scaled"] / 100;
			data.push(obj);
			var obj = {};
			obj.axis = "Datasets: Innovation";
			obj.value = d.odbdata[i]["Datasets_Innovation"] / 100;
			data.push(obj);
			var obj = {};
			obj.axis = "Datasets: Social Policy";
			obj.value = d.odbdata[i]["Datasets_Social_Policy"] / 100;
			data.push(obj);
			var obj = {};
			obj.axis = "Datasets: Accountability";
			obj.value = d.odbdata[i]["Datasets_Accountability"] / 100;
			data.push(obj);
			var obj = {};
			obj.axis = "Readiness: Enterpreneurs & Business";
			obj.value = d.odbdata[i]["Readiness_Entrepreneurs-Scaled"] / 100;
			data.push(obj);
			var obj = {};
			obj.axis = "Readiness: Citizens & Civil Society";
			obj.value = d.odbdata[i]["Readiness_Citizens-Scaled"] / 100;
			data.push(obj);
			top.push(data);
			}
		}
		RadarChart.draw("#radar", top, startYear, print);	
	}
}

function switchYear(year) {
	document.getElementById("year").value = year;
	if (year == 2013) {
		document.getElementById("outof").innerHTML = "/77";
		$("#datasetsinner").animate({top:0},2000);
		$("#datasets-nav-vertical").fadeTo("fast",0);
	} else if (year == 2014) {
		document.getElementById("outof").innerHTML = "/86";
		$("#datasetsinner").animate({top:-65},2000);
		$("#datasets-nav-vertical").fadeTo("fast",1);
	}
	changeYear();
}

function changeYear() {
	prevyear = year;
	year = document.getElementById("year").value;
	if (year == 2013) {
		document.getElementById("outof").innerHTML = "/77";
		$("#datasetsinner").animate({top:0},2000);
		$("#datasets-nav-vertical").fadeTo("fast",0);
	} else if (year == 2014) {
		document.getElementById("outof").innerHTML = "/86";
		$("#datasetsinner").animate({top:-65},2000);
		$("#datasets-nav-vertical").fadeTo("fast",1);
	}
	populateStoryBar(year);
	if (current) {
		drawStats(current,true);
	} else {
		drawStats(null,true);
	}
}

function showDatasetsHistory() {
	$("#datasets-nav-horizontal").fadeTo("fast",1);
	$("#datasets-nav-vertical").fadeOut();
	$("#map").fadeTo(2000,0.2);
	if (year == 2014) {
		$("#datasetsinner").animate({top:0},2000);
	} 
	if (year == 2013) {
		$("#datasetsinner").animate({top:0},2000);
	}
	$("#datasets-div").animate({top:360},2000);
	ch = $("#datasets").height();
	setTimeout(function(){changeHeight(ch,"datasets","up",131)},28);
}

function hideDatasetsHistory() {
	$("#datasets-nav-horizontal").fadeTo("fast",0);
	$("#datasets-nav-vertical").fadeIn();
	$("#map").fadeTo(2000,1);
	if (year == 2014) {
		$("#datasetsinner").animate({top:-65},2000);
	} 
	if (year == 2013) {
		$("#datasetsinner").animate({top:0},2000);
	}
	$("#datasets-div").animate({top:420},2000);
	ch = $("#datasets").height();
	setTimeout(function(){changeHeight(ch,"datasets","down",60)},28);
}

function changeHeight(ch,element,direction,limit) {
	if (direction == "up") {
		nh = ch + 1;
	} else {
		nh = ch - 1;
	}
	$("#" + element).height(nh);
	if (direction == "up" && nh < limit) {
		setTimeout(function(){changeHeight(nh,element,direction,limit)},28);
	}
	if (direction == "down" && nh > limit) {
                setTimeout(function(){changeHeight(nh,element,direction,limit)},28);
        }
}

function storyByCountryName(countryName,year) {
	var zoom = true;
	if (current) {
		if (current.name == countryName) {
			zoom=false;
		}
	}
	if (zoom) {
		zoomCountry(countryName);
	} else {
		selectCountry(countryName);
	}
	switchYear(year);
}

function resetMap(year) {
	switchYear(year);
	zoomTo(current);
}

function toggleStoryBar() {
	if (storyPanelHidden) {
		$("#player").animate({top: 415},2000);
		document.getElementById("player-up-down").innerHTML = "&dArr; Hide story bar &dArr;";
		storyPanelHidden = false;
		
	} else {
		$("#player").animate({top: 535},2000);
		document.getElementById("player-up-down").innerHTML = "&uArr; Show story bar &uArr;";
		storyPanelHidden = true;
	}
}

function hideStoryBar() {
	storyPanelHidden = false;
	toggleStoryBar();
}

function showStoryBar() {
	storyPanelHidden = true;
	toggleStoryBar();
}

function emptyStoryBar() {
	document.getElementById("player-div").innerHTML = "No stories available for selected year.";
}

function populateStoryBar(year) {
	emptyStoryBar();
	$.getJSON("js/stories.json", function(data) {
		stories = data;
		toProcess = stories[year];
		if (toProcess) {
			document.getElementById("player-div").innerHTML = "";
		}
		for(i=0;i<toProcess.length;i++) {
			story = toProcess[i];
			drawStoryBarElement(story,year);
		}
	})
	.error(function(jqXHR, textStatus, errorThrown) {
	        console.log("error " + textStatus);
        	console.log("incoming Text " + jqXHR.responseText);
	});
}

function drawStoryBarElement(story,year) {
	var storyBar = document.getElementById("player-div");
	var thing = '<nav id="storyElement" onclick=\'tellStory("'+story.country+'",'+year+');\'><b>'+story.country+'</b><br/><img id="story_flag" src="img/flags/'+story.country+'.png"></img><br/>'+story.headline+'</nav>';
	storyBar.innerHTML = storyBar.innerHTML + thing;
}

function positionBox(box) {
	var dom = document.getElementById("story_block");
	dom.style.top = box.y;
	dom.style.left = box.x;
	dom.style.width = box.w;
	dom.style.height = box.h;
//	dom.style.font-size = box.f;
	$("#storyPart1").html("");
	$("#storyPart2").html("");
}

function setStoryBoxText(text,part) {
	var dom = document.getElementById("story_block");
	$("#storyPart" + part).hide( function() {
		$("#storyPart" + part).html(text);
		$("#storyPart" + part).fadeIn("slow");
	});
}

function progressBarSimple() {
	var dom = document.getElementById("player-up-down");
	dom.innerHTML = '<div id="mprogressBar" style="background: rgb(32,32,32); height: 20px; margin-top: 2px; width: 1px;"></div>';
	timeout = setInterval(function() {mUpdateProgress();},88);
	setTimeout(function() {clearTimeout(timeout);},14900);
}

function mUpdateProgress() {
	mupwidth = $("#mprogressBar").width();
	mupwidth = mupwidth + 1;
	$("#mprogressBar").width(mupwidth);
}

function tellStory(country,year) {
	toProcess = stories[year];
	var local_story;
	for(i=0;i<toProcess.length;i++) {
		if (toProcess[i].country == country) {
			local_story = toProcess[i];
		}
	}
	positionBox(story.box);
	hideStoryBar();
	progressBarSimple();
	setTimeout(function() {storyByCountryName(local_story.country,year-1);},1000);
	setTimeout(function() {$("#story_block").hide( function() { 
				   $("#story_block").fadeIn('slow');
			         });
			      },1500);
	setTimeout(function() {setStoryBoxText(local_story.part1,1);},2500);
	setTimeout(function() {storyByCountryName(local_story.country,year);},7000);
	setTimeout(function() {setStoryBoxText(local_story.part2,2);},8000);
	setTimeout(function() {$("#story_block").fadeOut("slow");},14000);
	setTimeout(function() {resetMap(year);},15000);
	setTimeout(function() {showStoryBar();},15000);
}
