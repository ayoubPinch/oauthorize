///////Express configuration///////
var express = require('express'),
    app = express.createServer(),
    passport = require('passport'),
    oauthorize = require('oauthorize'),
    login = require('connect-ensure-login'),
    oauth = require('./oauth');
app.set('view engine', 'ejs');
app.use(express.logger());
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({ secret:'keyboard cat' }));

app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.errorHandler({ dumpExceptions:true, showStack:true }));


var server = oauthorize.createServer();


app.post('/oauth/request_token',
    passport.authenticate('consumer', { session:false }),
    server.requestToken(function (client, callbackURL, done) {
        var token = utils.uid(8)
            , secret = utils.uid(32)

        var t = new RequestToken(token, secret, client.id, callbackURL);
        t.save(function (err) {
            if (err) {
                return done(err);
            }
            return done(null, token, secret);
        });
    }));

app.post('/oauth/access_token',
    passport.authenticate('consumer', { session:false }),
    server.accessToken(
        function (requestToken, verifier, info, done) {
            if (verifier != info.verifier) {
                return done(null, false);
            }
            return done(null, true);
        },
        function (client, requestToken, info, done) {
            if (!info.authorized) {
                return done(null, false);
            }
            if (client.id !== info.clientId) {
                return done(null, false);
            }

            var token = utils.uid(32)
                , secret = utils.uid(128)
            var t = new AccessToken(token, secret, info.userId, info.clientId);
            t.save(function (err) {
                if (err) {
                    return done(err);
                }
                return done(null, token, secret);
            });
        }
    ));

app.get('/dialog/authorize',
    login.ensureLoggedIn(),
    server.userAuthorization(function (requestToken, done) {
        RequestToken.findOne(requestToken, function (err, token) {
            if (err) {
                return done(err);
            }
            Clients.findOne(token.clientId, function (err, client) {
                if (err) {
                    return done(err);
                }
                return done(null, client, token.callbackUrl);
            });
        });
    }),
    function (req, res) {
        res.render('dialog', { transactionID:req.oauth.transactionID,
            client:req.oauth.client, user:req.user });
    });

app.post('/dialog/authorize/decision',
    login.ensureLoggedIn(),
    server.userDecision(function (requestToken, user, done) {
        RequestToken.findOne(requestToken, function (err, token) {
            if (err) {
                return done(err);
            }
            var verifier = utils.uid(8);
            token.authorized = true;
            token.userId = user.id;
            token.verifier = verifier;
            token.save(function (err) {
                if (err) {
                    return done(err);
                }
                return done(null, verifier);
            });
        });
    }));

app.get('/api/userinfo',
    passport.authenticate('token', { session:false }),
    function (req, res) {
        res.json(req.user);
    });

app.listen(1989);
console.log("Server listen on port 1989")