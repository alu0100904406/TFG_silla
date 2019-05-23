rosHeartbeat = new ROSLIB.Ros({
    url : 'ws://127.0.0.1:9090'//Conexion a rosbridge
});

var temperature = new ROSLIB.Topic({
    ros         : rosHeartbeat,
    name        : '/temperature',
    messageType : 'std_msgs/Float64'
});

var battery = new ROSLIB.Topic({
    ros         : rosHeartbeat,
    name        : '',
    messageType : 'std_msgs/Float64'
})

var svg = d3.select('body').append('svg').attr("width", 40).attr("height",250);

var temperatura = 0;
var t_text = svg.append('text').text('').attr('x',6).attr('y',250);
var bar = svg.selectAll('.bar').data([temperatura*10/2]).attr('class','bar');

temperature.subscribe(function(msg){
    temperatura = msg.data;
    t_text.text(Math.floor(temperatura));

    bar.enter().append("rect")
                .attr("x", 10)
                .attr("y", function(temperatura){ return 250 - temperatura - 15})
                .attr("width", 5)
                .attr("height", function(temperatura){ return temperatura})
                .attr("style", "fill:red;")
                .attr('class', 'bar');

    bar = svg.selectAll('.bar').data([temperatura*10/2]);
    
    bar.attr('height',  function(t){ return t}).attr('width', 5).attr("y", function(t){ return 250 - t -15});   
});

/*d3.select();//El primer elemento del dom que cumpla el criterio
d3.selectAll();//Todos
d3.select('h1')
.style('color', 'red')
.attr('class', 'heading')
.text('Map')
.append('p').text('hola');*/

/*var dataset1 = [1,2,3,4,5];
d3.select('body').
selectAll('p').
data(dataset1).
enter().
append('p').
text(function(data) { return data})*/

/*var datasetbars = [80, 100, 56, 120, 180, 30, 40, 120, 160];

var svgWidth = 500;
var svgHeight = 300;
var barPadding = 5;
var barWidth = svgWidth / datasetbars.length



var barChart = svg.selectAll('rect')
                    .data(datasetbars)
                    .enter()
                    .append('rect')
                    .attr('y', function(d) { return svgHeight - d})
                    .attr('height', function(d){ return d})
                    .attr('width', barWidth - barPadding)
                    .attr('transform', function(d, i){ 
                        var translate = [barWidth * i, 0];
                        return "translate(" + translate + ")";
                    });*/

//scalelinear
/*
   axisTop
   axisRight
   axisBottom
   axisLeft
*/

//Transform
//pie()
//arc()
//scaletime
//rangeround
//line()
//extend()