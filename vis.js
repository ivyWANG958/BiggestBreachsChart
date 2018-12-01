var margin = {
    top: 20,
    right: 40,
    bottom: 20,
    left: 50
},
    width = 1100 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

var xScale = d3.scaleBand()
    .rangeRound([0, width - 150])
    .padding(0.1)
    .align(0.1);

var yScale = d3.scaleLinear()
    .rangeRound([height, 0]);

var z = d3.scaleOrdinal()
    .range([ "#FFD038",  "#E85134","#AC42FF", "#4BB8E8", "#91FF90"]);

var stack = d3.stack() // The stack layout operates in an arbitrary two-dimensional x and y coordinate space

var format = d3.format(",d")

var organizationData = [];
var methodData = [];
var columns = [];
var methodSelected = "Show all";

function update(data, attrX, selected) {

    d3.select("#chart").html("")
    d3.select("#chart").selectAll("*").remove(); // remove the duplicated chart

    var svgChart = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var xAxis = svgChart.append("g")
        .attr("class", "x label");

    var yAxis = svgChart.append("g")
        .attr("class", "y label");


    xScale.domain(data.map(function (d) { return d[attrX] }));
    yScale.domain([0, d3.max(data, function (d) {
        return d.total;
    })]);

    // do not understand
    var stackedData = stack
        .keys(data.columns.filter(function (d) {
            return selected === undefined ?
                true :
                selected.indexOf(d) != -1 ?
                    true :
                    false;
        }))
        .value(function (d, key) {
            return selected === undefined ?
                d[key] :
                selected.indexOf(key) != -1 ?
                    d[key] :
                    0;
        })(data);

    var bars = svgChart.selectAll(".serie")
        .data(stackedData, function (d) { return d.key; });

    var barsEnter = bars
        .enter()
        .append("g");

    bars.merge(barsEnter)
        .attr("class", "serie")
        .attr("fill", function (d) { return z(d.key); })
        .selectAll(".rect").data(function (d) { return d; }).enter().append("rect")
        .attr("x", function (d) { return xScale(d.data.year); })
        .attr("y", height)
        .attr("width", xScale.bandwidth())
        .attr("height", 0)
        .transition()
        .duration(1000)
        .attr("height", function (d) { return yScale(d[0]) - yScale(d[1]); })
        .attr("y", function (d) { return yScale(d[1]); });

    //Exit
    bars.exit().remove();


    xAxis
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale))

    yAxis
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(yScale).ticks(10, "s"));

    yAxis.append("text")
        .attr("x", 90)
        .attr("y", -8)
        .attr("fill", "#000")
        .style("font-size", "11px")
        .text("Records stolen in millions");

    var legend = svgChart.selectAll(".legend")
        .data(data.columns.reverse())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function (d, i) {
            return "translate(0," + i * 20 + ")";
        })

    svgChart.append("text")
        .attr("x", width - 133)
        .attr("y", -5)
        .style("font-size", "13px")
        .text("Select a method of leak:");

    legend.append("rect")
        .attr("x", width - 80)
        .attr("width", 18)
        .attr("height", 18)
        .on("click", function (d) {
            if (d === "Show all") {
                update(data, "year");
                methodSelected = "Show all";
            } else {
                update(data, "year", [d]);
                methodSelected = d;
            }
        })
        .attr("fill", function (d) {
            if (d === "Show all") {
                return "white";
            } else return z(d);
        });

    legend.append("text")
        .attr("x", function (d) {
            if (d === "Show all") return width - 80
            else return width - 60;
        })
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("font-size", function (d, i) {
            if (d === "Show all") {
                return "15px";
            } else return "10px";
        })
        .on("click", function (d) {
            if (d === "Show all") {
                update(data, "year");
                methodSelected = "Show all";
            } else {
                update(date, "year", [d]);
                methodSelected = d;
            }
        })
        .text(function (d) { return d; });

}

d3.csv("data.csv", function (err, data) {
    if (err) {
        console.err(err);
        alert(err);
        return
    }

    data.forEach(function (d, i) {
        var organization = {}
        organization["id"] = i;
        organization["Entity"] = d["Entity"];
        organization["Alternative Name"] = d["alternative name"];
        organization["story"] = d["story"];
        organization["year"] = + d["YEAR"];
        organization["year"] = + (2004 + organization["year"]);
        organization["organization"] = d["ORGANISATION"];
        organization["Method of Leak"] = (d["METHOD OF LEAK"]).trim(); //remove leading and trailing white space
        organization["interesting"] = d["interesting story"];
        organization["Records Stolen"] = +d["NO OF RECORDS STOLEN"];
        organization["Records Stolen"] = (organization["Records Stolen"]);
        organization["Data Sensitivity"] = +d["DATA SENSITIVITY"];
        organization["exclude"] = d["Exclude"];
        organization["sourceLink1"] = d["1st source link"];
        organization["sourceLink2"] = d["1nd source link"];
        organization["sourceLink3"] = d["3rd source"];
        organization["Source Name"] = d["source name"];
        organizationData.push(organization);

        var control = false;

        for (var i = columns.length - 1; i >= 0; i--) {
            if (columns[i] === organization["Method of Leak"]) {
                control = true;
            }
        };
        if (!control) {
            columns.push(organization["Method of Leak"]);
        }

    });

    columns.push("Show all");

    for (var i = 0; i < 15; i++) {
        var method = {};
        method.id = i;
        method.year = (2004 + i);
        for (var j = columns.length - 1; j >= 0; j--) {
            method[columns[j]] = 0;
        };
        method.total = 0;
        methodData.push(method);
    }

    for (var i = organizationData.length - 1; i >= 0; i--) {
        for (var j = 0; j < methodData.length; j++) {
            if (methodData[j].year === organizationData[i].year) {
                if (!isNaN(organizationData[i]["Records Stolen"])) {
                    methodData[j][organizationData[i]["Method of Leak"]] += organizationData[i]["Records Stolen"];
                    methodData[j].total += organizationData[i]["Records Stolen"];
                }
            }
        };
    };

    methodData.columns = columns;
    z.domain(data.columns);
    update(methodData, "year");
    // updateEntities(organizationData.filter(function (d) { return d.year === 2010; }));
    // updateDetail(objectToArray(organizationData.filter(function (d) { return d.year === 2010; })[0]));

});


