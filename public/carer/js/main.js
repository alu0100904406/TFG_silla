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

var janus = null;
var videoroomPublisher = null;
var videoroomSubscriber = null;
var participants = null;
var joined = false;
var publishing = false;
var listening = false;

Janus.init({
    debug: true,
    dependencies: Janus.useDefaultDependencies(),
    callback: function() { 
        attach();
    }
});

function attach(){
    janus = new Janus(
    {
        server: 'http://192.168.0.162:8088/janus',
        success: function() {
            janus.attach(
            {
                plugin: "janus.plugin.videoroom",
                success: function(pluginHandle) {
                    videoroomPublisher = pluginHandle;
                    videoroomPublisher.send({"message":{
                        "request" : "join",
                        "ptype" : "publisher",
                        "room" : 1234,
                    }});
                },
                error: function(cause) {
                    console.log("Error en attach en publisher:", cause);
                },
                onmessage: function(msg, jsep){
                    console.log("MENSAJE PUBLISHER", msg, jsep);
                    var event = msg["videoroom"];
                    
                    if(event === "joined") {
                        joined = true;
                        $("#publicar").css("visibility", "visible");
                        $("#subscribir").css("visibility", "visible");

                        if(msg["publishers"] != undefined && msg["publishers"].length > 0){
                            participants = msg["publishers"].map(participant => participant.id)
                        } 
                    }
                    else if(event === "event"){
                        if(msg["configured"]==="ok"){
                            publishing = true;
                        }
                        if(msg["publishers"] != undefined && msg["publishers"].length > 0){
                            if(participants != null){
                                participants = participants.concat(msg["publishers"].map(participant => participant.id));
                            }
                            else {
                                participants = msg["publishers"].map(participant => participant.id)
                            }
                            if(listening){
                                participants.forEach(function(id){
                                    addRemoteFeed(id);
                                });
                                participants.length = 0;
                            }
                        }
                    }
                    if(jsep !== undefined && jsep !== null) {
                        videoroomPublisher.handleRemoteJsep({jsep: jsep});
                    }
                },
                onlocalstream: function(stream){
                    var video = document.querySelector("#local");
                    video.srcObject = stream;
                }
            })
        },
        error: function(cause) {
            console.log("Error al inicializar: ", cause);
        },
        destroyed: function() {
            console.log("Destroyed");
        }
    });
}

function publicar(){
    if(!publishing){
        videoroomPublisher.createOffer(
        {
            success: function(jsep) {
                var publish = { "request": "publish", "audio": true, "video": true };
                videoroomPublisher.send({"message": publish, "jsep": jsep});
            },
            error: function(cause){
                console.error("Error en publicar:", cause)
            }
        });
    }
}

function subscribir(){
    listening = true;

    if(participants != null){
        participants.forEach(function(id){
            addRemoteFeed(id);
        });
        participants.length = 0;//USAR POP EN VEZ DE ESTO?
    }
}

function addRemoteFeed(id){
    janus.attach(
    {
        plugin: "janus.plugin.videoroom",
        success: function(pluginHandle) {
            console.log("EXITO?")
            videoroomSubscriber = pluginHandle;
            videoroomSubscriber.send({"message":{
                "request" : "join",
                "ptype" : "subscriber",
                "room" : 1234,
                "feed" : id,
            }});
        },
        error: function(cause) {
            console.log("Error en attach subscriber:", cause);
        },
        onmessage: function(msg, jsep){
            console.log("MENSAJE SUBSCRIBER", msg, jsep);
            var event = msg["videoroom"];
            
            if(event === "attached"){
                videoroomSubscriber.createAnswer(
                {
                    jsep: jsep,
                    media: { audioSend: false, videoSend: false },
                    success: function(jsep) {
                        var subscribe = { "request": "start" };
                        videoroomSubscriber.send({"message": subscribe, "jsep": jsep});
                    },
                    error: function(error) {
                    console.log("ERROR",error);
                    }
                });
            }
            else if(event === "event"){
                if(msg["started"]==="ok"){
                    listening = true;
                }
            }
            if(jsep !== undefined && jsep !== null) {
                videoroomSubscriber.handleRemoteJsep({jsep: jsep});
            }
        },
        onremotestream: function(stream){
            //ESTO SE LLAMA DOS VECES UNA PARA AUDIO Y OTRA PARA VIDEO.pOR ESO DA ERROR.S
            //var video = document.createElement("video");
            var video = document.querySelector("#remote");
            video.srcObject = stream;
            /*video.autoplay = true;
            $('#videos').append(video);*/
        }
    });
}

var socket = io('/carers');

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
