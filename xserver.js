// mongod --dbpath=/home/mark/Desktop/eaas/data --port 27018

/*
var http = require('http');

var server = http.createServer(function (req, res) {
    res.end("Hello World!");
});
server.listen(3000);                 // listen on all ip addresses
    //.listen(3000, '54.183.157.4'); // listen to specific ip address
    //.listen(3000, '127.0.0.1');    // listen only to local host

console.log('Server running at http://127.0.0.1:3000/');

*/

var tokens = {};

//console.log(host, context);
var http = require('http');
var uuid = require('node-uuid');
var Cookies = require('cookies');
var _ = require('underscore');

var server = http.createServer(function (req, res) {
    console.log('request received: ' + (new Date()));

    var cookies = new Cookies(req, res);
    var host_token = cookies.get('host_token');
    host_token = tokens[host_token];
    if(!host_token){
        host_token = uuid.v4();
        tokens[host_token] = {id:host_token,type:'Token',authenticated:false,issDT:Date.now()};
        cookies.set('host_token',host_token);
        host_token = tokens[host_token];
    }


    var verb = req.method;
    var url = req.url;
    var postData; // todo: post data

    var ctx = _.clone([]);
    var args = {req:req,res:res,token:host_token,verb:verb,url:url};
    // host.evalHost(['`', globalHandler, args], ctx, function(rslt){
    //     rslt = host.utils.toJSON(rslt);
    //     rslt = JSON.stringify(rslt);
    //     res.end(rslt);
    // });
    res.end('hello world 2');
});
var port = 3000;
server.listen(port);
