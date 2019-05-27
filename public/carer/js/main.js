var map_navigation;

map_navigation = new Navigation();
map_navigation.set_map("twod-map");

var place_mode = false;
var carer = false

$( "#twod-map" ).on("wheel", function(event) {
    if (map_navigation.viewer2D.scene.mouseInBounds === true) {
        map_navigation.zoom(event.originalEvent.deltaY);
    }
});

$( "#twod-map" ).on("mousedown", function(event) {
    if(!place_mode){
        $( "#twod-map" ).on("mousemove", function(event) {
            map_navigation.shift_map(-event.originalEvent.movementX,event.originalEvent.movementY);
        });
    }
});

$( "#twod-map" ).on("mouseup", function(event) {
    $("#twod-map").off("mousemove");
});

window.onunload = function(){
    map_navigation.stop();
}

var dbclick_function = function(event){
    if(map_navigation.get_scene().mouseInBounds === true && !place_mode && carer){
        //prevent default?
        var position = map_navigation.get_ros_position(event.stageX, event.stageY);
        map_navigation.set_goal(position);
    }
}

$.get("/places", function(data, status){
    for(const place in data.places){
        map_navigation.set_place_marker(data.places[place].position, data.places[place].name);
    }
});

$.get("/list_streams", function(data, status){
    data.topics.forEach(function(element) {
        var button = $('<button>"</button>').text(element);
        button.click(function(){
            $('#visualization_stream').attr("src", "http://localhost:8123/stream?topic=" + element);
        })
        $('#visualization').append(button);
    });
});

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
                }
            });

            map_navigation.set_place_marker(position);
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
    $('#care').hide();
    $('#stopcare').removeAttr('hidden');
    $('#stopcare').attr("disabled", false);
    $('#place').attr("disabled", false);
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
}

function call(){
    socket.emit('call');
    socket.on('chair_response',() => { 
        publicar();
        subscribir();
    });
}

function switch_place_mode(){
    place_mode = !place_mode;
    if(place_mode){
        $('#place').css("border-style", "inset");
        $('canvas').css("cursor", "crosshair");
    } 
    else {
        $('#place').css("border-style", "outset");
        $('canvas').css("cursor", "default");
    }
}
