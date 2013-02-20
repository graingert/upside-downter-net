var http = require("http");
var https = require("https");
var url = require("url");
var zlib = require("zlib");

http.createServer(function(request, response) {
    console.log(request.url);
    var parsed = url.parse(request.url);
    //request.headers["accept-encoding"] = "";
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
    var in_buffer;
    var out_buffer;
    proxy_request.on('response', function (proxy_response) {
        response.writeHead(proxy_response.statusCode, proxy_response.headers);

        switch (proxy_response.headers['content-encoding']) {
            case 'gzip':
                in_buffer = zlib.createGunzip();
                proxy_response.pipe(in_buffer);
                out_buffer = zlib.createGzip();
                out_buffer.pipe(response);
                break;
            case 'deflate':
                in_buffer = zlib.createInflate();
                proxy_response.pipe(in_buffer);
                out_buffer = zlib.createDeflate();
                out_buffer.pipe(response);
                break;
            default:
                var in_buffer = proxy_response;
                var out_buffer = response;
                break;
        }

        in_buffer.on('data', function(chunk) {
            console.log(chunk)
            out_buffer.write(chunk);
         });
        in_buffer.on('end', function() {
            out_buffer.end();
        });
    });
    request.pipe(proxy_request);
}).listen(8080);
