/**
 Consumer
 Note: Before use dev.pinchproject.com domain, make sure, that you add alias 127.0.0.1 to hosts file.
 */


var sys = require('sys'),
    express = require('express'),
    http = require('https'),
    fs = require('fs'),
    url = require('url'),
    qs = require('querystring'),
    request = require('request'), //to do easier request to server
    OAuth = require('oauth').OAuth,
    app = express();
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({
    secret:"it's a secret, nobody should know"
}));
app.set('view engine', 'ejs');              //use template engine EJS
app.set('views', __dirname + '/views');
app.set('view options', {layout:false}); //its defines configuration options that are passed to every template when rendering a view


consumer = new OAuth('http://localhost:1989/oauth/request_token',
    'http://localhost:3000/oauth/access_token',
    'anonymous', 'anonymous', '1.0A',
    'https://dev.pinchproject.com:3000/oauth/dev.pinchproject.com/verify', 'HMAC-SHA1');
//urlRequest, urlAccess,consumerKey, consumerSecret, authorize callback, signature method

app.get('/', function (req, res) {
    res.render('index.ejs');
});

app.get('/test-oauth-server', function (req, res) {
    consumer.getOAuthRequestToken(function (error, oauth_token, oauth_token_secret, results) {
        if (error) {
            res.writeHead(200, { 'Content-Type':'text/html' });
            res.write('Error in request: ' + sys.inspect(error));
            res.end();
        } else {
            res.writeHead(302, { Location:'https://dev.pinchproject.com:4000/oauth/authorize?oauth_token=' +
                oauth_token});
            var tok = {oauth_token:oauth_token, oauth_token_secret:oauth_token_secret};
            req.session['oauth-token'] = tok;

            res.end();
        }
    });
});

app.get('/oauth/dev.pinchproject.com/verify', function (req, res) {
    consumer.getOAuthAccessToken(req.session['oauth-token'].oauth_token,
        req.session['oauth-token'].oauth_token_secret,
        url.parse(req.url, true).query.oauth_verifier,
        function (error, oauth_access_token, oauth_access_token_secret) {
            if (error === null) {
                req.session.oauth_access_token = oauth_access_token;
                req.session.oauth_access_token_secret = oauth_access_token_secret;

                res.redirect('https://dev.pinchproject.com:3000/oauth/protected-resource/gamelist/?p=1&oauth_token=' +
                    oauth_access_token + '&oauth_token_secret=' +
                    oauth_access_token_secret);


            } else {
                res.writeHead(500, { 'Content-Type':'text/html' });
                res.write('Error: ' + sys.inspect(error));
                res.end();
            }
        });

});


app.get('/oauth/protected-resource/gamelist/', function (req, res) {
    var query = qs.parse((url.parse(req.url)).query);
    var params = {};
    console.log('ACCESS to protected resource\n');
    params = query;

    request('https://dev.pinchproject.com:4000/oauth/protected-resource/gamelist/?p=' + params.p + '&oauth_token=' +
        params.oauth_token + '&oauth_token_secret=' +
        params.oauth_token_secret, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.write(body); //in body, there's what the server send
            res.end();

        }
    })
});


app.listen(1992);//pour la création d'un serveur https (mais attention, il faut spécifiquement spécifier que c'est un url HTTPS!!!!!!).