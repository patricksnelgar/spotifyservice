
const http  = require('http');
const https = require('https');
var querystring = require('querystring');


// Gets access + refresh token from code
var postData = querystring.stringify({
    'grant_type':'authorization_code',
    'code':'AQCtQxyBAmi9Runkpr1E-aGIX3JLjWiBEH0AX6zV90Vony3ElDcB77vorfkNYCFFjsZ8PmgcZs2kJgaPW6GncgMEf81v0bxBt5b3olNIe_TzzyF_gpXPem7iUL6IXJBuZyazVVHIvYHS59s2OKfyn_B7PjQWQ6nflm0LiMhpehaY04OtsPny6UOOMusUAlP0z2KmjS9sggKkCLoMZAI33do7Se4I9WKm8Fwkn1aU6cojtJi0xYeXSHnUcvudEVUiN6mOEYj3jGb1awG-THOvob6sGEpEZ-FS1TeJ1eSsBhe2vUvlWfSdazUAHdI',
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
var query = {
    host: 'api.spotify.com',
    port: 443,
    path: '/v1/me/player',
    headers: {
        'Authorization' : 'Bearer BQCg3FHaEr7DNDs_oe465AiDKxOHZkfjAfmX40ajyl0aoNWR7i0mk2gOC13NDkcBX77iN6Xr0lQZWaP2bDKUpgv-sWxInDG-bQBjeEUCwiv68_NOgTeoQSoqZDB45ZG4lAhzxtY5NI33mIWz5Al9mU-TUix4AyWqArw'
    }
}

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


var req = https.request(query, (res) => {
            console.log('STATUS: ' + res.statusCode);
            //console.log('HEADERS:' +JSON.stringify(res.headers));

            var body = [];
            res.on('data', function(part) {
                body.push(part);
            }).on('end', function() {
                var message = Buffer.concat(body);
                console.log('BODY: ' + message);
            })
});
req.write(postData);
req.end();


req.on('error', function(e) {
    console.log('ERROR: ' + e.message);
});
