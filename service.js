const opn = require('opn');
const http = require('http');
const https = require('https');
const querystring = require('querystring');
const url = require('url');
const fs = require('fs');

const authorizationCodeURL = 'https://accounts.spotify.com/authorize?client_id=aaac59d05bb04b9098978499f3de06cf&response_type=code&scope=user-read-private%20user-read-currently-playing%20user-modify-playback-state%20user-read-playback-state&redirect_uri=http://localhost&state=756'
var authCode = null;

var accessToken = null;
var refreshToken = null;
var tokenType = null;
var tokenTimeout = null;

var nowPlaying = null;

var state = null;

// ############################# Read saved state ###############################


// Gets access + refresh token from authorization code
var postData = {
    'grant_type':'authorization_code',
    'code': null,
    'redirect_uri':'http://localhost',
    'client_id':'aaac59d05bb04b9098978499f3de06cf',
    'client_secret':'826d9d774b654fabb11585bff03427b1'
};

var optionsAccessToken = {
    host: 'accounts.spotify.com',
    port: 443,
    path:'/api/token',
    method:'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': 0,        
    }
};

fs.readFile('state.dat',null, (e, data) => {
    if(e) throw e;
    state = JSON.parse(data);
    if(state != null){
        authCode = state['authorization_code'];
        console.log(authCode);
        accessToken = state['access_token'];
        refreshToken = state['refresh_token'];
        tokenType = state['token_type'];

        postData.code = authCode;
        optionsAccessToken.headers['Content-Length'] = Buffer.byteLength(querystring.stringify(postData));
    }
});

function getAccessToken(callback) {
    var accessTokenRequest = https.request(optionsAccessToken, (authCallback) => {
        console.log('Status: ', authCallback.statusCode);
        var body = [];
        authCallback.on('data', (data) => { body.push(data); });
        authCallback.on('end', () => {
            var message = Buffer.concat(body);
            var details = JSON.parse(message);
            console.log('Access code return: ', message.toString());

            if(authCallback.statusCode == 400){
                var errorDescription = details['error_description'];
                console.log('Could not get Tokens: ', errorDescription);
                if(errorDescription == 'Authorization code expired'){
                    // Need to request new auth code
                    opn(authorizationCodeURL);
                }
                return callback('error 400');
            }

            if(message.byteLength != 0){
                
                accessToken  = details['access_token'];
                refreshToken = details['refresh_token'];
                tokenType    = details['token_type'];
                tokenTimeout = details['expires_in'];

                console.log('access token: ', accessToken);
                console.log('refresh token: ', refreshToken);
                console.log('token type: ', tokenType);
                console.log('expires in: ', tokenTimeout);

                state['access_token'] = accessToken;
                state['refresh_token'] = refreshToken;
                state['token_type'] = tokenType;
                
                fs.writeFile('state.dat', JSON.stringify(state));

                return callback('done');
            }

            return callback('no data');
            
        });

        authCallback.on('error', (error) => {
            console.log('ERROR: ', error.message);
        });        
    });
    
    accessTokenRequest.write(
        querystring.stringify(postData));
    accessTokenRequest.end();

    accessTokenRequest.on('error', (error) => {
        console.log('Error: ', error.message);
        return callback('error ' + error.message);
    });

    
}

function getNowPlaying(callback){
    // try request the current song
    var req = https.request({
        host: 'api.spotify.com',
        port: 443,
        path: '/v1/me/player',
        headers: {
            'Authorization' : 'Bearer ' + accessToken
        }
    }, (res) => {
        console.log('STATUS: ' + res.statusCode);
        //console.log('HEADERS:' +JSON.stringify(res.headers));

        var body = [];

        res.on('data', function(part) {
            body.push(part);
        });
        
        res.on('end', function() {
            var message = Buffer.concat(body);
            
            console.log('BODY: ' + message);
            if(message.byteLength > 0){
                nowPlaying = JSON.parse(message);
                switch(res.statusCode){
                    // Check case of no players available
                    case 200:
                        if(message.byteLength == 0){
                            console.log('200: empty body');
                        }
                        break;
                    case 202:
                        console.log('response size: ', message.byteLength);
                    case 401:
                        console.log(nowPlaying['error']['message']);
                        break;
                    case 402:
                        console.log(nowPlaying['error']['message']);
                        break;
                }
                
                return callback(nowPlaying);
            } else {
                console.log('empty response');
                return callback('empty response == no device?');
            }   
        })
    });
    
    //req.write(postData);
    req.end();


    req.on('error', function(e) {
        console.log('ERROR: ' + e.message);
    });
}

// ################################## Server ####################################
const server = http.createServer(function(req,response){
    console.log(req.url);
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    switch(req.url){
        case '/authCode':            
            response.end(authCode);
            break;
        case '/accessCode':
            if(accessToken == null){
                getAccessToken((token) => {
                    console.log(token);
                    response.end(token);
                });
            } else
                response.end(accessToken);
            break;
        case '/refreshToken':
            response.end(refreshToken);
            break;
        case '/nowPlaying':
            getNowPlaying((song) => {
                console.log("now playing: ", song);
                var item = song['item'];
                if(item != null){
                    var album = item['album'];
                    var artists = item['artists'];

                    var smallSongInfo = {
                        'progress'      : song['progress_ms'],
                        'duration'      : item['duration_ms'],
                        'song_title'    : item['name'],
                        'artist'        : artists['0']['name'],
                        'album'         : album['name'],
                        'album_art'     : album['images']['0']['url']
                    };
                    
                    response.end(JSON.stringify(smallSongInfo));
                } else {
                    response.end("No connected device");
                }
            });
            break;       
    }

    if(req.url.startsWith('/?')){
        console.log('New Authorization code requested');
        var q = url.parse(req.url, true).query;
        //console.log('Code: ', q.code);
        authCode = q.code;
        postData.code = authCode;
        state['authorization_code'] = authCode;
        fs.writeFile('state.dat', JSON.stringify(state));
        response.end();
    }    
    
}).listen(80);

server.on('error', (e) => console.log('Error: ', e.message));