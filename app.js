var http = require("http");
var https = require("https");
var url = require("url");
var zlib = require("zlib");

http.createServer(function(request, response) {
    console.log(request.url);
    var parsed = url.parse(request.url);
    request.headers["accept-encoding"] = "";
    var options = {
        "hostname": parsed.hostname,
        "path": parsed.path,
        "method": request.method,
        "headers": request.headers
    };

    if(parsed.port){
        options.port = parsed.port;
    }

    var proxy_request;
    if(parsed.protocol == "https:"){
        proxy_request = https.request(options);
    } else {
        proxy_request = http.request(options);
    }
    proxy_request.on('response', function (proxy_response) {
        response.writeHead(proxy_response.statusCode, proxy_response.headers);
        proxy_response.pipe(response)
    });
    request.pipe(proxy_request);
}).listen(8080);
