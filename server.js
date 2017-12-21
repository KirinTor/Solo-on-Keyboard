var express = require('express');
var app = new express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var fs = require("fs");
var cheerio = require('cheerio');

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://database:27017/rentdatabase";

// Front End directory
app.use(express.static(__dirname + '/client'));

// BodyParser
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// CookieParser
app.use(cookieParser());

// Check collections in database
MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  console.log("Connected to database!");
  db.createCollection("profiles", function(err1, res) {
      if (err1) throw err1;
      console.log("Profiles collection exists!");
      //db.close();
  });
  db.createCollection("cars", function(err1, res) {
      if (err1) throw err1;
      console.log("Cars collection exists!");
      db.close();
  });
});

// Start Server
app.listen(8888, function() {
    console.log("Server started at localhost:8888");
});


// Check user cookies
app.get("*", function(request, response) {
  if(!request.body) response.sendStatus(400);

  if (request.cookies == undefined || !request.cookies.rentlogin) {
    response.sendFile(__dirname + "/client/register.html");
  } else {
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      db.collection("profiles").findOne({login: request.cookies.rentlogin}, function(err, result) {
        if (err) throw err;
        if (result == null || result.password != request.cookies.rentpassword) {
          response.sendFile(__dirname + "/client/register.html");
        } else if (result.password == request.cookies.rentpassword) {
          response.sendFile(__dirname + "/client/userpage.html");
        }
        db.close();
      });
    });
  }
});

// Registration
app.post("/register", function (request, response) {
	if(!request.body) response.sendStatus(400);

  if(request.body.email != "" && request.body.password != "") {
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      db.collection("profiles").findOne({login: request.body.email}, function(err, result) {
        if (err) throw err;
        if (result != null && result.login) response.send('Аккаунт вже зареєстровано');
        db.close();
      });
    });

    if(request.body.password1 != request.body.password2) {
      response.send('Паролі не співпадають');
    } else {
      var userobj = {
        login: request.body.email,
        password: request.body.password1,
        name: "",
        passport: "",
        certificate: "",
        address: "",
        phone: "",
        email: ""
      };

      MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection("profiles").insertOne(userobj, function(err, res) {
          if (err) throw err;
          console.log("User Created");
          db.close();
        });
      });

      response.cookie('rentlogin', request.body.email);
      response.cookie('rentpassword', request.body.password1);

      response.sendFile(__dirname + "/client/userpage.html");
    }
  } else {
    response.send('Неправильні дані!');
  }
});

// Login
app.post("/login", function (request, response) {
	if(!request.body) response.sendStatus(400);

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;

    db.collection("profiles").findOne({login: request.body.email}, function(err, result) {
      if (err) throw err;

      if (result != null && result.password == request.body.password) {
        response.cookie('rentlogin', request.body.email);
        response.cookie('rentpassword', request.body.password);

        response.sendFile(__dirname + "/client/userpage.html");
      } else response.send('Неправильний логін або пароль');
      db.close();
    });

  });
});

// Log out
app.post("/exit", function (request, response) {
	if(!request.body) response.sendStatus(400);

  response.cookie('rentlogin', "");
  response.cookie('rentpassword', "");

  response.sendFile(__dirname + "/client/register.html");
});

// Edit profile
app.post("/profile", function (request, response) {
	if(!request.body) response.sendStatus(400);

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    db.collection("profiles").findOne({login: request.cookies.rentlogin}, function(err, result) {
      if (err) throw err;
      var htmlSource = fs.readFileSync(__dirname + "/client/profile.html", "utf8");
      var $ = cheerio.load(htmlSource);

      $('input[name=name]').attr("value", result.name);
      $('input[name=passport]').attr("value", result.passport);
      $('input[name=cert]').attr("value", result.certificate);
      $('input[name=address]').attr("value", result.address);
      $('input[name=phone]').attr("value", result.phone);
      $('input[name=email]').attr("value", result.email);

      response.send($.html());

      db.close();
    });
  });

});

// Save profile
app.post("/saveprofile", function (request, response) {
	if(!request.body) response.sendStatus(400);

  var query = {
    login: request.cookies.rentlogin,
    password: request.cookies.rentpassword
  };

  var new_val = {
    login: request.cookies.rentlogin,
    password: request.cookies.rentpassword,
    name: request.body.name,
    passport: request.body.passport,
    certificate: request.body.cert,
    address: request.body.address,
    phone: request.body.phone,
    email: request.body.email
  };

  MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  db.collection("profiles").updateOne(query, new_val, function(err, res) {
    if (err) throw err;
    response.send('Профіль відредактовано!');
    db.close();
  });
});
});

// Rent page
app.post("/rent", function (request, response) {
	if(!request.body) response.sendStatus(400);

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    db.collection("cars").find({}).toArray(function(err, result) {
      if (err) throw err;

      var htmlSource = fs.readFileSync(__dirname + "/client/rent.html", "utf8");
      var $ = cheerio.load(htmlSource);

      for (var i = 0; i < result.length; i++) {

        var d1 = new Date();
        var d2 = new Date(result[i].term);
        var d3 = new Date(result[i].activeby);

        if(d3 < d1 && d2 > d1) {
          console.log(result[i]);
          var part = '<div> ' +
              '<form class="form" action="/dorent" method="post">' +
                '<input type="text" name="category" readonly value=' + result[i].category + '><br>' +
                '<input type="text" name="model" readonly value=' + result[i].model + '><br>' +
                'Доступний до:<br>' +
                '<input type="text" name="term" readonly value=' + result[i].term + '><br>' +
                'Строк оренди (до якої дати):<br>' +
                '<input type="date" name="activeterm">' +
                '<br><br>' +
                '<input type="submit" value="Орендувати">' +
              '</form>' +
              '<hr>' +
            '</div>';

          $('.container').append(part);
        }
      }
      response.send($.html());

      db.close();
    });
  });

});

// Do rent
app.post("/dorent", function (request, response) {
	if(!request.body) response.sendStatus(400);

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;

    var d1 = new Date(request.body.term);
    var d2 = new Date(request.body.activeterm);

    if(d2.getTime() < d1.getTime()) {
      var query = {
        category: request.body.category,
        model: request.body.model,
        term: request.body.term
      };

      var nv = {
        category: request.body.category,
        model: request.body.model,
        term: request.body.term,
        activeby: request.body.activeterm
      };

      db.collection("cars").updateOne(query, nv, function(err, res) {
        if (err) throw err;
        response.send('Транспорт орендовано!');
        db.close();
      });
    } else {
      response.send('Неправильно вибрана дата оренди');
    }
  });
});

// Lease page
app.post("/lease", function (request, response) {
	if(!request.body) response.sendStatus(400);
  response.sendFile(__dirname + "/client/lease.html");
});

// Do lease
app.post("/dolease", function (request, response) {
	if(!request.body) response.sendStatus(400);

  var carobj = {
    category: request.body.category,
    model: request.body.model,
    pay: request.body.pay,
    term: request.body.term,

    activeby: '2000-01-01'
  };

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    db.collection("cars").insertOne(carobj, function(err, res) {
      if (err) throw err;
      console.log("Car Added");
      db.close();
    });
  });
  response.send('Транспорт добавлений!');
});
