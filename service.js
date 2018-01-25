/* response for current song.

item {
    Album{
        Artists{
            #Can probably be multiple?
            0{
                name:
            }
        }
        Images{
            #0 is the largest
            0{
                height:
                url:
                width:
            }
            1{}
            2{}
            #ablum name
            name:
        }
    }
    Artists{
        #Can probably be multiple?
        0{
            name:
        }
    }

    #song name
    name:
}
*/



const http  = require('http');
const https = require('https');
var querystring = require('querystring');

var authCode = null;
var accessCode = null;
var refreshToken = null;


// Gets access + refresh token from code
var postData = querystring.stringify({
    'grant_type':'authorization_code',
    'code': authCode,
    'redirect_uri':'http://localhost',
    'client_id':'aaac59d05bb04b9098978499f3de06cf',
    'client_secret':'826d9d774b654fabb11585bff03427b1'
});

var optionsAccessToken = {
    host: 'accounts.spotify.com',
    port: 443,
    path:'/api/token',
    method:'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),        
    }
};


// Uses access code to query API for current song
var queryNowPlaying = {
    host: 'api.spotify.com',
    port: 443,
    path: '/v1/me/player',
    headers: {
        'Authorization' : 'Bearer ' + accessCode
    }
}


function getNowPlaying(){
    // try request the current song
    var req = https.request(queryNowPlaying, (res) => {
        console.log('STATUS: ' + res.statusCode);
        if(res.statusCode == 402){

        }
        //console.log('HEADERS:' +JSON.stringify(res.headers));

        var body = [];
        res.on('data', function(part) {
            body.push(part);
        }).on('end', function() {
            var message = Buffer.concat(body);
            console.log('BODY: ' + message);
            return message;
        })
    });
    
    req.write(postData);
    req.end();


    req.on('error', function(e) {
        console.log('ERROR: ' + e.message);
    });
}
const server = http.createServer(function(req,response){
    console.log(req.url);
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    switch(req.url){
        case '/authCode':
            response.end(authCode);
            break;
        case '/accessCode':
            response.end(accessCode);
            break;
        case '/refreshToken':
            response.end(refreshToken);
            break;
        case '/nowPlaying':
            response.end(getNowPlaying());
        default:
            response.end("hullo there");
    }
    
    
}).listen(80);

server.on('error', (e) => console.log('Error: ', e.message));