const express = require('express');

const app = express();
const port =  8080;
const http = require('http').Server(app);
var io = require('socket.io')(http);

http.listen(port, () => { console.log("Listening on port: " + port);  });

app.use(express.static(__dirname + "/public"));

app.get("/carer", function(req, res){
    res.sendFile(__dirname + "/html/carer/index.html");
});

app.get("/chair", function(req, res){
    res.sendFile(__dirname + "/html/chair/index.html");
});

var chair_user_id;
var carer_id = null;

const carers_sockets = io.of('/carers');

carers_sockets.on('connection', function(socket){

    if(carer_id === null){
        socket.emit('available');
    }

    socket.on('care', () => {
        if(carer_id === null){
            carer_id = socket.id;

            socket.broadcast.emit('occupied');

            socket.on('call', () => {
                io.to(chair_user_id).emit('carer_calling');
            });

            socket.emit('carer');
        }
    });

    socket.on('stop_care', () => {
        carer_id = null;

        socket.broadcast.emit('available');   
        //Borrar listeners?     
    });

    socket.on('disconnect', () => {
        if (carer_id === socket.id) {
            carer_id = null;
            carers_sockets.emit('available');
        }
    });

});

io.on('connection', function(socket){
    if(socket.handshake.query.tipo === 'chair_user'){
        chair_user_id = socket.id;

        socket.on('response', () => {
            carers_sockets.to(carer_id).emit('chair_response');
        });
    }
});


