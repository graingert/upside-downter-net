var http = require("http");
var https = require("https");
var url = require("url");
var zlib = require("zlib");
var BufferStream = require("bufferstream");

http.createServer(function(request, response) {
    console.log(request.url);
    var parsed = url.parse(request.url);
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
    var middle_man = new BufferStream({encoding:"binary"});
    var out_buffer;
    proxy_request.on('response', function (proxy_response) {
        response.writeHead(proxy_response.statusCode, proxy_response.headers);

        switch (proxy_response.headers['content-encoding']) {
            case 'gzip':
                proxy_response.pipe(zlib.createGunzip()).pipe(middle_man);
                out_buffer = zlib.createGzip();
                out_buffer.pipe(response);
                break;
            case 'deflate':
                proxy_response.pipe(zlib.createInflate()).pipe(middle_man);
                out_buffer = zlib.createDeflate();
                out_buffer.pipe(response);
                break;
            default:
                proxy_response.pipe(middle_man);
                out_buffer = response;
                break;
        }
        middle_man.on('data', function (chunk){
            console.log(chunk);
            out_buffer.write(chunk, 'binary'); //breaks for zlib, because of slightly different stream interfaces
        });
        middle_man.on('end', function(){
            response.end();
        });
    });
    request.pipe(proxy_request);
}).listen(8080);
