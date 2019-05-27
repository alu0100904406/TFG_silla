var map_navigation;

map_navigation = new Navigation();
$.get("/places", function(data, status){
    for(const place in data.places){
        var button = $('<button>"</button>').text(data.places[place].name);
        button.click(function(){
            map_navigation.set_goal(data.places[place].position);
        })
        $('#place-buttons').append(button);
    }
});

var socket = io({ query: "tipo=chair_user" });
socket.on('carer_calling',() => { 
    socket.emit('response');
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

