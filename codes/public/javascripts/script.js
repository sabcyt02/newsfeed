const { xml } = require("jade/lib/doctypes");
const { ConnectionClosedEvent } = require("mongodb");

function loadNewsList(pageindex) {
    var xmlhttp = new XMLHttpRequest();
    var input = document.getElementById('search_string').value;
    xmlhttp.open("GET", "/retrievenewslist?pageindex=" + pageindex + "&search=" + input, true);
    xmlhttp.send();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {

            var json = JSON.parse(xmlhttp.responseText);

            //a
            if (json.login_status == 0) {
                document.getElementById("login_link").innerHTML = "Log in";
                document.getElementById("login_link").href = "/login?newsID=0";
                document.getElementById("login_link").setAttribute('onclick', '');
            } else if (json.login_status == 1) {
                document.getElementById("login_link").innerHTML = "Log out";
                document.getElementById("login_link").href = "";
                document.getElementById("login_link").setAttribute('onclick', 'logout()');
            }

            //b
            var finding = json.entries;
            var txt = '';
            if (input != "" && pageindex != 1) {
                finding = finding.slice((pageindex - 1) * 5, pageindex * 5);
            }
            for (var i = 0; i < finding.length; i++) {
                txt += '<h1 id=\'headline\'><a href=\"/displayNewsEntry?newsID=' + finding[i]._id + '\">' + finding[i].headline + '</a></h1>';
                txt += '<p>' + finding[i].time.toLocaleString('en-US', { hour12: false }) + '</p>';
                txt += '<p>' + finding[i].content.split(/\s+/).slice(0, 10).join(" ") + '</p><br>';
            }
            document.getElementById("news").innerHTML = txt;

            //c
            txt = '';
            var size = json.totalNum;

            if (size / 5 == 0) {
                size = 1;
            } else if (size % 5 != 0) {
                size = size / 5 + 1;
            } else {
                size = size / 5;
            }
            for (var i = 1; i <= size; i++) {
                txt += '<a onclick=\"loadNewsList(' + i + ')\">' + '   ' + i + '   ' + '</a>';
            }
            document.getElementById('pageindex').innerHTML = txt;

            //styling purpose
            txt = '<br><p>' + new Date().toLocaleString('en-US', { hour12: false }) + '</p>';
            document.getElementById('show_time').innerHTML = txt;
        }
    }
}

function postComment() {
    var news = document.getElementById('newsID').innerHTML;
    var comment = document.getElementById("comment_add").value;
    var lastT = document.getElementById('latest_time').name;

    if (comment == "") {
        alert("No comment has been entered");
    } else {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("POST", '/handlePostComment', true);
        var time = new Date();
        xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xmlhttp.send("comment=" + comment + "&newsID=" + news + "&c_time=" + time + '&p_time=' + lastT);

        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                var json = JSON.parse(xmlhttp.responseText);
                var txt = '<img src=\"/' + json.icon + '\" width=\'50\' height=\'50\' class=\'img\'>';
                txt += '<div id=\'person\'><p>' + json.name + '</p>';
                txt += '<p>' + time.toLocaleString('en-US', { hour12: false }) + '</p></div>';
                txt += '<p id=\'latest_news\'>' + comment + '</p></br>';

                document.getElementById('comments').innerHTML = txt + document.getElementById('comments').innerHTML;
                document.getElementById("comment_add").value = "";
            }
        }
    }
}

function login() {
    var name = document.getElementById("username").value;
    var pw = document.getElementById("password").value;

    if (name == "" || pw == "") {
        alert("Please enter username and password");
    } else {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", '/handleLogin?username=' + name + '&password=' + pw, true);
        xmlhttp.send();

        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                if (xmlhttp.responseText == "login success") {
                    document.getElementById("login_status").innerHTML = "You have successfully logged in";
                    document.getElementById("login_page").style.display = "none";
                } else if (xmlhttp.responseText == "Username or password is incorrect") {
                    alert(xmlhttp.responseText);
                    document.getElementById("login_status").innerHTML = xmlhttp.responseText;
                    document.getElementById("login_page").style.display = "inline";
                }
            }
        }
    }
}

function logout() {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", '/handleLogout', true);
    xmlhttp.send();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            document.getElementById("login_link").innerHTML = "Log in";
            document.getElementById("login_link").href = "/login?newsID=0";
        }
    }
}