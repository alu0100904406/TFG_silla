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
        server: '/janus',
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
