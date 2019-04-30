#!/bin/bash

function cdtfg(){
  cd $HOME/Escritorio/TFG
}

function tfg_sim(){
  roslaunch navigation example_navigation.launch
}

function tfg_rosbridge(){
  roslaunch rosbridge_server rosbridge_websocket.launch
}

function tfg_browser(){
  opera file:///home/cristian/Escritorio/TFG/index.html
}

function tfg_develop(){
  atom $HOME/Escritorio/TFG
  tfg_browser
}

function tfg_runjanus(){
	sudo /opt/janus/bin/janus -F /opt/janus/etc/janus/
}
