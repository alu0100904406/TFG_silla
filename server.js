var express = require('express');
const rosnodejs = require('rosnodejs');
const std_msgs = rosnodejs.require('nav_msgs').msg;
var app = express();

var port = 3000;

/*//function listener() {
  // Register node with ROS master
  rosnodejs.initNode('/map_web')
    .then((rosNode) => {
      // Create ROS subscriber on the 'chatter' topic expecting String messages
      let sub = rosNode.subscribe('/map', nav_msgs.OccupancyGrid,
        (data) => { // define callback execution
          rosnodejs.log.info('I heard: [' + data.data + ']');
        }
      );
    });
//}*/


app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.listen(port, function () {
  console.log('Server listening on port ' + port + '!');
});
