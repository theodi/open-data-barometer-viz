var Datasets = {
  draw: function(id, datasets, year, redraw){
	var dataset = [];
	var outline = [];
	var labels = [];
	for (i=0;i<datasets.length;i++) {
		item = datasets[i];
		dataset.push(item["CalculatedScore"]);
		outline.push(parseInt(item["isOpen"]));
		temp = item["Dataset"].split("-",2);
		temp[1] = temp[1].trim();
		labels.push(temp[1]);
	}	

	var w = 780;
	var h = 60;
	if (redraw) {
		d3.select(id).select("svg").remove();
	}
	
	var elem = d3.select(id)
			.append("svg")
			.attr("width", w)
			.attr("height", h)
	
	var groups = elem.selectAll("g")
	    .data(dataset)
	    .enter()
	    .append("g");

	var fillColor = "#1f77bf";
	if (year == 2014) {
		fillColor = "#9467bd";
	}

	if (redraw) {
		hr = 30;
	} else {
		hr = 30;
	}
	var circles = groups.append("circle") 
		.attr("cx", function(d, i) {
          	      return (i * 50) + 30;
	        })
		.attr("cy", h - hr)
		.transition(10000)
		.attr("fill", fillColor)
		.attr("stroke", "black")
		.attr("stroke-width", function(d, i) {
			if (outline[i]>0) {
				return 2
			} else {
				return 0
			}
		})
		.attr("r", function(d) {
			return d/4;
		});
	if (redraw) {
		if (redraw) {
			d3.select("#dataset-labels").select("svg").remove();
		}
		h = 130;
		var elem = d3.select("#dataset-labels")
			.append("svg")
			.attr("width", w)
			.attr("height", h)
	
		var groups = elem.selectAll("g")
		    .data(dataset)
		    .enter()
		    .append("g");

		var label = groups.append("text") 
	           .text(function(d,i){
			return labels[i];
		   })
		   .attr("font-size", "10px")
		   .attr("fill", "#fff")
		   .attr("transform", function(d,i) {
			x = i * 50 + 40;
			y = h - 60;
			return "translate(" + x + "," + y + ")rotate(-65)";
		   });
	}
     }
};
