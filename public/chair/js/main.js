document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.sidenav');
    var instances = M.Sidenav.init(elems, {});
});

var map_navigation;
var places;
var page_places = 0;
var objective;

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
        //prevent default?
        var position = map_navigation.get_ros_position(event.stageX, event.stageY);
        map_navigation.set_goal(position);
    }
}

$.get("/places", function(data, status){
    places = data.places;
    var index = page_places * 12;
    for( var i=0; i < 12; i++) {
        map_navigation.set_place_marker(places[index].position, places[index].name);

        var button = $('<button>"</button>').text(places[index].name);
        button.attr('class', 'place btn-large #26c6da cyan lighten-1');
        button.data('index',{ index: index})
        button.click(function(){
            $('.place').removeAttr('style');
            $(this).css("border-style", "inset");
            objective = places[$(this).data('index').index].position;
        })
        index++;
        $('#place-buttons').append(button);
        if (index >= places.length-1) {
            break;
        }
    }
    if(index + 1 < places.length){
        var button = $('<button></button>').append('<i class="material-icons">arrow_forward</i>');
        button.attr('class', 'btn-large green');
        button.attr('id', 'next_page');
        button.click(function(){
            next_page_places();
        });
        $('#place-buttons').append(button);
    }
    var button = $('<button></button>').text('GO');
    button.attr('class', 'btn-large red accent-4');
    button.attr('id', 'go');
    button.click(function(){
        map_navigation.set_goal(objective);
    });
    $('#place-buttons').append(button);
});

var socket = io({ query: "tipo=chair_user" });
socket.on('carer_calling',(data) => { 
    socket.emit('response',{caller:data.caller});
    publicar();
    subscribir();
});

socket.on('place_added',(place) => { 
    var button = $('<button>"</button>').text(place.name);
    button.attr('class', ' place btn-large #26c6da cyan lighten-1');

    places.push(place);

    button.click(function(){
        $('.place').removeAttr('style');
        $(this).css("border-style", "inset");
        objective = place.position;
    })

    if((page_places * 12) + 12 >= places.length){
        $('#place-buttons').append(button);
    }
    else if(!$("#next_page").length){
        var button = $('<button></button>').append('<i class="material-icons">arrow_forward</i>');
        button.attr('class', 'btn-large green');
        button.attr('id', 'next_page');
        button.click(function(){
            next_page_places();
        });
        $('#place-buttons').append(button);
    }
    if(!$("#go").length){
        var button = $('<button></button>').text('GO');
        button.attr('class', 'btn-large red accent-4');
        button.attr('id', 'go');
        button.click(function(){
            map_navigation.set_goal(objective);
        });
        $('#place-buttons').append(button);
    }
});

function next_page_places(){
    $('#place-buttons').empty();
    page_places++;
    console.log(page_places)
    if(page_places > 0){
        var button = $('<button></button>').append('<i class="material-icons">arrow_back</i>');
        button.attr('class', 'btn-large green');
        button.attr('id', 'previous_page');
        button.click(function(){
            previous_page_places();
        });
        $('#place-buttons').append(button);
    }
    var index = page_places * 12;
    for( var i=0; i < 12; i++) {
        console.log(index,places.length)
        map_navigation.set_place_marker(places[index].position, places[index].name);

        var button = $('<button>"</button>').text(places[index].name);
        button.attr('class', 'place btn-large #26c6da cyan lighten-1');
        button.data('index',{ index: index})
        button.click(function(){
            $('.place').removeAttr('style');
            $(this).css("border-style", "inset");
            objective = places[$(this).data('index').index].position;
        })
        $('#place-buttons').append(button);

        index++;
        if (index >= places.length-1) {
            break;
        }
    }
    if(index < places.length){
        var button = $('<button></button>').append('<i class="material-icons">arrow_forward</i>');
        button.attr('class', 'btn-large green');
        button.attr('id', 'next_page');
        button.click(function(){
            next_page_places();
        });
        $('#place-buttons').append(button);
    }
    var button = $('<button></button>').text('GO');
    button.attr('class', 'btn-large red accent-4');
    button.attr('id', 'go');
    button.click(function(){
        map_navigation.set_goal(objective);
    });
    $('#place-buttons').append(button);
}

function previous_page_places(){
    $('#place-buttons').empty();
    page_places--;
    if(page_places > 0){
        var button = $('<button></button>').append('<i class="material-icons">arrow_back</i>');
        button.attr('class', 'btn-large green');
        button.attr('id', 'previous_page');
        button.click(function(){
            previous_page_places();
        });
        $('#place-buttons').append(button);
    }
    var index = page_places * 12;
    for( var i=0; i < 12; i++) {
        map_navigation.set_place_marker(places[index].position, places[index].name);

        var button = $('<button>"</button>').text(places[index].name);
        button.attr('class', 'place btn-large #26c6da cyan lighten-1');
        button.data('index',{ index: index})
        button.click(function(){
            $('.place').removeAttr('style');
            $(this).css("border-style", "inset");
            objective = places[$(this).data('index').index].position;
        })

        index++;
        $('#place-buttons').append(button);
        if (index >= places.length-1) {
            break;
        }
    }
    if(index < places.length){
        var button = $('<button></button>').append('<i class="material-icons">arrow_forward</i>');
        button.attr('class', 'btn-large green');
        button.attr('id', 'next_page');
        button.click(function(){
            next_page_places();
        });
        $('#place-buttons').append(button);
    }
    var button = $('<button></button>').text('GO');
    button.attr('class', 'btn-large red accent-4');
    button.attr('id', 'go');
    button.click(function(){
        map_navigation.set_goal(objective);
    });
    $('#place-buttons').append(button);
}
