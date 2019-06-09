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

        var button = $('<button>"</button>').text(data.places[place].name);
        button.click(function(){
            map_navigation.set_goal(data.places[place].position);
        })
        $('#place-buttons').append(button);
    }
});

var socket = io({ query: "tipo=chair_user" });
socket.on('carer_calling',(data) => { 
    socket.emit('response',{caller:data.caller});
    publicar();
    subscribir();
});

socket.on('place_added',(place) => { 
    var button = $('<button>"</button>').text(place.name);
    button.click(function(){
        map_navigation.set_goal(place.position);
    })
    $('#place-buttons').append(button);
});

