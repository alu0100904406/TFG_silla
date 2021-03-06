class Navigation {
  constructor(url_ros) {

    this.position;
    this.goal;

    this.actual_path_message = null;

    this.scale_width;
    this.scale_heigth;
    this.total_zoom = 0;

    this.ros = new ROSLIB.Ros({
      url : 'ws:' + window.location.hostname + ':9090'//Conexion a rosbridge
    });

    this.ros.on('connection', function() {
        this.conectado = true;
    });

    this.ros.on('close', function() {
        this.conectado = false;
    });

    this.ros.on('error', function(error) {
        this.conectado = false;
        console.log(error)
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
    this.path_state = false;
    this.switch_path();

    this.goal_mode = true;
    this.place_mode = false;
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

    this.velTopic = new ROSLIB.Topic({
        ros         : this.ros,
        name        : '/cmd_vel',
        messageType : 'geometry_msgs/Twist'
    });

    this.stopTopic = new ROSLIB.Topic({
        ros         : this.ros,
        name        : '/move_base/cancel',
        messageType : 'actionlib_msgs/GoalID'
    });

    this.statusTopic = new ROSLIB.Topic({
        ros         : this.ros,
        name        : '/move_base/status',
        messageType : 'actionlib_msgs/GoalStatusArray'
    })
  }

  _set_marker_on_map(){
    this.initScaleSet = false;
    this.gridClient.rootObject.addChild(this.robotMarker);
    this.poseTopic.subscribe(function(message) {

      this.position = message.pose.pose;

      // Orientate the marker based on the robot's pose.
      this.robotMarker.x = this.position.position.x;
      this.robotMarker.y = -this.position.position.y;

      if (!this.initScaleSet) {
        this.robotMarker.scaleX = 1.0 / this.viewer2D.scene.scaleX;
        this.robotMarker.scaleY = 1.0 / this.viewer2D.scene.scaleY;
        this.initScaleSet = true;
      }
      this.robotMarker.rotation = this.viewer2D.scene.rosQuaternionToGlobalTheta(message.pose.pose.orientation);
      this.robotMarker.visible = true;
    }.bind(this));
  }

  get_scene(){
    return this.viewer2D.scene
  }

  get_ros_position(x, y){
    var place_pose = this.viewer2D.scene.globalToRos(x, y);
    return { x: place_pose.x, y: place_pose.y }                      
  }

  set_dblclick_event(listener_function){ 
    this.dbclick_listener = listener_function;
    this.viewer2D.scene.on('dblclick', this.dbclick_listener);
  }

  set_click_event(listener_function){
    this.click_listener = listener_function;
    this.viewer2D.scene.on('click', this.click_listener);
  }

  remove_click_event(){
    this.viewer2D.scene.removeEventListener(click, this.click_listener);
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
      this.gridClient.rootObject.addChild(this.path);
      this._set_marker_on_map();
      this.viewer2D.shift(this.gridClient.currentGrid.pose.position.x, this.gridClient.currentGrid.pose.position.y);
      this.scale_width = this.gridClient.currentGrid.width;
      this.scale_heigth = this.gridClient.currentGrid.height;
      this.zoom(0);
      $(".progress").css("visibility", "hidden");
      $("#panel").css("visibility", "visible");
      $("canvas").css("background-color", "#7F7F7F");//QUITAR
    }.bind(this));
  }

  set_goal(position){
      var goal_message = new ROSLIB.Message({
        header:
        {
          frame_id: "map"
        },
        pose:
        {
          position: position,
          orientation: {x:0, y:0, z:0, w: 1.0}
        }
      });

      this.goal = goal_message.pose
      this.goalTopic.publish(goal_message);
  }

  switch_path(){
    if(this.path_state === false){
      this.path_state=true;
      this.path.setPath(this.actual_path_message);
      this.pathTopic.subscribe(function(message) {
        this.actual_path_message = message;
        this.path.setPath(this.actual_path_message);
      }.bind(this));
    }
    else {
      this.path_state=false;
      this.path.setPath(null);
      this.pathTopic.unsubscribe();
    }
  }

  zoom(zoom){
    //Calcular this.zoom_porcentage?
    this.total_zoom = this.total_zoom + zoom;
    this.viewer2D.scaleToDimensions(this.scale_width + this.total_zoom, this.scale_heigth + this.total_zoom);
  }

  subscribe_speed(listener_function){
    this.velTopic.subscribe(listener_function)
  }

  stop(){
    this.clear_path()
    this.stopTopic.publish({});
  }

  clear_path(){
    this.actual_path_message = null;
    this.path.setPath(null);
  }

  shift_map(x,y){
    this.viewer2D.shift(x,y);
  }

  set_place_marker(pos,name){
    var polygon = new ROS2D.PolygonMarker({
      pointCallBack : function(){
        if (confirm("¿Eliminar " + name + "?")) {
          this.viewer2D.scene.removeChild(polygon);
          $.ajax({
            url: '/place',
            type: 'DELETE',
            contentType: 'application/json',
            data: JSON.stringify({ name: name})
          });
        }
      }.bind(this),
      pointSize: 5
    });
    polygon.addPoint(pos); 
    this.viewer2D.scene.addChild(polygon);
  }
}
