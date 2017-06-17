
var _ = require('underscore');
var utils = require('./utils.js');
var http = require('http');
var uuid = require('uuid');
var Cookies = require('cookies');
var fs = require('fs');

var serve = {};
module = module || {};
module.exports = serve;

var sessionsFileName = "sessions.json";
var sessions = null;
try{
    var s = fs.readFileSync(sessionsFileName, "utf8");
    s = utils.dataFromString(s);
    sessions = s;
}catch (e){
    sessions = {};
}
function sessionsSave(){
    fs.writeFileSync(sessionsFileName,utils.dataToString(sessions),"utf8");
}

//var globalHandler = expr[0];
var port = 3000;

var server = http.createServer(function (req, res) {

    var cookies = new Cookies(req, res);
    var sid = cookies.get('sid');
    var session = sessions[sid];
    if(!session){
        sid = uuid.v4();
        sessions[sid] = {id:sid,authenticated:false,issDT:Date.now()};
        cookies.set('sid',sid);
        session = sessions[sid];
        sessionsSave();
    }

    var verb = req.method;
    var url = req.url;

    console.log(session.id + " " + verb + " " + url);

    if(verb === "GET"){
        if(url.startsWith("/public")){
            var file = fs.readFileSync("." + url);
            if(url.toLowerCase().endsWith(".css"))
                res.writeHeader(200, {"Content-Type": "text/css"});
            else
                res.writeHeader(200, {"Content-Type": "text/html"});
            return res.end(file);
        }
        var appHtml = fs.readFileSync("./public/app.html", "utf8");
        res.writeHeader(200, {"Content-Type": "text/html"});
        return res.end(appHtml);
    }


    var postData; // todo: post data

    var ctx = _.clone(context);
    var args = {req:req,res:res,session:session,verb:verb,url:url};

    serve.host.evalHost(['`', globalHandler, args], ctx, function(rslt){
        if(!args.handled){
            rslt = utils.dataToString(rslt);
            if(rslt[0] === '<')
                res.writeHeader(200, {"Content-Type": "text/html"});
            res.end(rslt);
        }
    });
});
server.listen(port);
console.log('server listening on port ' + port);