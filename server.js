/**
 * Created by dietn on 18/12/14.
 */

var express = require('express');
var server = new express();
var settings = require("./settings.json");
var route = require('./Routing/RouteHandler.js');
//serve static files
server.use("/Public", express.static(__dirname + '/Public'));



server.all('*',function(req,res){
    route.routeRequest(req,res);
});

var ip = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var port = process.env.OPENSHIFT_NODEJS_PORT || 3000;

server.listen(port,ip,function(){
    console.log('moviewatcher server started successfully');
});

 //run it on openshift https://github.com/openshift-quickstart/openshift-mongo-node-express-example/blob/master/server.js