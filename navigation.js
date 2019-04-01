class Navigation {

  constructor() {
    this.ros = new ROSLIB.Ros({
      url : 'ws://localhost:9090'//Conexion a rosbridge
    });

    this.ros.on('connection', function() {
        this.conectado = true;
    });

    this.ros.on('close', function() {
        this.conectado = false;
    });

    this.ros.on('error', function() {
        this.conectado = false;
    });

    this.robotMarker = new ROS2D.NavigationArrow({
          size : 12,
          strokeSize : 1,
          fillColor : createjs.Graphics.getRGB(255, 128, 0, 1),
          pulse : true
    });
    this.robotMarker.visible = false;

    this._initialize_topics();

    this.path = new ROS2D.PathShape({ strokeColor: createjs.Graphics.getRGB(239, 48, 14, 0.66)});
    this.pathTopic.subscribe(function(message) {
        this.path.setPath(message);
        //path.setPath(null);
    }.bind(this));
  }

  _initialize_topics(){
    this.poseTopic = new ROSLIB.Topic({
        ros         : this.ros,
        name        : '/amcl_pose',//Topico
        messageType : 'geometry_msgs/PoseWithCovarianceStamped' //tipo del mensaje
    });

    this.goalTopic = new ROSLIB.Topic({
        ros: this.ros,
        name: '/move_base_simple/goal',
        messageType: 'geometry_msgs/PoseStamped'
    })

    this.pathTopic = new ROSLIB.Topic({
        ros         : this.ros,
        name        : '/move_base/NavfnROS/plan',//Topico
        messageType : 'nav_msgs/Path' //tipo del mensaje
    });
  }

  _set_marker_on_map(){
    var initScaleSet = false;
    this.gridClient.rootObject.addChild(this.robotMarker);
    this.poseTopic.subscribe(function(message) {
      //console.log(message.pose.pose.position.x, message.pose.pose.position.y);
      // Orientate the marker based on the robot's pose.
      this.robotMarker.x = message.pose.pose.position.x;
      this.robotMarker.y = -message.pose.pose.position.y;
      if (!initScaleSet) {
        this.robotMarker.scaleX = 1.0 / this.viewer2D.scene.scaleX;
        this.robotMarker.scaleY = 1.0 / this.viewer2D.scene.scaleY;
        initScaleSet = true;
      }
      this.robotMarker.rotation = this.viewer2D.scene.rosQuaternionToGlobalTheta(message.pose.pose.orientation);
      this.robotMarker.visible = true;
    }.bind(this));
  }

  _set_pose_controller(){
    this.viewer2D.scene.addEventListener('stagemouseup', function(event) {
      if (this.viewer2D.scene.mouseInBounds === true) {
				var pos = this.viewer2D.scene.globalToRos(event.stageX, event.stageY);
        var goal = new ROSLIB.Message({
          header:
          {
            frame_id: "map"
          },
          pose:
          {
            position: {x: pos.x, y: pos.y, z: 0.0},
            orientation: {w: 1.0}
          }
        });
        this.goalTopic.publish(goal);
      }
    }.bind(this));
  }

  set_map(divID){
    this.viewer2D = new ROS2D.Viewer({
       divID : divID,
       width : 500,
       height : 500
    });

    this.gridClient = new ROS2D.OccupancyGridClient({
      ros : this.ros,
      rootObject : this.viewer2D.scene
    });


    this.gridClient.on('change', function() {
      this.viewer2D.scaleToDimensions(this.gridClient.currentGrid.width, this.gridClient.currentGrid.height);
      this.viewer2D.shift(this.gridClient.currentGrid.pose.position.x, this.gridClient.currentGrid.pose.position.y);
      //$(".lds-dual-ring").remove()
      $("canvas").css("visibility", "visible");
      //console.log(viewer2D.scene.children);
      //viewer2D.scene.children[0].image.getContext('2d').drawImage(viewer2D.scene.children[0].image, 0, 0, 1000, 1000);
    }.bind(this));

    this._set_marker_on_map();
    this._set_pose_controller();
    this.gridClient.rootObject.addChild(this.path);
  }
}
