const express = require('express');

const app = express();
const port =  8080;
const http = require('http').Server(app)
var io = require('socket.io')(http);


http.listen(8080);

app.use(express.static(__dirname));

app.get("/", function(req, res){
    res.sendFile(__dirname + "/cuidador.html");
});

io.on('connection', function(socket){
    console.log('an user connected');
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
    socket.on('holacuidador', function(msg){
        console.log('message: ' + msg);
    });
});


