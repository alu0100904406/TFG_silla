document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.sidenav');
    var instances = M.Sidenav.init(elems, {});
});

rosHeartbeat = new ROSLIB.Ros({
    url : 'ws://' + window.location.hostname + ':9090'//Conexion a rosbridge
});

//TERMOMETRO
/*var temperature = new ROSLIB.Topic({
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
var battery_test = 100;
var svg_battery = d3.select('body').append('svg').attr("width", 50).attr("height",100);
bar_battery = svg_battery.append('rect').attr('y', 100-battery_test).attr('height',battery_test).attr('width', 50).attr('fill','green');
svg_battery.append('rect').attr('y', 0).attr('height',100).attr('width', 50).attr('style', 'stroke-width:8;stroke:rgb(0,0,0)').attr('fill-opacity','0');
var b_text = svg_battery.append('text').text(battery_test + '%').attr('x',12).attr('y',50);

var battery_test = 100;
setInterval(function(){
    if(battery_test === -1){
        battery_test = 100;
    }
    bar_battery.attr('y', 100-battery_test).attr('height',battery_test);
    b_text.text(Math.floor(battery_test) + '%');
    if(battery_test <= 25){
        bar_battery.attr('fill','red');
    }
    else {
        bar_battery.attr('fill','green');
    }
    battery_test--;
}.bind(this), 250);   */ 

//GOOGLE CHARTS
var heartbeat = new ROSLIB.Topic({
    ros         : rosHeartbeat,
    name        : '/heartbeat',
    messageType : 'std_msgs/Float64'
});

var humidity = new ROSLIB.Topic({
    ros         : rosHeartbeat,
    name        : '/humidity',
    messageType : 'std_msgs/Float64'
});

google.charts.load('current', {packages: ['corechart']});
google.charts.setOnLoadCallback(drawChart);//HABILITAR BOTON
var data, data_humidity;
var chart, chart_humidity;
var options, options_humidity;

function drawChart() {
    // Define the chart to be drawn.
    data = new google.visualization.DataTable();
    data.addColumn('string', 'Element');
    data.addColumn('number', 'latidos');

    data_humidity = new google.visualization.DataTable();
    data_humidity.addColumn('string', 'Element');
    data_humidity.addColumn('number', 'humidity');

    options = { 
        title: 'HEARTBEAT',
        legend: {
            position: 'none'
        },
        curveType: 'function',
        vAxis: {
            'minValue': -1, 
            'maxValue': 1
        },
        colors: ['#1ea522']
    }

    options_humidity = { 
        title: 'HUMIDITY',
        legend: {
            position: 'none'
        },
        curveType: 'function',
        vAxis: {
            'minValue': -1, 
            'maxValue': 1
        },
    }

    // Instantiate and draw the chart.
    chart = new google.visualization.LineChart(document.getElementById('heartbeat_chart'));
    chart_humidity = new google.visualization.LineChart(document.getElementById('humidity_chart'));
    chart.draw(data, options);
    chart_humidity.draw(data_humidity, options_humidity);

    var count_humidity = 1;
    var count = 1;
    heartbeat.subscribe(function(msg){
        if(count === 1){
            if(data. getNumberOfRows() < 40){
                data.addRows([['',msg.data]]);
            }
            else {
                data.removeRow(0);
                data.addRows([['',msg.data]]);
            }
            chart.draw(data,options);
            count = 0;
        }
        else {
            count++;
        }
        
    }.bind(this));

    humidity.subscribe(function(msg){
        if(count_humidity === 3){
            if(data_humidity. getNumberOfRows() < 40){
                data_humidity.addRows([['',msg.data]]);
            }
            else {
                data_humidity.removeRow(0);
                data_humidity.addRows([['',msg.data]]);
            }
            chart_humidity.draw(data_humidity,options_humidity);
            count_humidity = 0;
        }
        else {
            count_humidity++;
        }
        
    }.bind(this));
}

function visualization(){
    $.get("/list_streams", function(data, status){
        var streams_window = window.open("", "", "width=500,height=500");
        $(streams_window.document.body).attr('style', 'margin: 0;background-color: black;');
        $(streams_window.document.body).html("<img id='visualization_stream' style='height:100%; width:100%;object-fit: contain;' src='http://localhost:8123/stream?topic=" + data.topics[0] + "'>");
        var select = $('<select/>');
        select.attr('style','position: fixed;top: 10px;right: 10px;')
        select.on('change',function(){
            $(streams_window.document.getElementById('visualization_stream')).attr("src", "http://localhost:8123/stream?topic=" + this.value);
        })
        $(streams_window.document.body).prepend(select);
        data.topics.forEach(function(topic) {
            var option = $('<option/>');
            option.text(topic);
            select.append(option); 
        });
    });
}





    
