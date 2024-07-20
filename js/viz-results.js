
    var scores = new Map();
    var ranks = new Map();
    var rels = new Map();
    var comps = new Map();
    var compBinLabels=[
      "extremely similar"
      ,"very similar"
      ,"somewhat similar"
      ,"somewhat different"
      ,"very different"
      ,"extremely different"
    ];
    var rankOrder =["action","relationship","gender","fitness","law","status","age","lives","species"];

    var radarOrder =["action","relationship","gender","fitness","law","status","age","lives","species"];
    var radarScale = ["#f5f5f5","#d8b365","#5ab4ac"]; //grey, green, yellow
    var radarData = [
            [//base-world
            // {axis:"Preferring Inaction",value:0.5},
            // {axis:"Sparing Pedestrians",value:0.5},
            // {axis:"Sparing Females",value:0.5},
            // {axis:"Sparing the Fit",value:0.5},
            // {axis:"Sparing the Lawful",value:0.5},
            // {axis:"Sparing Higher Status",value:0.5},
            // {axis:"Sparing the Younger",value:0.5},
            // {axis:"Sparing More",value:0.5},
            // {axis:"Sparing Humans",value:0.5},
            {axis:"Preferring Inaction",value:0.469301075075},
            {axis:"Sparing Pedestrians",value:0.571315537318},
            {axis:"Sparing Females",value:0.463406899655},
            {axis:"Sparing the Fit",value:0.567372666548},
            {axis:"Sparing the Lawful",value:0.441211559666},
            {axis:"Sparing Higher Status",value:0.490739197538},
            {axis:"Sparing the Younger",value:0.563313983896},
            {axis:"Sparing More",value:0.511171783141},
            {axis:"Sparing Humans",value:0.660192846424},
            ],[],[]
     ];

    var cA = null;
    var cB = null;
    var cAO = null;
    var cBO = null;

    var defZ = 1;

    var codeNames = new Map();
    var worldData;

    var initWidth = 1000,
      initRotated = -10,
      initHeight = 400;

    //countries which have states, needed to toggle visibility
    //for USA/ etc. either show countries or states, not both
    // var usa, canada; 
    // var states; //track states
    //track where mouse was clicked
    var initX;
    //track scale only rotate when s === 1
    var s = 1;
    var mouseClicked = false;
    var initScale = 170;
    var mapScaleExtent = [1, 20];

    var projection = d3.geo.equirectangular()
        .scale(initScale)
        .translate([initWidth/2,initHeight/1.75])
        .rotate([initRotated,0,0]); //center on USA because 'murica

    function zoomed() {
      if(d3.event.sourceEvent) {
        d3.event.sourceEvent.stopPropagation();
        d3.event.sourceEvent.preventDefault();
      }
      var t = d3.event.translate;
      s = d3.event.scale; 
      var h = 0;

      t[0] = Math.min(
        (newW/newH)  * (s - 1), 
        Math.max(
          newW * (1 - s)
          , t[0]
        )
      );
      t[1] = Math.min(
        h * (s - 1) + h * s, 
        Math.max(
          newH * (1 - s/defZ) - h * s
          , t[1]
        )
      );
      zoom.translate(t);
      // if(s.toFixed(2) == defZ.toFixed(2) && mouseClicked) {
      //   rotateMap(d3.mouse(this)[0]);
      //   return;
      // }

      g.attr("transform", "translate(" + t + ")scale(" + s + ")");

      //adjust the stroke width based on zoom level
      d3.selectAll(".boundary")
        .style("stroke-width", 1 / s);
      d3.selectAll(".boundary-selectable")
        .style("stroke-width", 1 / s);
      
    }

    function zoomKey(z) {
      var t = zoom.translate();
      s = s*z; 
      if(s<zoom.scaleExtent()[0]) {
        s = zoom.scaleExtent()[0];
      }
      if(s>zoom.scaleExtent()[1]) {
        s = zoom.scaleExtent()[1];
      }
      var h = 0;
      t = [(t[0]-newW/2)*z+newW/2,(t[1]-newH/2)*z+newH/2];
      t[0] = Math.min(
        (newW/newH)  * (s - 1), 
        Math.max(
          newW * (1 - s)
          , t[0]
        )
      );

      t[1] = Math.min(
        h * (s - 1) + h * s, 
        Math.max(
          newH * (1 - s/defZ) - h * s
          , t[1]
        )
      );
      g.attr("transform", "translate(" + t + ")scale(" + s + ")");

      //adjust the stroke width based on zoom level
      d3.selectAll(".boundary")
        .style("stroke-width", 1 / s);
      d3.selectAll(".boundary-selectable")
        .style("stroke-width", 1 / s);
      zoom.scale(s);
      zoom.translate(t);
    }

    var zoom = d3.behavior.zoom()
      .scaleExtent(mapScaleExtent)
      .on("zoom", zoomed);

d3.select("#zoom_in").on("click", function() {
    zoomKey(1.5);
}); 

d3.select("#zoom_out").on("click", function() {
    zoomKey(1/1.5);
});

d3.select("#zoom_reset").on("click", function() {
    zoomKey(1/zoom.scale());
    if(cA) {
      selected(cAO);
    }
    if(cB) {
      selected(cBO);
    }
});

var dragging = false;
    var drag = d3.behavior.drag()
      .on("drag", function(d) {dragging = true;})
      // .on("drag", function(d) {d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);})
      // .on("dragend", function(d) {});

    var rsvg;
    d3.select("#map")
    .classed("no-touch",true)
    .attr("touch-action", "none");
    var msvg = d3.select("body").select("#map").append("svg")
        .classed("no-touch",true)
        .attr("touch-action", "none")
        .attr("width", initWidth)
        .attr("height", initHeight)
        .attr("zoomEnabled", true)
          .call(drag)
          //track where user clicked down
          .on("mousedown", function() {
             d3.event.preventDefault(); 
             //only if scale === 1
             if(s !== 1) return;
               initX = d3.mouse(this)[0];
               mouseClicked = true;
          })
          .on("mouseup", function() {
              if(s !== 1) return;
              initRotated = initRotated + ((d3.mouse(this)[0] - initX) * 360 / (s * newW));
              mouseClicked = false;
          }).call(zoom).on("dblclick.zoom", null);


      function rotateMap(endX) {
        projection.rotate([initRotated + (endX - initX) * 360 / (s * newW),0,0])
            g.selectAll('path')       // re-project path data
           .attr('d', path);
      }
    //for tooltip 
    var offsetL = document.getElementById('map').offsetLeft+10;
    var offsetT = document.getElementById('map').offsetHeight+10;
    var offsetRL = document.getElementById('radar').offsetLeft+10;
    var offsetRT = document.getElementById('radar').offsetHeight+10;
    // var offsetL = 10;
    // var offsetT = 10;
    // var offsetRL = 10;
    // var offsetRT = 10;

function getOffset(element)
{
    var bound = element.getBoundingClientRect();
    var html = document.documentElement;

    return {
        top: bound.top + window.pageYOffset - html.clientTop,
        left: bound.left + window.pageXOffset - html.clientLeft
    };
}

    var path = d3.geo.path()
        .projection(projection);

    var tooltip = d3.select("#map")
         .append("div")
         .attr("class", "tooltip hidden");

    var radarTooltip = d3.select("#radar")
         .append("div")
         .attr("class", "radartooltip hidden");

    //need this for correct panning
    var g = msvg.append("g");
    //det json data and draw it
    var wdata;
    d3.queue()
    .defer(d3.csv, "data/scores.csv")
    .defer(d3.csv, "data/ranks.csv")
    .defer(d3.csv, "data/relations.csv")
    .defer(d3.csv, "data/comparisons.csv")
    .defer(d3.json, "data/combined2.json")
    .await(function(error, rscores, rranks, rrels, rcomps, world) {
      world.objects.countries.geometries.find(o => o.id === "PSX").id="PSE";
      world.objects.countries.geometries.find(o => o.id === "PR1").id="PRT";
      wdata = world.objects.countries.geometries;
      if(error) return console.error(error);
      // console.log(rscores)
      // console.log(rranks)
      // console.log(rrels)
      // console.log(rcomps)
      rscores.forEach(function(r) {
        var ccode = r.country;
        var m = new Map();
        scores.set(ccode,m);
        for(var k in r) {
          m.set(k,parseFloat(r[k]));
        }
        m.delete("country");
      });
      // console.log(scores);

      rranks.forEach(function(r) {
        var ccode = r.country;
        var m = new Map();
        ranks.set(ccode,m);
        for(var k in r) {
          m.set(k,parseInt(r[k]));
        }
        m.delete("country");
      });
      $("#rankTableLabel").html("World Ranking<br>(out of "+ranks.size+" Countries)");
      // console.log(ranks);
      

      rrels.forEach(function(r) {
        var ccode = r.country;
        var m = new Map();
        rels.set(ccode,m);
        for(var k in r) {
          m.set(k,r[k]);
        }
        m.delete("country");
      });
      // console.log(rels);
      
      rcomps.forEach(function(r) {
        var acode = r.country;
        var bcode = r.compared;
        if(!comps.has(acode)) {
          var m = new Map();
          comps.set(acode,m);
        }
        if(!comps.has(bcode)) {
          var m = new Map();
          comps.set(bcode,m);
        }
        comps.get(acode).set(bcode,parseInt(r.bin));
        comps.get(bcode).set(acode,parseInt(r.bin));
      });
      // console.log(comps);
      
      //countries
      g.append("g")
          .selectAll("boundary")
          .data(topojson.feature(world, world.objects.countries).features)
          .enter().append("path")
          .attr("name", function(d) { codeNames.set(d.id,d.properties.name);return d.properties.name;})
          .attr("id", function(d) { return d.id;})
          .attr("class",  function(d) { return scores.has(d.id)?"boundary-selectable":"boundary";})
          .on('click', selected)
          .on("mousemove", showTooltip)
          .on("mouseout",  function(d,i) {
              tooltip.classed("hidden", true);
          }).attr("d", path);

      // //states
      // g.append("g")
      //     .attr("class", "boundary state hidden")
      //   .selectAll("boundary")
      //     .data(topojson.feature(world, world.objects.states).features)
      //     .enter().append("path")
      //     .attr("name", function(d) { return d.properties.name;})
      //     .attr("id", function(d) { return d.id;})
      //     .on('click', selected)
      //     .on("mousemove", showTooltip)
      //     .on("mouseout",  function(d,i) {
      //         tooltip.classed("hidden", true);
      //      })
      //     .attr("d", path);

      //states = d3.selectAll('.state');
    });

    function showTooltip(d) {
      if(typeof window.orientation != 'undefined') return; //mobile
      label = d.properties.name + (scores.has(d.id)?"":(" (not available)"));
      var mouse = d3.mouse(msvg.node())
        .map( function(d) { return parseInt(d); } );
      tooltip.classed("hidden", false)
        .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
        .html(label);

      // console.log(mouse, offsetT, offsetL);
    }

    function showRadarTooltip(d) {
      if(typeof window.orientation != 'undefined') return; //mobile
      label = "";
      switch(radarScale.indexOf(d.id)) {
        case 0: label = "World Average"; break;
        case 1: label = codeNames.get(cA); break;
        case 2: label = codeNames.get(cB); break;
        default: ""
      }
      var mouse = d3.mouse(rsvg.node())
        .map( function(d) { return parseInt(d); } );
      radarTooltip.classed("hidden", false)
        .attr("style", "left:"+(mouse[0]+offsetRL)+"px;top:"+(mouse[1]+offsetRT)+"px")
        .html(label);

      // console.log(mouse, offsetRT, offsetRL);
    }

    function selected(d) {
      if(dragging) {
        return (dragging = false);
      }
      //################# SELECT/HIGHLIGHT ####################

      // console.log("clicked",d.properties.name, d.id)
      if(!scores.has(d.id)) {
        return null;
      }
      if(cA == d.id) {
        d3.select(cAO).classed('selected', false);
        d3.select(cAO).classed('selectedA', false);
        cA = null;
        cAO = null;
      } else if(cB == d.id) {
        d3.select(cBO).classed('selected', false);
        d3.select(cBO).classed('selectedB', false);
        cB = null;
        cBO = null;
      } else if(cA == null) {
        cAO = this;
        d3.select(cAO).classed('selected', true);
        d3.select(cAO).classed('selectedA', true);
        cA = d.id;
      } else if(cB == null) {
        cBO = this;
        d3.select(cBO).classed('selected', true);
        d3.select(cBO).classed('selectedB', true);
        cB = d.id;
      } else {
        $("#alertModal").modal();
      }
      // console.log("(",cA,cB,")");

      //################# RADAR/RELATIONSHIPS ####################

      var dataA = [];
      var dataB = [];
      if(cA == null) {
        $("#relA").html("");
        $("#rankA").hide();
        $("#rankVA").hide();
        $("#relA").hide();
      } else {
        dataA = radarProcess(scores.get(cA));
        $("#relA").html("<b>"+codeNames.get(cA) + "</b> is most similar to <b>" + codeNames.get(rels.get(cA).get("similar")) + "</b>, and most different from <b>" + codeNames.get(rels.get(cA).get("different")) + "</b>");
        $("#rankA").show()
        $("#rankVA").show()
        $("#relA").show()
        $("#rankAName").text(codeNames.get(cA));
        var rmpa = ranks.get(cA);
        for(var rord in rankOrder) {
          $("#rankA"+rord).text(getOrdinal(ranks.get(cA).get(rankOrder[rord])));
        }
      }
      if(cB == null) {
        $("#relB").html("");
        $("#rankB").hide();
        $("#rankVB").hide();
        $("#relB").hide();
      } else {
        dataB = radarProcess(scores.get(cB));
        $("#relB").html("<b>"+codeNames.get(cB) + "</b> is most similar to <b>" + codeNames.get(rels.get(cB).get("similar")) + "</b>, and most different from <b>" + codeNames.get(rels.get(cB).get("different")) + "</b>");
        $("#rankB").show()
        $("#rankVB").show()
        $("#relB").show()
        $("#rankBName").text(codeNames.get(cB));
        for(var rord in rankOrder) {
          $("#rankB"+rord).text(getOrdinal(ranks.get(cB).get(rankOrder[rord])));
        }
      }
      radarData[1] = dataA;
      radarData[2] = dataB;
      // console.log(radarData);
      renderRadar();


      //################# COMPARISON ####################
      if(cA == null && cB == null) {
        $("#compAB").hide();
        $("#rankLabels").hide();
      } else {
        $("#compAB").show();
        $("#rankLabels").show();
      }

      if(cA == null || cB == null) {
        $("#compAB").html("");
      } else {
        $("#compAB").html(codeNames.get(cA) + " and " + codeNames.get(cB) + " are <b>" + compBinLabels[comps.get(cA).get(cB)] +"</b>" );
      }

    }

    function getOrdinal(n) {
      var s=["th","st","nd","rd"],
      v=n%100;
      return n+(s[(v-20)%10]||s[v]||s[0]);
    }

    function radarProcess(score) {
      // console.log(radarOrder);
      var rarr = [];
      for(var rord in radarOrder) {
        // console.log(radarOrder[rord],score.get(radarOrder[rord]))
        rarr.push({"value":score.get(radarOrder[rord])});
      }
      return rarr;
    }

      var radarWidth = 100;
      var radarHeight = 100;
      var radarMargin = 60;
      var radarFontSize = 10;
      var radarDotRadius = 4;
      /* Radar chart design created by Nadieh Bremer - VisualCinnamon.com */
      function renderRadar() {
        var margin = {top: radarMargin
          , right: radarMargin
          , bottom: radarMargin
          , left: radarMargin
        },
          rwidth = radarWidth;
          //Math.min(400, window.innerWidth - 10) - margin.left - margin.right,
          rheight = radarHeight;
          //Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);

        var color = d3.scale.ordinal()
          .range(radarScale);
        var radarChartOptions = {
          w: rwidth,
          h: rheight,
          margin: margin,
          labelFontSize: radarFontSize,
          dotRadius: radarDotRadius,
          maxValue: 1.0,
          levels: 10,
          roundStrokes: true,
          color: color
        };
        //Call function to draw the Radar chart
        RadarChart("#radar", radarData, radarChartOptions);
    }
    var newW;
    var newH;
    var wrapped = false;
    var MOBILE_WIDTH = 600;
    var isMobile = false;
    function adjustLayout() {
      //resize
      odiv = $(".viz-window");
      mwidth = odiv.width();
      mheight = window.innerHeight/1.75;
      // console.log(mwidth, mwidth*1/3.5, mwidth*2.5/3.5);
      var newRD;
        oldS=initScale;
        oldW=initWidth;
        oldH=initHeight;
      if(typeof window.orientation == 'undefined') {
        isMobile = false;
        // console.log(mwidth,mheight);
        newW = mwidth*2.5/3.5-15;
        newH = mwidth*1/3.5;
        newRD = mwidth*1/3.5;
        newS = oldS * newW/oldW;
        defZ = 1;
        if(wrapped) {
          $("#rankLabels").unwrap();
          $("#rankA").unwrap();
          $("#rankB").unwrap();
          $("#compAB").removeClass("comp-ab-mobile");
          $("#rankAName").removeClass("rank-a-name-mobile").addClass("rank-a-name");
          $("#rankBName").removeClass("rank-b-name-mobile").addClass("rank-b-name");
          $("#rankTableLabel").removeClass("rank-table-label-mobile").addClass("rank-table-label");
          $("#zoom_in").removeClass("button-mobile").addClass("button");
          $("#zoom_out").removeClass("button-mobile").addClass("button");
          $("#zoom_reset").removeClass("button-mobile").addClass("button");
          wrapped = false;
        }
        $(".viz-window").removeClass("read-mobile").addClass("read-desktop");
        radarFontSize=Math.log(newRD*10/350,2)*4;
      } else {
        isMobile = true;
        newW = mwidth;
        newH = mheight;
        newRD = mwidth;
        newS = oldS * newH/oldH;
        defZ = zoom.scale() * oldH/newH;
        // console.log(oldS, newS);
        if(wrapped) {
          $("#rankLabels").unwrap();
          $("#rankA").unwrap();
          $("#rankB").unwrap();
          $("#compAB").removeClass("comp-ab-mobile");
        }
        $("#rankLabels").wrap("<div class='col-xs-6'></div>");
        $("#rankA").wrap("<div class='col-xs-3' id='rankVA'></div>");
        $("#rankB").wrap("<div class='col-xs-3' id='rankVB'></div>");
        $("#compAB").addClass("comp-ab-mobile");
        $("#rankAName").removeClass("rank-a-name").addClass("rank-a-name-mobile");
        $("#rankBName").removeClass("rank-b-name").addClass("rank-b-name-mobile");
        $("#rankTableLabel").removeClass("rank-table-label").addClass("rank-table-label-mobile");
        $("#zoom_in").removeClass("button").addClass("button-mobile");
        $("#zoom_out").removeClass("button").addClass("button-mobile");
        $("#zoom_reset").removeClass("button").addClass("button-mobile");
        wrapped = true;
        $(".viz-window").removeClass("read-desktop").addClass("read-mobile");
        radarFontSize=newRD*10/350;
      }
      radarDotRadius=newRD*4/350;
      $("svg:first").width(newW);
      $("svg:first").height(newH);
      projection.translate([newW/2,newH/1.75])
      if(isMobile) {
        projection.scale(newS*oldH/newH);
        zoom.scale(newH/oldH).event(msvg.transition().duration(250));
        // projection.translate([0,0]);
        projection.translate([newW/2,newH*defZ/1.75]);
        defZ = newH/oldH;
      } else {
        projection.scale(newS);
        defZ = 1;
      }
      mapScaleExtent = [defZ,20];
      zoom.scaleExtent(mapScaleExtent);
      // console.log(defZ);
      // console.log("radarFontSize",radarFontSize);
      radarMargin=newRD*70/350;
      radarWidth = newRD-radarMargin*2+4;
      radarHeight = newRD-radarMargin*2+4;

      renderRadar();

      offsetL = document.getElementById('map').offsetLeft+10;
      offsetT = document.getElementById('map').offsetHeight+10;
      offsetRL = document.getElementById('radar').offsetLeft+10;
      offsetLT = document.getElementById('radar').offsetHeight+10;
      // console.log(offsetL,offsetT);
      // console.log(offsetRL,offsetRT);
    }

    function redraw() {
      if (d3.event) {
        projection
            .translate(d3.event.translate)
            .scale(d3.event.scale);
      }
      msvg.selectAll("path").attr("d", path);
      var t = projection.translate();
      xAxis.attr("x1", t[0]).attr("x2", t[0]);
      yAxis.attr("y1", t[1]).attr("y2", t[1]);
    }


var document_width, document_height;
var resizeTimer;

$(window).resize(function() { //resize only if render change
clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function() {
  // alert(document_width+","+document_height+ " -> " +$(window).width()+","+$(window).height());
if(document_width!=$(window).width()
  || document_height!=$(window).height()) {
    //register new dimensions
    document_width=$(window).width();
    document_height=$(window).height();
    //adjust layout
    adjustLayout();
}
}, 250);
});

$(document).ready(function() { //prevent resize on mobile scroll
  document_width=$(window).width();
  document_height=$(window).height();
  adjustLayout();
});

// window.addEventListener('orientationchange', function ()
// {
//     if (window.innerHeight > window.innerWidth)
//     {
//         document.getElementsByTagName('body')[0].style.transform = "rotate(90deg)";
//     }
// });

var handleMove = function (e) {
    if($(e.target).closest('.viz-window').length == 0) { e.preventDefault(); }
}
document.addEventListener('touchmove', handleMove, true);

function pwchk(){
  var epass = document.getElementById("epass");
  var btnpass = document.getElementById("btnpass");
  if(epass.value !== "media") {
    epass.value = "";
    alert("Password is incorrect. Please try again.");
  } else {
    $("#overlay").hide();
  }
}

$("#epass").keyup(function(event) {
    if (event.keyCode === 13) {
        $("#btnpass").click();
    }
});

$("#btnpass").click(function() {
  pwchk();
});

$("#epass").focus();

var is_iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

if (is_iOS) {
    console.log("----");
    msvg.addEventListener('touchstart touchmove touchend', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
    }, {passive:false});
    $("#map").addEventListener('touchstart touchmove touchend', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
    }, {passive:false});
}