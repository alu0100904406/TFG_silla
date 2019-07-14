document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.sidenav');
    var instances = M.Sidenav.init(elems, {});
  });

  $( function() {
    $( "#dialog" ).dialog({
        appendTo: "#twod-map",
        autoOpen: false,
    });
  } );

var map_navigation;

map_navigation = new Navigation();
map_navigation.set_map("twod-map");

var place_mode = false;
var carer = false

$( "#twod-map" ).on("wheel", function(event) {
    if (map_navigation.viewer2D.scene.mouseInBounds === true) {
        event.preventDefault();
        map_navigation.zoom(event.originalEvent.deltaY);
    }
});

$( "#twod-map" ).on("mousedown", function(event) {
    if(map_navigation.get_scene().mouseInBounds === true && !place_mode){
        $( "#twod-map" ).on("mousemove", function(event) {
            //COMO TENER EN CUENTA EL ZOOM?
            map_navigation.shift_map(-event.originalEvent.movementX,event.originalEvent.movementY);
        });
    }
});

$( "#twod-map" ).on("mouseup", function(event) {
    $("#twod-map").off("mousemove");
});

$('body').on('mousemove', function(event){
    if(!map_navigation.get_scene().mouseInBounds){
        $("#twod-map").off("mousemove");
    }
});

window.onunload = function(){
    map_navigation.stop();
}

var dbclick_function = function(event){
    if(map_navigation.get_scene().mouseInBounds === true && !place_mode && carer){
        event.preventDefault();
        var position = map_navigation.get_ros_position(event.stageX, event.stageY);
        map_navigation.set_goal(position);
    }
}

$.get("/places", function(data, status){
    for(const place in data.places){
        map_navigation.set_place_marker(data.places[place].position, data.places[place].name);
    }
});


function visualization(){
    $.get("/list_streams", function(data, status){
        var streams_window = window.open("", "", "width=500,height=500");
        $(streams_window.document.body).attr('style', 'margin: 0;background-color: black;');
        $(streams_window.document.body).html("<img id='visualization_stream' style='height:100%; width:100%;object-fit: contain;' src='http://" + window.location.hostname + ":8123/stream?topic=" + data.topics[0] + "'>");
        var select = $('<select/>');
        select.attr('style','position: fixed;top: 10px;right: 10px;')
        select.on('change',function(){
            $(streams_window.document.getElementById('visualization_stream')).attr("src", "http://" + window.location.hostname + ":8123/stream?topic=" + this.value);
        })
        $(streams_window.document.body).prepend(select);
        data.topics.forEach(function(topic) {
            var option = $('<option/>');
            option.text(topic);
            select.append(option); 
        });
    });
}

this.map_navigation.set_dblclick_event(dbclick_function);

var click_function = function(event){
    if(map_navigation.get_scene().mouseInBounds === true && place_mode){
        var place_name = prompt("Enter place name:", "Kitchen");
        if(place_name != null){
            var position = map_navigation.get_ros_position(event.stageX, event.stageY);

            var data = { name: place_name, position: position }
            $.ajax({
                type: 'POST',
                url: '/save_place',
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: function(){
                    socket.emit('place_added', data);  
                    map_navigation.set_place_marker(position, place_name);
                }
            });
        }
    }
}

this.map_navigation.set_click_event(click_function);

map_navigation.subscribe_speed(function(message){
    $("#vel").text("Speed: " + message.linear.x.toFixed(2) + " m/s");
});

var socket = io.connect('/carers');

socket.on('occupied', () => {
    $('#care').attr("disabled", true);
});

socket.on('available', () => {
    $('#care').attr("disabled", false);
})

socket.on('carer', () => { 
    carer = true;
    $('#publicar').attr("disabled", false);
    $('#stop').attr("disabled", false);
    $('#care').attr("disabled", true);
    //$('#care').hide();
    $('#stopcare').removeAttr('hidden');
    $('#stopcare').attr("disabled", false);
    $('#place').attr("disabled", false);
    $('.red_icon').attr('style','color: #d50000;');
});

function care(){
    socket.emit('care');
}

function stop_care(){
    carer = false;
    $('#place').css("border-style", "outset");
    socket.emit('stop_care');
    $('#publicar').attr("disabled", true);
    $('#stop').attr("disabled", true);
    $('#care').attr("disabled", false);
    $('#care').show();
    $('#stopcare').attr('hidden', true);
    $('#stopcare').attr("disabled", true);
    $('#place').attr("disabled", true);
    $('#place').removeAttr('style');
    $('canvas').css("cursor", "default");
    $('.red_icon').removeAttr('style','color: #d50000;');
    map_navigation.stop();
    //cerrar llamada
}

function call(){
    /*socket.emit('call');
    socket.on('chair_response',() => { 
        publicar();
        subscribir();
    });*/
    id = socket.id.split('#')[1];
    var streams_window = window.open("/carer/call/" + id, "", "width=640,height=480");
    /*streams_window.document.head.innerHTML = '<title>Hi</title></head>';
    $(streams_window.document.body).attr('style', 'margin: 0;background-color: black;');
    //$(streams_window.document.body).html("<div id='remote'></div><div id='local></div>");*/
    /*var html = "<html><head><script src='https://code.jquery.com/jquery-1.10.2.js'></script><script src='https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.2.0/socket.io.js'></script><script src='js/adapter.js'></script><script src='js/janus.js'></script><script src='js/videoconference.js'></script></head><body style='margin: 0;background-color: black;'><div id='remote'></div><div id='local'></div></body></html>" ;

    streams_window.document.write(html);*/

}

function switch_place_mode(){
    place_mode = !place_mode;
    if(place_mode){
        $('#place').css("border-style", "inset");
        $('canvas').css("cursor", "crosshair");
    } 
    else {
        $('#place').removeAttr('style');
        $('canvas').css("cursor", "default");
    }
}
