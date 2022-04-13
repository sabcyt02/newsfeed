var express = require('express');
var app = express();

app.use(express.json());

var cookieParser = require('cookie-parser');
app.use(cookieParser());

var monk = require('monk');
var db = monk('127.0.0.1:27017/assignment1');

app.use(express.static('public'), function(req, res, next) {
    req.db = db;
    next();
})

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/public/newsfeed.html");
});

app.get('/retrievenewslist', (req, res) => {

    var search = req.query.search;
    var idx = req.query.pageindex;

    var reply = {};
    var login = 0;

    if (req.cookies.userID) {
        login = 1;
    }

    if (search != "") {
        req.db.get('newsList').find({ "headline": { "$regex": search } }, { sort: { "time": -1 } }).then((docs) => {
            reply = {
                "login_status": login,
                "entries": docs.slice((idx - 1) * 5, idx * 5),
                "totalNum": docs.length
            }
            res.json(reply);
        })
    } else {
        req.db.get('newsList').find({}, { sort: { "time": -1 } }).then((docs) => {
            reply = {
                "login_status": login,
                "entries": docs.slice((idx - 1) * 5, idx * 5),
                "totalNum": docs.length
            }

            res.json(reply);
        })
    }
});

app.get('/displayNewsEntry', (req, res) => {
    var id = req.query.newsID;

    var txt = '<!DOCTYPE html><html>'
    txt = '<head> <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">  <link rel=\"stylesheet\" href=\"stylesheets/style.css\">';
    txt += '<script src=\'javascripts/script.js\'></script>';
    txt += '<body>';
    txt += '<a href=\'/\' class=\'col-1\'> <img src=\"/images/back.jpg\" width=\'60\' height=\'60\' id=\'arrow\'> </a> ';

    req.db.get('newsList').find({ '_id': monk.id(id) }).then((docs) => {
        if (docs != [] && docs != undefined && docs != "") {

            var doc = docs[0];
            txt += '<div class=\'col-2\'>';
            txt += '<div id=\'topNews\'>';
            txt += '<header><h1>' + doc.headline + '</h1>';
            txt += '<p>' + doc.time.toLocaleString('en-US', { hour12: false }) + '</p></header>';
            txt += '<p id=\'newsID\' style=\'visibility: hidden\'> ' + doc._id.toString() + '</p>';
            txt += '</div>';
            txt += '<p id=\'contentFeed\'>' + doc.content + '</p></br>';

            var ids = []

            for (var i = 0; i < doc.comments.length; i++) {
                ids.push(monk.id(doc.comments[i].userID));
            }

            db.get('userList').find({ '_id': { $in: ids } }).then((d) => {

                txt += '<div id=\'comments\'>';

                if (d) {
                    p = []
                    for (var i = 0; i < ids.length; i++) {
                        for (var j = 0; j < d.length; j++) {
                            if (d[j]._id.equals(ids[i])) {
                                p[i] = d[j];
                            }
                        }
                    }
                    for (var i = 0; i < ids.length; i++) {
                        txt += '<div id=\'comment1\'><img src=\"/' + p[i].icon + '\" width=\'50\' height=\'50\' class=\'img\'>';
                        txt += '<div id=\'person\'><p>' + p[i].name + '</p>';
                        if (i == 0) {
                            txt += '<p id=\'latest_time\' name=' + doc.comments[i].time + '>' + doc.comments[i].time.toLocaleString('en-US', { hour12: false }) + '</p></div></div>';
                        } else {
                            txt += '<p>' + doc.comments[i].time.toLocaleString('en-US', { hour12: false }) + '</p></div></div>';
                        }
                        txt += '<p>' + doc.comments[i].comment + '</p></br>';

                    }
                }
                txt += '</div>';
                txt += '<div id=\'user_comment\'>';
                if (req.cookies.userID) {
                    txt += '<input type=\'text\' id=\'comment_add\'>';
                    txt += '<button onclick=\'postComment()\'> post comment</button>';
                } else {
                    txt += '<input type=\'text\' id=\'comment_add\' disabled>';
                    txt += '<a href=\'/login?newsID=' + id + '\'><button>login to comment</button></a>';
                }
                txt += '</div></div>';


                txt += '</div class=\'col-3\'>';

                if (req.cookies.userID) {
                    db.get('userList').find({ '_id': monk.id(req.cookies.userID) }).then((d2) => {
                        if (d2) {
                            txt += '<img src=\'/' + d2[0].icon + '\' width=\'70\' height=\'70\'>';
                            txt += '<p> Welcome back, ' + d2[0].name + '!</p></div>';
                        }
                        txt += '</div></body></html>';
                        res.send(txt);
                    })
                } else {
                    txt += '<p> Login to experience more! </p>';
                    txt += '</div></body></html>';
                    res.send(txt);
                }
            });
        }
    });

});

app.post('/handlePostComment', express.urlencoded({ extended: true }), (req, res) => {
    var cm = req.body.comment;
    var news = req.body.newsID;
    var when = req.body.c_time.toLocaleString('en-US', { hour12: false }).toString();
    var before = req.body.p_time;


    var ObjectId = require('mongodb').ObjectID;
    req.db.get('newsList').find({ '_id': new ObjectId(news.trim()) }).then((docs) => {

        var doc = docs[0];
        var idx = 0;

        for (var i = 0; i < doc.comments.length; i++) {
            if (doc.comments[i].time == before) {
                idx = i;
            }
        }
        req.db.get('newsList').update({ '_id': new ObjectId(news.trim()) }, {
            $push: {
                comments: {
                    $each: [{ 'userID': req.cookies.userID, 'time': when, 'comment': cm }],
                    $position: idx
                }
            }
        }).then(() => {
            console.log("update success");
        })

    });

    req.db.get('userList').find({ '_id': monk.id(req.cookies.userID) }).then((docs) => {
        if (docs) {
            var doc = docs[0];
            var reply = {
                'name': doc.name,
                'icon': doc.icon
            }
            res.json(reply);
        }
    });

});

app.get('/login', (req, res) => {
    var news = req.query.newsID;

    var txt = '<!DOCTYPE html><html>'
    txt = '<head> <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">  <link rel=\"stylesheet\" href=\"stylesheets/style.css\">';
    txt += '<script src=\'javascripts/script.js\'></script>';
    txt += '<body>';
    txt += '<div class=\'col-1\'></div>';
    txt += '<div id=\'login_all\' class=\'col-2\'>';
    if (req.cookies.userID) {
        txt += '<h1 id=\'login_status\'> You have successfully logged in <h1>';
    } else {
        txt += '<h1 id=\'login_status\'>You can log in here</h1>';
        txt += '<div id=\'login_page\'>';
        txt += '<p>User Name:';
        txt += '<input type=\'text\' id=\'username\'></p><br>';
        txt += '<p>Password:';
        txt += '<input type=\'password\' id=\'password\'></p><br>';
        txt += '<button onclick=\'login()\'>Submit<br></div>';
    }
    if (news == 0 || news == "" || news == null || news == undefined) {
        txt += '<a id=\'go_back\' href=\'/\'>Go back</a></div>';
    } else {
        txt += '<a id=\'go_back\' href=\'/displayNewsEntry?newsID=' + news + '\'>Go back</a></div>';
    }
    txt += '</div><div class=\'col-3\'><br></div></body></html>';
    res.send(txt);
});

app.get('/handleLogin', (req, res) => {
    var name = req.query.username;
    var pwd = req.query.password;

    req.db.get('userList').find({ "name": name, "password": pwd }).then((docs) => {
        if (docs.length > 0 && docs != [] && docs != null && docs != undefined) {
            if (docs[0].name == name && docs[0].password == pwd) {
                res.cookie('userID', docs[0]._id, { maxAge: 60 * 1000 });
                res.send("login success");
            } else {
                res.send("Username or password is incorrect");
            }
        } else {
            res.send("Username or password is incorrect");
        }
    });
});

app.get('/handleLogout', (req, res) => {
    res.clearCookie('userID');
    res.redirect('/');
});
// launch the server with port 8081
var server = app.listen(8081, () => {
    var host = server.address().address
    var port = server.address().port
    console.log("news feed app listening at http://%s:%s", host, port)
});