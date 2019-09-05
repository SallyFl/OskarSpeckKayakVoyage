var m_width = $(".map").width(),
    width = 938,
    height = 450;

var projection = d3.geoMercator()
      .center([55, 12])
      .scale(220)
      .translate([width/2,height/2])

var zoom = d3.zoom()
.scaleExtent([1,8])
.on("zoom", zoomed)

var path = d3.geoPath()
			 .projection(projection);

var pathline = d3.line()
   .x(function(d) {return projection(d)[0]})
   .y(function(d) {return projection(d)[1];})
    .curve(d3.curveBasis);

var duration = 20000;

var svg = d3.select(".map").append("svg")
    .attr("preserveAspectRatio", "xMidYMid")
    .attr("viewBox", "0 0 " + width + " " + height)
    .attr("width", m_width)
    .attr("height", m_width * height / width)
  .call(zoom);;

var g = svg.append("g");

d3.queue()
  .defer(d3.json, "data/world110m.json")
  .defer(d3.json, "data/data.json")
	.await(ready);

function ready (error, world, data){
	if (error) throw error;

  	var points = data.features;
  	var geojson =[]
  	for (var i = 0; i < points.length; i++) {
  			var x = points[i].geometry.coordinates[0];
  			var y = points[i].geometry.coordinates[1];
  			geojson.push([x,y]);
      }

//World map
 g.selectAll("path")
  .data(topojson.object(world, world.objects.countries)
  .geometries)
		.enter()
		.append("path")
		.attr("d", path)
		.style("fill", "white");

//Journey path
var journey = g.append("path")
    .attr("d",pathline(geojson))
    .attr("fill","none")
    .attr("class", "journey")
    .style('stroke-dasharray', function(d) {
      var l = d3.select(this).node().getTotalLength();
      return l + 'px, ' + l + 'px';
    })
    .style('stroke-dashoffset', function(d) {
      return d3.select(this).node().getTotalLength() + 'px';
 });

 var pathEl= journey.node();
 var pathLength = pathEl.getTotalLength();

 var pt = pathEl.getPointAtLength(0);

//Places visited
g.selectAll(".place_visited")
	  .data(data.features)
		.enter()
		.append("circle")
    .attr("r", function(d) {
      if(d.properties.url !== null && d.properties.url  !== '') {
         return "6" //larger if url exists
      }else {return "4"};})
		.attr("class", "place_visited")
	  .attr("transform", function(d,i) { return "translate(" + projection (data.features[i].geometry.coordinates) + ")"; })

//go to object page on click - if statement prevents going to blank url
.on("click", function(d){
  if(d.properties.url !== null && d.properties.url  !== '') {
     window.open(d.properties.url, '_blank', 'location=yes,height=600,width=960,scrollbars=yes,status=yes')
//}
  d3.select(this)
    .style("fill", "#0B4C5F") //teal if visited
    .style("stroke", "#0B4C5F");
  }
})
  .on("mouseover", function(d) {
    d3.select(this)
        .transition()
        .duration(50)
        .style("fill", function(d) {
          if(d.properties.url !== null && d.properties.url  !== '') {
             return "#f48556" //orange if url exists
          }else {return "#CbD4C6"};})

// Update the tooltip image and data
    d3.select("#date")
    .text(d.properties.arrivalDateTxt);

    d3.select("#cityName")
    .text(d.properties.name);

    d3.select("#pic")
    .attr("src","images/"+d.properties.objectNumber + '.jpg');

    //Use default image in tooltip if no image in data set
    d3.select("#pic").on("error", function(){
      let el = d3.select(this);
      el.attr("src", "images/Speck_Kayak2.jpg")
      el.on("error", null);
    })

//Show the tooltip
  d3.select("#tooltip").classed("hidden", false);
  })
  .on("mouseout", function() {
    d3.select(this)
      .transition()
      .delay(100)
      .duration(250)

  //Hide the tooltip - comment out for now so image remains in tool tip in div to right
  //d3.select("#tooltip").classed("hidden", true);
   })

var marker = g.append("image")
.attr("class", "kayak")
.attr("xlink:href", "kayak.png")
.attr("transform", "translate(" + pt.x + "," + pt.y +")")
.attr("width", 40)
.attr("height", 40);

var dateText = svg.append("text")
  .attr("id", "dataTitle")
  .text ("")
  .attr("x", width -30)
  .attr("y", 20)
.style("text-anchor","end");

var animateMapButton = d3.select(".map")
  .append('button')
  .attr("id", "animateMap")
  .text("Start Oskar's journey")

  animateMapButton.on("click", toggleAnimating)

var animateTimer;
var isAnimating = false

function toggleAnimating(){
    if (isAnimating) {
        clearInterval(animateTimer)
        animateMapButton.text("Restart Oskar's journey")
    }
    else {
      animateMapButton.text("Stop Oskar's journey")
        i=0;

  var i = 0;
  animateTimer = setInterval(function(){

    if (i<geojson.length){
      i++;
    pt = pathEl.getPointAtLength(pathLength*i/geojson.length);
    marker
      .transition()
      .ease(d3.easeLinear)
      .duration(500)
      .attr("transform", "translate(" + pt.x + "," + pt.y +")");

  journey
      .transition()
      .duration(500)
      .ease(d3.easeLinear)
      .style('stroke-dashoffset', function(d) {
        var stroke_offset = (pathLength - pathLength*i/geojson.length + 9);
        return (pathLength < stroke_offset) ? pathLength : stroke_offset + 'px';
      });

    dateText
       .text(points[i].properties.name + " " +points[i].properties.arrivalDateTxt);
      }
      else{
        clearInterval(animateTimer)
      }

      },500)
      }
      isAnimating = !isAnimating;
    }
}

//semantic zoom and pan
function zoomed(){
  g.style("stroke-width", 1.5 / d3.event.transform.k + "px");
  g.attr("transform", d3.event.transform);
  g.selectAll(".place_visited")
        .attr("r", function(d){
          if(d.properties.url !== null && d.properties.url  !== '') {
            var self = d3.select(this);
            var r = 6 / d3.event.transform.k;
            self.style("stroke-width", 1/ d3.event.transform.k + "px")
            return r;
          }else {
            var self = d3.select(this);
            var r = 4/ d3.event.transform.k;
              self.style("stroke-width", 1/ d3.event.transform.k + "px")
              return r}
        });
  g.selectAll(".kayak")
        .attr("width", 40 / d3.event.transform.k)
        .attr("height", 40 / d3.event.transform.k)
  g.selectAll(".journey")
    .style("stroke-width", 1.5 / d3.event.transform.k + "px");
}

//resize
$(window).resize(function() {
  var w = $(".map").width();
  svg.attr("width", w);
  svg.attr("height", w * height / width);

  });
