const express = require('express');
var bodyParser = require("body-parser");

const app = express();
const port =  8080;

const http = require('http').Server(app);
var io = require('socket.io')(http);

var sqlite3 = require('sqlite3');
var db = new sqlite3.Database(__dirname + '/places.db');

db.run("CREATE TABLE IF NOT EXISTS 'Places' (\
    'Name' varchar(45) NOT NULL ,\
    'pose_x' numeric NOT NULL ,\
    'pose_y' numeric NOT NULL ,\
    PRIMARY KEY ('Name'))");

http.listen(port, () => { console.log("Listening on port: " + port);  });

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/carer", function(req, res){
    res.sendFile(__dirname + "/html/carer/index.html");
});

app.get("/chair", function(req, res){
    res.sendFile(__dirname + "/html/chair/index.html");
});

app.get("/graphs", function(req, res){
    res.sendFile(__dirname + "/html/graphs.html");
});

app.get("/places", function(req, res){
    db.all('SELECT * FROM Places', [], (err, rows) => {
        if (err) {
          res.sendStatus(500);
        }
        else {
            var json_places = { places: []}
            rows.forEach((row) => {
                var place = {
                    name: row.Name,
                    position: {
                        x: row.pose_x,
                        y: row.pose_y
                    }
                }
                json_places.places.push(place);
            });
            res.json(json_places);
        }
    });
});

app.post("/save_place", function(req, res){
    db.run("INSERT INTO 'Places' (Name, pose_x, pose_y) values('" + req.body.name + "'," 
                                        + req.body.position.x + ","
                                        + req.body.position.y+ ")",
            (err) => {  
                if (err) {
                    res.sendStatus(409);//MANEJAR MEJOR ESTO
                }
                else {
                    res.sendStatus(201);
                }
            }
    );
});

app.delete('/place', function(req, res){
    db.run("DELETE FROM 'Places' WHERE (Name ='" + req.body.name + "')",//USAR DATA BINDINGS EN VEZ DE CONCATENACION
            (err) => {  
                if (err) {
                    res.sendStatus(409);//MANEJAR MEJOR ESTO
                }
                else {
                    res.sendStatus(204);
                }
            }
    );
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

    socket.on('place_added', (place) => {
        io.to(chair_user_id).emit('place_added', place);
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


