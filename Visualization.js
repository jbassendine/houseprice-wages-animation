
var HPViz_constants = {
  mapWidth: 700,
  mapHeight: 950,
  legendBoxHeight: 200,
  legendBoxWidth: 250,
  legendHeight: 10,
  legendWidth: 200,
  legendX: 700 - 320,
  legendY: 20,
  chartWidth: 630,
  chartHeight: 330,
  stepTiming: 450,
  startYear: 1999,
  endYear: 2015,
  colourScaleSkeleton: [
    {"offset": 0, "colour": 'yellow'},
    {"offset": 0.5, "colour": 'red'},
    {"offset": 1, "colour": 'purple'}
  ],
};

HPViz_constants.mapHeight           = window.screen.height - 150;
HPViz_constants.mapWidth            = HPViz_constants.mapHeight * 0.72;


HPViz_constants.legendBoxWidth         = HPViz_constants.mapWidth * 0.34;
HPViz_constants.legendBoxMargin        = HPViz_constants.mapWidth * 0.05;
HPViz_constants.legendBoxX             = HPViz_constants.mapWidth - HPViz_constants.legendBoxMargin - HPViz_constants.legendBoxWidth;
HPViz_constants.legendBoxY             = HPViz_constants.mapHeight * 0.06;
HPViz_constants.legendFontSize         = HPViz_constants.legendBoxWidth * 0.13;
HPViz_constants.legendWidth            = HPViz_constants.legendBoxWidth * 0.8;
HPViz_constants.legendX                = HPViz_constants.legendBoxWidth * 0.1;

HPViz_constants.chartBoxHeight      = (HPViz_constants.mapHeight / 2) - 50;
HPViz_constants.chartBoxWidth       = HPViz_constants.chartBoxHeight * 1.3;

HPViz_constants.chartWidth          = HPViz_constants.chartBoxWidth * 0.8;
HPViz_constants.chartMargin         = {
  "left": HPViz_constants.chartBoxWidth * 0.15,
  "top": 10
};

HPViz_constants.chartHeadingHeight  = HPViz_constants.chartBoxHeight * 0.15;
HPViz_constants.chartHeight         = HPViz_constants.chartBoxHeight * 0.6;
HPViz_constants.chartTextHeight     = HPViz_constants.chartBoxHeight * 0.25;

HPViz_constants.chartHeadingY       = HPViz_constants.chartBoxHeight * 0;
HPViz_constants.chartSheetY         = HPViz_constants.chartBoxHeight * 0.15;
HPViz_constants.chartTextY          = HPViz_constants.chartBoxHeight * 0.75;

//Calculated constants. Calculated once for each client, depend on other constants or client parameters like device screen heights etc.
HPViz_constants.elementTotalNumber  = HPViz_constants.endYear - HPViz_constants.startYear + 1;
HPViz_constants.elementWidth        = (HPViz_constants.chartWidth)/(HPViz_constants.elementTotalNumber);

var HPViz_context = {
  svg: {},
  path: {},
  currentlySelected: {},
  ratioScale: {},
  projection: {},
  nationalLineFct: {},
  LADLineFct: {},
  dataset: [],
  nationalData: {},
  LADData: {},
  currentYear: HPViz_constants.startYear,
  timer: 0
};

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

function wrap(text, width, dy) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em").text(word);
      }
    }
  });
}

var initialize = function() {
  setupMap();
  loadData();

  if ("geolocation" in navigator) {
    var LADElement = returnSVGFromPoint(51.2714753, 0.1948512);
    navigator.geolocation.getCurrentPosition(function(position) {
      //var LADElement = returnSVGFromPoint(position.coords.latitude, position.coords.longitude);
      var LADElement = returnSVGFromPoint(51.2714753, 0.1948512);
      updateLADChart(LADElement);
    });
  }
};

var setupMap = function() {

  HPViz_context.projection = d3.geo.mercator()   // define our projection with parameters
    //.precision()
    .scale(3.6 * HPViz_constants.mapHeight)
    .translate([HPViz_constants.mapWidth/2, HPViz_constants.mapHeight/2])
    .rotate(90)
    .center([-2.217, 54.817]);

  HPViz_context.path = d3.geo.path().projection(HPViz_context.projection);

  HPViz_context.svg = d3.select('.map-div')
        .append('svg')
        .attr('height', HPViz_constants.mapHeight)
        .attr('width', HPViz_constants.mapWidth)
        .append('g');
};

var setupNationalChart = function() {
  //TODO: Chart height to client screen height
  var nationalBoxSVG = d3.select('.national-chart-div').append('svg')
    .attr('class', 'national-chart-box-svg')
    .attr("width", HPViz_constants.chartBoxWidth)
    .attr("height", HPViz_constants.chartBoxHeight);
  var nationalHeadingSVG = nationalBoxSVG.append('g')
    .attr('class', 'national-heading-group')
    .attr("transform", "translate(" + 0 + "," + HPViz_constants.chartHeadingY + ")")
    .attr("width", HPViz_constants.chartWidth)
    .attr("height", HPViz_constants.chartHeadingHeight);
  nationalHeadingSVG.append('text')
    .attr('class', 'national-heading-text')
    .attr("transform", "translate(" + 0 + "," + HPViz_constants.chartHeadingY + ")")
    .attr("dominant-baseline", "text-before-edge")
    .attr("font-size", (HPViz_constants.chartHeadingHeight - 15))
    .attr("width", HPViz_constants.chartWidth)
    .attr("height", HPViz_constants.chartHeadingHeight);
  var nationalSheetSVG = nationalBoxSVG.append('g')
    .attr('class', 'national-chart-sheet-group')
    .attr("transform", "translate(" + HPViz_constants.chartMargin.left + "," + HPViz_constants.chartSheetY + ")")
    .attr("width", HPViz_constants.chartWidth)
    .attr("height", HPViz_constants.chartHeight);
  var nationalTextSVG = nationalBoxSVG.append('svg')
    .attr('class', 'national-text-svg')
    .attr("transform", "translate(" + 0 + "," + HPViz_constants.chartTextY + ")")
    .attr("width", HPViz_constants.chartWidth)
    .attr("height", HPViz_constants.chartTextHeight);
  setupXAxisAndReturnScale(nationalSheetSVG, 'national-chart-xaxis');
  setupYAxisAndReturnScale(nationalSheetSVG, 'national-chart-yaxis');
  // var axisCoords = document.querySelector('.national-chart-yaxis .domain').getBoundingClientRect();
  // var svgCoords = document.querySelector('.national-chart-svg').getBoundingClientRect();
  // var chartOrigin = {
  //   "top": (axisCoords.top - svgCoords.top),
  //   "left": (axisCoords.right - svgCoords.left)
  // };
  var chartGroup = nationalSheetSVG.append("g")
    .attr("class", "national-chart-group");
    //.attr("transform", "translate(" + (chartOrigin.left) + "," + chartOrigin.top + ")");
  chartGroup.append("g")
    .attr("class", "national-chart-rects");
    //.attr("transform", "translate(" + (0) + "," + 0 + ")");
  chartGroup.append("path")
   .attr("class", "national-chart-path")
   .attr("transform", "translate(" + (HPViz_constants.elementWidth / 2) + "," + 0 + ")");
};

var updateNationalChart = function (ID) {
  switch (ID.slice(0,1)) {
    case('E'):
      ID = 'E92000001';
      break;
    case('W'):
      ID = 'W92000004';
      break;
    case('S'):
      ID = 'S92000003';
      break;
  }

  retrieveChartDataById(ID, function(nationalDataRaw) {
    HPViz_context.nationalData = nationalDataRaw;

    document.getElementsByClassName('national-heading-text')[0].innerHTML = nationalDataRaw.LADname;

    // //Reformat for chart
    // nationalData = reformatChartDataForLineFct(nationalDataRaw);

    //Find max
    var max = 0;
    max = d3.max(HPViz_context.nationalData.yearlyData, function(d) {
      if (!isNaN(d.ratio)) return Number(d.ratio);
    });

    var nationalSVG = d3.select('.national-chart-svg');
    var nationalXScale = setupXAxisAndReturnScale(nationalSVG, 'national-chart-xaxis');
    var nationalYScale = setupYAxisAndReturnScale(nationalSVG, 'national-chart-yaxis', max);

    //Update line function
    HPViz_context.nationalLineFct = d3.svg.line()
      .x(function(d) {return nationalXScale(d.year);})
      .y(function(d) {return nationalYScale(d.ratio);});

    if (!HPViz_context.timer) {
      animationStep();
    }
  });
};

var setupLADChart = function() {
  var LADBoxSVG = d3.select('.lad-chart-div').append('svg')
    .attr('class', 'lad-chart-box-svg')
    .attr("width", HPViz_constants.chartBoxWidth)
    .attr("height", HPViz_constants.chartBoxHeight);
  var LADHeadingSVG = LADBoxSVG.append('g')
    .attr('class', 'lad-heading-group')
    .attr("transform", "translate(" + 0 + "," + HPViz_constants.chartHeadingY + ")")
    .attr("width", HPViz_constants.chartWidth)
    .attr("height", HPViz_constants.chartHeadingHeight);
  LADHeadingSVG.append('text')
    .attr('class', 'lad-heading-text')
    .attr("transform", "translate(" + 0 + "," + HPViz_constants.chartHeadingY + ")")
    .attr("dominant-baseline", "text-before-edge")
    .attr("font-size", (HPViz_constants.chartHeadingHeight - 15))
    .attr("width", HPViz_constants.chartWidth)
    .attr("height", HPViz_constants.chartHeadingHeight);
  var LADSheetSVG = LADBoxSVG.append('g')
    .attr('class', 'lad-chart-sheet-group')
    .attr("transform", "translate(" + HPViz_constants.chartMargin.left + "," + HPViz_constants.chartSheetY + ")")
    .attr("width", HPViz_constants.chartWidth)
    .attr("height", HPViz_constants.chartHeight);
  var LADTextSVG = LADBoxSVG.append('svg')
    .attr('class', 'lad-text-svg')
    .attr("transform", "translate(" + 0 + "," + HPViz_constants.chartTextY + ")")
    .attr("width", HPViz_constants.chartWidth)
    .attr("height", HPViz_constants.chartTextHeight);
  setupXAxisAndReturnScale(LADSheetSVG, 'lad-chart-xaxis');
  setupYAxisAndReturnScale(LADSheetSVG, 'lad-chart-yaxis');
  // var axisCoords = document.querySelector('.lad-chart-yaxis .domain').getBoundingClientRect();
  // var svgCoords = document.querySelector('.lad-chart-sheet-group').getBoundingClientRect();
  // var chartOrigin = {
  //   "top": (axisCoords.top - svgCoords.top),
  //   "left": (axisCoords.right - svgCoords.left)
  // };
  var chartGroup = LADSheetSVG.append("g")
    .attr("class", "lad-chart-group");
    //.attr("transform", "translate(" + (chartOrigin.left) + "," + chartOrigin.top + ")");

  chartGroup.append("g")
    .attr("class", "lad-chart-rects");
    //.attr("transform", "translate(" + (- 1) + "," + 0 + ")");

  chartGroup.append("path")
    .attr("class", "lad-chart-path")
    .attr("transform", "translate(" + (HPViz_constants.elementWidth / 2) + "," + 0 + ")");
};

var updateLADChart = function(SVGTargetElement) {
  //Clear all rects
  d3.selectAll('.chart-rect').remove();
  //Highlight LAD
  if (Object.keys(HPViz_context.currentlySelected).length !== 0) {
    var unselectedClassList = HPViz_context.currentlySelected.getAttribute('class').replace(new RegExp('(\\s|^)' + "selected" + '(\\s|$)', 'g'), '$2');
    HPViz_context.currentlySelected.setAttribute('class', unselectedClassList);
  }
  HPViz_context.svg.selectAll('.localDistricts')
    .sort(function(a,b) {
      return (a.id == SVGTargetElement.id) - (b.id == SVGTargetElement.id);
    });
  document.getElementById(SVGTargetElement.id).setAttribute('class', SVGTargetElement.getAttribute('class') + ' selected');
  HPViz_context.currentlySelected = SVGTargetElement;

  //Find ID
  var LADElementID = SVGTargetElement.id;

  updateNationalChart(LADElementID);

  retrieveChartDataById(LADElementID, function(LADDataRaw) {
    document.getElementsByClassName('lad-heading-text')[0].innerHTML = LADDataRaw.LADname;
    HPViz_context.LADData = LADDataRaw;

    //Find max
    var max = 0;
    max = d3.max(HPViz_context.LADData.yearlyData, function(d) {
      return Number(d.ratio);
    });

    var LADSVG = d3.select('.lad-chart-sheet-group');
    var LADXScale = setupXAxisAndReturnScale(LADSVG, 'lad-chart-xaxis');
    var LADYScale = setupYAxisAndReturnScale(LADSVG, 'lad-chart-yaxis', max);

    //Update line function
    HPViz_context.LADLineFct = d3.svg.line()
                .x(function(d) {return LADXScale(d.year);})
                .y(function(d) {return LADYScale(d.ratio);});

    if (!HPViz_context.timer) {
      animationStep();
    }
  });
};

var setupXAxisAndReturnScale = function (LADSVG, inputClass) {
  var LADXScale = d3.scale.linear()
    .domain([HPViz_constants.startYear, HPViz_constants.endYear + 1])
    .range([0, HPViz_constants.chartWidth]);


  var LADXAxis = d3.svg.axis().scale(LADXScale)
    .tickValues(d3.range(HPViz_constants.startYear, HPViz_constants.endYear + 2, 1))
    .tickFormat(d3.format("d"));

  if (!document.getElementsByClassName(inputClass).length) {
    var LADXAxisGroup = LADSVG.append("g")
      .attr('class', inputClass)
      .attr("transform", "translate(" + 0 + "," + (HPViz_constants.chartHeight) + ")")
      .call(LADXAxis)
        .selectAll("text")
      .attr("y", 0)
      .attr("x", -50)
      .attr("dy", ".35em")
      .attr("transform", "rotate(-90)")
      .style("text-anchor", "start");
  }
  return LADXScale;
};

var setupYAxisAndReturnScale = function (SVG, inputClass, max) {
  if (!max) max = 7.25;
  var yScale = d3.scale.linear()
    .domain([0, max])
    .range([HPViz_constants.chartHeight, 0])
    .nice();

  var yAxis = d3.svg.axis().orient("left")
   .scale(yScale);

  if (!document.getElementsByClassName(inputClass).length) {
    var yAxisGroup = SVG.append("g")
      .attr('class', inputClass)
      //.attr("transform", "translate(" + (-6) + "," + 0 + ")")
      .call(yAxis);
  } else {
    d3.select(".lad-chart-yaxis").call(yAxis);
  }

  return yScale;
};

var loadData = function() {
  d3_queue.queue().defer(d3.csv, 'data/reconstructedratioprocessed.csv')
         .defer(d3.json, 'data/topo-lad-simplified.json')
         .await(function(error, houseData, localDistricts) {
           processMapData(houseData, localDistricts);
         });
};

var findMapDataById = function(ID) {
  var dataset = HPViz_context.dataset;
  var datasetLength = HPViz_context.dataset.length;
  for (var i = 0; i < datasetLength; i++) {
    var id = dataset[i].id;
    if (ID === dataset[i].id) {
      return dataset[i];
    }
  }
  var newIndex = dataset.push({"id": ID}) - 1;
  return dataset[newIndex];
};

var retrieveChartDataById = function(ID, callbackFunction) {
  d3_queue.queue()
   .defer(d3.json, 'data/LADs/' + ID + '.json')
   .await(function(error, LADdataRaw) {
     callbackFunction(LADdataRaw);
   });
};

var processMapData = function(houseData, localDistricts) {

  HPViz_context.dataset = topojson.feature(localDistricts, localDistricts.objects.lad1).features;

  var min = 2,
      max = 14,
      domainArray = [],
      rangeArray = [];

  houseData.forEach(function(HDcurrentValue) {
    var LDvalue = findMapDataById(HDcurrentValue.LADid);
    delete HDcurrentValue[""];
    LDvalue.pricingRatioData = HDcurrentValue;
  });

  HPViz_context.domainArray = HPViz_constants.colourScaleSkeleton.map(function(currentValue) {
    return (currentValue.offset * (max - min) + min);
  });

  HPViz_context.rangeArray = HPViz_constants.colourScaleSkeleton.map(function(currentValue) {
    return currentValue.colour;
  });

  HPViz_context.ratioScale = d3.scale.linear()
                    .domain(HPViz_context.domainArray)
                    .range(HPViz_context.rangeArray);

  bindAndDrawMap();
  setupNationalChart();
  setupLADChart();
};

var isPointInPoly = function (poly, pt) {
  //+ Jonas Raoni Soares Silva
  //@ http://jsfromhell.com/math/is-point-in-poly [rev. #0]
  for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i) {
    ((poly[i][1] <= pt.y && pt.y < poly[j][1]) || (poly[j][1] <= pt.y && pt.y < poly[i][1])) &&
    (pt.x < (poly[j][0] - poly[i][0]) * (pt.y - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0]) && (c = !c);
  }
  return c;
};

var returnSVGFromPoint = function (lat, lng) {
  var PtOnSVGScale = HPViz_context.projection([lng, lat]);//Todo match up
  var SVGposition = HPViz_context.svg[0][0].getBoundingClientRect();
  return document.elementFromPoint(SVGposition.left + PtOnSVGScale[0], SVGposition.top + PtOnSVGScale[1]);
};

var reformatChartDataForLineFct = function(HDvalue) {
  var newHDvalue = {};
  newHDvalue.data = [];
  for (var key in HDvalue) {
    if (HDvalue.hasOwnProperty(key)) {
      if (key.match(/[0-9]{4}/)) {
        newHDvalue.data.push(
          {
            "year": key,
            "ratio": HDvalue[key].ratio
          }
        );
      }
    }
  }
  newHDvalue.id = HDvalue.LADid;
  return newHDvalue;
};

var drawLegend = function() {
  var legendBoxContainer = HPViz_context.svg.append("g")
    .attr("class", "legend-box-container")
    .attr("transform", "translate(" + HPViz_constants.legendBoxX + "," + HPViz_constants.legendBoxY + ")");

  legendBoxContainer.append("rect")
    .attr("fill", "#eee")
    .attr("width", HPViz_constants.legendBoxWidth)
    .attr("height", HPViz_constants.legendBoxHeight);
    //.attr("transform", "translate(" + "-30" + "," + (-15 - HPViz_constants.legendBoxHeight) + ")");

  legendBoxContainer.append("text")
    .attr("font-size", HPViz_constants.legendFontSize)
    .text("Ratio of average house prices to average wages")
    .attr('text-anchor', 'end')
    .attr("transform", "translate(" + (HPViz_constants.legendBoxWidth - HPViz_constants.legendBoxMargin) + "," + (HPViz_constants.legendBoxMargin - 5) + ")")
    .call(wrap, (HPViz_constants.legendBoxWidth - HPViz_constants.legendBoxMargin), 1.1);

  var legendContainer = legendBoxContainer.append('g')
    .attr("transform", "translate(" + HPViz_constants.legendX + "," + (HPViz_constants.legendBoxHeight * 0.75) + ")");

  legendContainer.append("linearGradient")
    .attr("id", "linear-gradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%")
      .selectAll('stop').data(
        HPViz_constants.colourScaleSkeleton.map(function(d) {
          return {
            "offset": d.offset * 100 + "%",
            "colour": d.colour
          };
        })
      )
    .enter().append('stop')
    .attr("offset", function(d) {return d.offset;})
    .attr("stop-color", function(d) {return d.colour;});

  legendContainer.append("rect")
    .attr("width", HPViz_constants.legendWidth)
    .attr("height", HPViz_constants.legendHeight)
    .attr("class", "legend")
    .style("fill", "url(#linear-gradient)");

  var legendScale = d3.scale.linear()
    .domain(HPViz_context.domainArray.map(function(d, i) {
        return (i/(HPViz_context.domainArray.length-1)) * (HPViz_context.domainArray[HPViz_context.domainArray.length - 1] - HPViz_context.domainArray[0]) + HPViz_context.domainArray[0];
      }))
    .range(HPViz_constants.colourScaleSkeleton.map(function(d) {return d.offset * HPViz_constants.legendWidth;}));

  var legendAxis = d3.svg.axis().orient("bottom")
    .scale(legendScale)
    .tickValues(HPViz_context.domainArray);

  var legendAxisGroup = legendContainer.append("g")
    .attr('class', "legend-axis-group")
    .attr("transform", "translate(" + 0 + "," + 10 + ")")
    .call(legendAxis);

  legendBoxContainer.append('text')
    .attr('class', 'legend-year')
    .attr('font-size', 45)
    .attr('text-anchor', 'end')
    .attr('fill', '#333')
    .attr("transform", "translate(" + (HPViz_constants.legendBoxWidth) + "," + (HPViz_constants.legendBoxHeight * 1.3 + HPViz_constants.legendBoxMargin) + ")");

};

var bindAndDrawMap = function() {

  HPViz_context.svg.append('g').attr('class', 'lad-container')
    .selectAll('.localDistricts')
    .data(HPViz_context.dataset)
    .enter()
    .append('path')
    .attr('class', 'localDistricts')
    .attr('id', function(d) {return d.id;})
    .attr('d', HPViz_context.path)
    .attr('fill', 'white')
    .on("mouseover", function() {})
    .on("mouseout", function() {})
    .on("click", function(select) {
      if (HPViz_context.currentlySelected.id !== this.id) {
        updateLADChart(this);
      }
    });

  drawLegend();
  startAnimationLoop();

  var mapReadyEvent = new Event('mapready');
};

var fillColourOnRatio = function(ratio) {
  var returnColour = HPViz_context.ratioScale(ratio);
  if (isNaN(ratio)) {
    returnColour = '#ccc';
  }
  return returnColour;
};

var startAnimationLoop = function() {
  HPViz_context.timer = window.setInterval(function() {
    HPViz_context.svg.select('.legend-year').text(HPViz_context.currentYear);

    animationStep();
    if (HPViz_context.currentYear == HPViz_constants.endYear) {
      //Clear timer
      window.clearInterval(HPViz_context.timer);
      HPViz_context.timer = 0;
      //Restart timer with start year
      window.setTimeout(function() {
        //Clear all rects
        d3.selectAll('.chart-rect').remove();
        //TODO:Time this up with removal of path

        HPViz_context.currentYear = HPViz_constants.startYear;
        startAnimationLoop();
      }, 3000);
    } else {
      HPViz_context.currentYear++;
    }
  }, HPViz_constants.stepTiming);
};

var getLineSegment = function(year, data) {
  var interpolatedArraySegment = data.yearlyData.slice(0, year - HPViz_constants.startYear + 1);
  var interpolatedLineSegment = [];
  interpolatedArraySegment.forEach(function(currentValue) {
    interpolatedLineSegment.push(
      {
        "ratio": currentValue.ratio,
        "year": currentValue.year
      }
    );
  });

  if (interpolatedLineSegment.length === 0) {
    interpolatedLineSegment =
    {
      "ratio": 0,
      "year": 1997
    };
  }

  return interpolatedLineSegment;
};

var findDataForYearFromJSONArray = function(data, year, targetKey) {
  if (data.yearlyData && data.yearlyData[year - HPViz_constants.startYear][targetKey] !== "Null") {
    return data.yearlyData[year - HPViz_constants.startYear][targetKey].toFixed(0);
  } else {
    return "-";
  }
};

var animationStep = function() {
  HPViz_context.svg.selectAll('.localDistricts')
    .transition()
    .duration(HPViz_constants.stepTiming)
    .attr('fill', function(d) {
      return fillColourOnRatio(d.pricingRatioData[HPViz_context.currentYear]);
    });

  //Test whether a local area has been selected, and a LAD JSON file returned and added as the LADData global
  if (Object.keys(HPViz_context.LADData).length !== 0) {
    console.log(HPViz_context.currentYear);
    //TODO: document.getElementsByClassName("national-housing-ratio")[0].textContent = findDataForYearFromJSONArray(HPViz_context.nationalData, HPViz_context.currentYear, "ratio");
    //TODO: document.getElementsByClassName("national-mortgage-payoff-period")[0].textContent = findDataForYearFromJSONArray(HPViz_context.nationalData, HPViz_context.currentYear, "mortgagePeriod");

    //TODO: document.getElementsByClassName("lad-housing-ratio")[0].textContent = findDataForYearFromJSONArray(HPViz_context.LADData, HPViz_context.currentYear, "ratio");
    //TODO: document.getElementsByClassName("lad-mortgage-payoff-period")[0].textContent = findDataForYearFromJSONArray(HPViz_context.LADData, HPViz_context.currentYear, "mortgagePeriod");

    var calculateElementNumber = function(year) {
      return year - HPViz_constants.startYear;
    };

    var nationalLineSegment = getLineSegment(HPViz_context.currentYear, HPViz_context.nationalData);
    d3.select('.national-chart-path')
       .transition()
       .duration(HPViz_constants.stepTiming)
       .attr('d', function() {
         return HPViz_context.nationalLineFct(nationalLineSegment.filter(function(element) {
           if (isNaN(element.ratio)) return false;
           else return true;
         }));
       });

    var ladLineSegment = getLineSegment(HPViz_context.currentYear, HPViz_context.LADData);

    var LadRects = d3.select('.lad-chart-rects')
      .selectAll('.chart-rect')
        .data(ladLineSegment, function(d) {
          var key = d.ratio + d.year;
          return key;
        });
    LadRects.exit().remove();
    LadRects.enter().append('rect')
        .attr('class', "chart-rect")
        .attr('height', HPViz_constants.chartHeight)
        .attr('width', (HPViz_constants.elementWidth))
        .attr('x', function (d) {
          var xDisp = (HPViz_constants.elementWidth * calculateElementNumber(d.year));
          return xDisp;
        })
        .attr('y', 0)
        .attr('fill', function (d) {
          return fillColourOnRatio (d.ratio);
        });

    d3.select('.lad-chart-path')
      .transition()
      .duration(HPViz_constants.stepTiming)
      .attr('d', function() {
        return HPViz_context.LADLineFct(ladLineSegment.filter(function(element) {
          if (isNaN(element.ratio)) {return false;}
          else {return true;}
        }));
      });

    var nationalRects = d3.select('.national-chart-rects')
      .selectAll('.chart-rect')
        .data(nationalLineSegment, function(d) {
          var key = d.ratio + d.year;
          return key;
        });
    nationalRects.enter().append('rect')
        .attr('class', "chart-rect")
        .attr('height', HPViz_constants.chartHeight)
        .attr('width', HPViz_constants.elementWidth)
        .attr('x', function (d) {
          var xDisp = (HPViz_constants.elementWidth * calculateElementNumber(d.year));
          return xDisp;
        })
        .attr('y', 0)
        .attr('fill', function (d) {
          return fillColourOnRatio (d.ratio);
        });
    nationalRects.exit().remove();
  }
};

window.onload = initialize();
