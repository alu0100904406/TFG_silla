const express = require('express');

const app = express();
const port =  8080;
const http = require('http').Server(app);
var io = require('socket.io')(http);

http.listen(port);

app.use(express.static(__dirname + "/public"));

app.get("/carer", function(req, res){
    res.sendFile(__dirname + "/html/carer/index.html");
});

app.get("/chair", function(req, res){
    res.sendFile(__dirname + "/html/chair/index.html");
});

var chair_user_id;
var carer_id;

io.on('connection', function(socket){
    if(socket.handshake.query.tipo === 'carer'){
        carer_id = socket.id;

        socket.on('call', () => {
            io.to(chair_user_id).emit('carer_calling');
        });
    }
    else if(socket.handshake.query.tipo === 'chair_user'){
        chair_user_id = socket.id;

        socket.on('response', () => {
            io.to(carer_id).emit('chair_response');
        });
    }
});


