Janus.init({
   debug: true,
   dependencies: Janus.useDefaultDependencies(), // or: Janus.useOldDependencies() to get the behaviour of previous Janus versions
   callback: function() { console.log("Janus inicializado") }
});

var janus = new Janus(
{
    server: 'http://127.0.0.1:8088/janus',
    success: function() {
            janus.attach(
            {
                plugin: "janus.plugin.videoroom",
                success: function(pluginHandle) {
                      videoroom = pluginHandle;
                      videoroom.send({"message":{
                        "request" : "join",
                        "ptype" : "publisher",
                        "room" : 1234,
                      }});
                },
                error: function(cause) {
                      console.log("Error:", cause);
                },
                consentDialog: function(on) {
                      console.log("dialog",on);
                },
                onmessage: function(msg, jsep) {
                        // We got a message/event (msg) from the plugin
                        // If jsep is not null, this involves a WebRTC negotiation
                        // Handle msg, if needed, and check jsep
                        console.log("MENSAJE",msg);
                        var event = msg["videoroom"];
                        if(jsep !== undefined && jsep !== null) {
                          videoroom.handleRemoteJsep({jsep: jsep});
                        }
                        else if(event === "joined") {
                          videoroom.createOffer(
                        	{
                            success: function(jsep) {
                              	var publish = { "request": "publish", "audio": true, "video": true };
                                videoroom.send({"message": publish, "jsep": jsep});
                            }
                          });

                        }
                        else if(event === "event") {
                          if(msg["publishers"] !== undefined){

                                  janus.attach(
                                  {
                                      plugin: "janus.plugin.videoroom",
                                      success: function(pluginHandle) {
                                            videoroom = pluginHandle;
                                            videoroom.send({"message":{
                                              "request" : "join",
                                              "ptype" : "subscriber",
                                              "room" : 1234,
                                              "feed" : msg["publishers"][0].id,
                                            }});
                                      },
                                      error: function(cause) {
                                            console.log("Error:", cause);
                                      },
                                      onremotestream: function(stream) {
                                        console.log("hola")
                                            var video = document.querySelector("#remote");
                                            video.srcObject = stream;
                                      },
                                      oncleanup: function() {
                                            console.log("PeerConnection with the plugin closed");
                                      },
                                      detached: function() {
                                            console.log("detached");
                                      },
                                      onmessage: function(msg, jsep) {
                                          var event = msg["videoroom"];
                                          if(jsep !== undefined && jsep !== null) {
                                            videoroom.createAnswer(
                                            {
                                              jsep: jsep,
                                              media: { audioSend: false, videoSend: false },
                                              success: function(jsep) {
                                                  var subscribe = { "request": "start" };
                                                  videoroom.send({"message": subscribe, "jsep": jsep});
                                              },
                                              error: function(error) {
                                								console.log("ERROR",error);
                                							}
                                            });
                                          }

                                      },
                                      onlocalstream: function(stream) {
                                				// The subscriber stream is recvonly, we don't expect anything here
                                			},
                                  });

                          }
                          else {
                            console.log("EVENT ELSE", msg);
                          }
                        }
                        else {
                          console.log("HOLAAAAAAA",msg);
                        }
                },
                onlocalstream: function(stream) {
                      var video = document.querySelector("#local");
                      video.srcObject = stream;
                },
                onremotestream: function(stream) {
                },
                oncleanup: function() {
                      console.log("PeerConnection with the plugin closed");
                },
                detached: function() {
                      console.log("detached");
                }
            });
    },
    error: function(cause) {
            console.log("Error: ", cause);
    },
    destroyed: function() {
            console.log("Destroyed");
    }
});
