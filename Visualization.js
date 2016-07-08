
var HPViz_constants = {
      mapWidth: 700,
      mapHeight: 900,
      chartMargin: {top: 20, right: 20, bottom: 50, left: 70},
      chartWidth: 330,
      chartHeight: 230,
      stepTiming: 450,
      startYear: 1999,
      endYear: 2015
    };

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
  var width = HPViz_constants.mapWidth;
  var height = HPViz_constants.mapHeight;

  HPViz_context.projection = d3.geo.albers()   // define our projection with parameters
    //.precision()
    .scale(5000)
    //.translate([-800, 800])
    .rotate(90)
    .center([1, 57]);

  HPViz_context.path = d3.geo.path().projection(HPViz_context.projection);

  HPViz_context.svg = d3.select('.map-div')
        .append('svg')
        .attr('height', height)
        .attr('width', width)
        .append('g');
};

var setupNationalChart = function() {
  //TODO: Chart height to client screen height
  var nationalSVG = d3.select('.national-chart-div').append('svg')
                     .attr('class', 'lad-chart-svg')
                     .attr("width", HPViz_constants.chartWidth + HPViz_constants.chartMargin.left + HPViz_constants.chartMargin.right)
                     .attr("height", HPViz_constants.chartHeight + HPViz_constants.chartMargin.top + HPViz_constants.chartMargin.bottom);
  setupXAxisAndReturnScale(nationalSVG, 'national-chart-xaxis');
  setupYAxisAndReturnScale(nationalSVG, 'national-chart-yaxis');
  nationalSVG.append("g")
            .attr("class", "national-chart-rects")
            .attr("transform", "translate(" + (HPViz_constants.chartMargin.left - 1) + "," + HPViz_constants.chartMargin.top + ")");
  nationalSVG.append("path")
           .attr("class", "national-chart-path")
           .attr("transform", "translate(" + (50) + "," + HPViz_constants.chartMargin.top + ")");
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

    document.getElementById('national').innerHTML = nationalDataRaw.LADname;

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
  var LADSVG = d3.select('.lad-chart-div').append('svg')
                     .attr('class', 'lad-chart-svg')
                     .attr("width", HPViz_constants.chartWidth + HPViz_constants.chartMargin.left + HPViz_constants.chartMargin.right)
                     .attr("height", HPViz_constants.chartHeight + HPViz_constants.chartMargin.top + HPViz_constants.chartMargin.bottom);
  setupXAxisAndReturnScale(LADSVG, 'lad-chart-xaxis');
  setupYAxisAndReturnScale(LADSVG, 'lad-chart-yaxis');
  LADSVG.append("g")
            .attr("class", "lad-chart-rects")
            .attr("transform", "translate(" + (HPViz_constants.chartMargin.left - 1) + "," + HPViz_constants.chartMargin.top + ")");
  LADSVG.append("path")
           .attr("class", "lad-chart-path")
           .attr("transform", "translate(" + (50) + "," + HPViz_constants.chartMargin.top + ")");
};

var updateLADChart = function(SVGTargetElement) {
  //Clear all rects
  d3.selectAll('rect').remove();
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
    document.getElementById('lad').innerHTML = LADDataRaw.LADname;

    HPViz_context.LADData = LADDataRaw;

    //Find max
    var max = 0;
    max = d3.max(HPViz_context.LADData.yearlyData, function(d) {
      return Number(d.ratio);
    });

    var LADSVG = d3.select('.lad-chart-svg');
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
                                      .attr("transform", "translate(" + (HPViz_constants.chartMargin.left - 30) + "," + (HPViz_constants.chartHeight + HPViz_constants.chartMargin.top) + ")")
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
                                      .attr("transform", "translate(" + (HPViz_constants.chartMargin.left - 30) + "," + HPViz_constants.chartMargin.top + ")")
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

  var min = 0,
      max = 0;

  houseData.forEach(function(HDcurrentValue) {
    var LDvalue = findMapDataById(HDcurrentValue.LADid);
    delete HDcurrentValue[""];
    LDvalue.pricingRatioData = HDcurrentValue;
  });

  HPViz_context.ratioScale = d3.scale.linear()
                    .domain([0, 9.99])
                    .range(['yellow', 'red']);

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



var bindAndDrawMap = function() {

  HPViz_context.svg.selectAll('.localDistricts')
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
    document.getElementById('year').innerHTML = HPViz_context.currentYear;
    animationStep();
    if (HPViz_context.currentYear == HPViz_constants.endYear) {
      //Clear timer
      window.clearInterval(HPViz_context.timer);
      HPViz_context.timer = 0;
      //Restart timer with start year
      window.setTimeout(function() {
        //Clear all rects
        d3.selectAll('rect').remove();
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
    document.getElementsByClassName("national-housing-ratio")[0].textContent = findDataForYearFromJSONArray(HPViz_context.nationalData, HPViz_context.currentYear, "ratio");
    document.getElementsByClassName("national-mortgage-payoff-period")[0].textContent = findDataForYearFromJSONArray(HPViz_context.nationalData, HPViz_context.currentYear, "mortgagePeriod");

    document.getElementsByClassName("lad-housing-ratio")[0].textContent = findDataForYearFromJSONArray(HPViz_context.LADData, HPViz_context.currentYear, "ratio");
    document.getElementsByClassName("lad-mortgage-payoff-period")[0].textContent = findDataForYearFromJSONArray(HPViz_context.LADData, HPViz_context.currentYear, "mortgagePeriod");

    var elementTotalNumber = HPViz_constants.endYear - HPViz_constants.startYear + 1;
    var elementWidth = (HPViz_constants.chartWidth)/(elementTotalNumber);
    //var elementCurrentNumber = HPViz_context.currentYear - HPViz_constants.startYear - 1;

    var calculateElementNumber = function(year) {
      return year - HPViz_constants.startYear - 1;
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
      .selectAll('rect')
        .data(ladLineSegment, function(d) {
          var key = d.ratio + d.year;
          return key;
        });
    LadRects.exit().remove();
    LadRects.enter().append('rect')
        .attr('class', "test")
        .attr('height', 230)
        .attr('width', (elementWidth))
        .attr('x', function (d) {
          var xDisp = (elementWidth * calculateElementNumber(d.year)) - (elementWidth / 2);
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
          if (isNaN(element.ratio)) return false;
          else return true;
        }));
      });

    var nationalRects = d3.select('.national-chart-rects')
      .selectAll('rect')
        .data(nationalLineSegment, function(d) {
          var key = d.ratio + d.year;
          return key;
        });
    nationalRects.enter().append('rect')
        .attr('class', "test")
        .attr('height', 230)
        .attr('width', elementWidth)
        .attr('x', function (d) {
          var xDisp = (elementWidth * calculateElementNumber(d.year)) - (elementWidth / 2);
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
