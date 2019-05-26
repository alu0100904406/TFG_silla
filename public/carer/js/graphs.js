rosHeartbeat = new ROSLIB.Ros({
    url : 'ws://127.0.0.1:9090'//Conexion a rosbridge
});

//TERMOMETRO
var temperature = new ROSLIB.Topic({
    ros         : rosHeartbeat,
    name        : '/temperature_avg',
    messageType : 'std_msgs/Float64'
});

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
                .attr("height", function(temperatura){ 
                    if (temperatura < 0) {//Arreglar para temperaturas negativas!Esto no vale!
                        return 0;
                    }
                    else {
                        return temperatura;
                    }
                })
                .attr("style", "fill:red;")
                .attr('class', 'bar');

    bar = svg.selectAll('.bar').data([temperatura*10/2]);
    
    bar.attr('height',  function(temperatura){ 
        if (temperatura < 0) {//Arreglar para temperaturas negativas!Esto no vale!
            return 0;
        }
        else {
            return temperatura;
        }
    })
    .attr('width', 5).attr("y", function(t){ return 250 - t -15});   
});

//ESTO CON JQUERY Y LAS GRAFICAS CON GOOGLE CHARTS
var svg_battery = d3.select('body').append('svg').attr("width", 50).attr("height",100);

svg_battery.append('rect').attr('y', 100-75).attr('height',75).attr('width', 50).attr('fill','green');
svg_battery.append('rect').attr('y', 0).attr('height',100).attr('width', 50).attr('style', 'stroke-width:8;stroke:rgb(0,0,0)').attr('fill-opacity','0');
