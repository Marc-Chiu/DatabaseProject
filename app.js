'use strict';

const express = require('express');
const app = express();
const multer = require('multer');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const mysql = require('mysql');
const hash = require('md5');
const { layouts } = require('chart.js');
const { toNamespacedPath } = require('path');

const oneDay = 1000 * 60 * 60 * 24;
app.use(cookieParser());
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));

// current day, last year from today, last month and three months ago
var today = new Date();
var last_year = new Date();
var monthago = new Date();
var dd = String(today.getDate()).padStart(2, '0');
var mm = String(today.getMonth() + 1).padStart(2, '0');
var xx = String(today.getMonth()).padStart(2, '0');
var m3 = String(today.getMonth()-2).padStart(2, '0');
var yyyy = today.getFullYear();
var yxyx = today.getFullYear()-1;

if (xx == "00"){
  monthago = today.getFullYear()-1 + '-' + "12" + '-' + dd;
} else {
  monthago = yyyy + '-' + xx + '-' + dd;
}

last_year = yxyx + '-' + mm + '-' + dd;
today = yyyy + '-' + mm + '-' + dd;

// for application/x-www-form-urlencoded
app.use(express.urlencoded({extended: true})); // built-in middleware

// for application/json
app.use(express.json()); // built-in middleware

// for multipart/form-data (required with FormData)
app.use(multer().none()); // requires the "multer" module

//serving public file
app.use(express.static("/public"));

var session;

/*  home page endpoints --> left to do: create sessions and correctly load page with that session
  Should be done

  app.get("/", (req, res) => {
     res.sendFile('index.html', { root: 'public' })
   }) */;


// queries to get flights between a range of dates and dep airport and arrival airport
// searches for round trip or one way dending on if there is a return date
app.post("/search", async function(req, res) { // searching for flights endpoint
  console.log(req.body)

  let db = await getDBConnection(); // connect to databases
  db.connect(function(err) { // execute query (First departure then arrival if needed)
    if (req.body["end"] == "") { // Check if its one way or not
      // One Way
      if (err) throw err;
      db.query(
        "SELECT distinct flight_num, airline_name, departure_date, departure_time, departure_airport, arrival_date, arrival_airport, base_price, flight_status, plane_id \
         FROM flight JOIN airport as DEP JOIN airport as ARR \
         Where departure_date = ? and (departure_airport = ? or (DEP.city = ? and DEP.airport_id = departure_airport))\
         and (arrival_airport = ? or (ARR.city = ? and ARR.airport_id = arrival_airport))",
        [req.body["Start"], req.body["From"], req.body["From"], req.body["To"], req.body["To"]], function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        let results = JSON.parse(JSON.stringify(result)); // turn query data in json format
        res.send(results);
      });
    }
    else {
      // Round Trip flight
      db.query(
        "SELECT distinct flight_num, airline_name, departure_date, departure_time, departure_airport, arrival_date, arrival_airport, base_price, flight_status, plane_id \
         FROM flight JOIN airport as DEP JOIN airport as ARR \
         Where departure_date = ? and (departure_airport = ? or (DEP.city = ? and DEP.airport_id = departure_airport)) and (arrival_airport = ? or (ARR.city = ? and ARR.airport_id = arrival_airport));\
         SELECT distinct flight_num, airline_name, departure_date, departure_time, departure_airport, arrival_date, arrival_airport, base_price, flight_status, plane_id \
         FROM flight JOIN airport as DEP JOIN airport as ARR \
         Where departure_date = ? and (departure_airport = ? or (DEP.city = ? and DEP.airport_id = departure_airport)) and (arrival_airport = ? or (ARR.city = ? and ARR.airport_id = arrival_airport))",
        [ req.body["Start"], req.body["From"], req.body["From"], req.body["To"], req.body["To"],
          req.body["end"], req.body["To"], req.body["To"], req.body["From"], req.body["From"]], function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        let results = JSON.parse(JSON.stringify(result)); // turn query data in json format
        res.send(results);
      });
    }
    db.end(); // terminate connection
  });
});

// checks if the email and password match a user then creates a session and goes to customer.html
app.post("/LoginUser", async function(req, res) { // Login Endpoint
  console.log(req.body);

  let db = await getDBConnection(); // connect to databases
  db.connect(function(err) {
    if (err) throw err;
    db.query("SELECT * FROM customer Where email = ? and customer_password = ?",
    [req.body["email"], hash(req.body["password"])], function (err, result, fields) {
      if (err) throw err;
      console.log(result);

      if (Object.keys(result).length == 0) { // check if user is found
        // load error
        res.send("Error: no user with that email/password");
      } else {
        // create session
          session = req.session;
          session.userid = req.body["email"];
          //console.log(session.user);
        // go to user homepage
          res.sendFile('customer.html', {root: 'public'});
      }
    });
    db.end(); // terminate connection
  });
});

// checks if the username and password match a staff then creates a session and goes to staff.html
app.post("/LoginStaff", async function(req, res) { // Login Endpoint
  console.log(req.body);

  let db = await getDBConnection(); // connect to databases
  db.connect(function(err) {
    if (err) throw err;
    db.query("SELECT * FROM staff Where username = ? and staff_password = ?",
    [req.body["username"], hash(req.body["password"])], function (err, result, fields) {
      if (err) throw err;
      console.log(result);

      if (Object.keys(result).length == 0) { // check if staff is found
        //load error
        res.send("Error: no staff with that email/password");
      } else {
        req.session.airline = result[0]["airline_name"];
        req.session.userid = req.body["username"];
        res.sendFile('staff.html', {root: 'public'});
      }
    });
    db.end(); // terminate connection
  });
});

// checks if the information is not already in the database then if it is unique it addds the staff to the database
app.post("/RegisterStaff", async function(req, res) { // Login Endpoint
  console.log(req.body)

  let db = await getDBConnection(); // connect to databases

  db.connect(function(err) { //
    if (err) throw err;


    db.query("SELECT * FROM staff Where username = ?; SELECT * FROM airline WHERE airline_name = ?",
    [req.body["username"], req.body["airline"]], function (err, result, fields) {
      if (err) throw err;
      console.log(result);
      if (Object.keys(result[0]).length != 0 || Object.keys(result[1]).length == 0) { // Check if staff already exists
        //load error]
        res.send("Username Already Exists // Airline Does not exist");
      } else {
          db.query("INSERT INTO staff(username, staff_password, first_name, last_name, birthday, airline_name)\
                    values( ?, ?, ?, ?, ?, ?);",
                    [req.body["username"], hash(req.body["password"]), req.body["Fname"], req.body["Lname"],
                     req.body["birthday"], req.body["airline"]],
                     function (err, result, fields) {
            if (err) res.send(err);
          });
          db.query("INSERT INTO staff_phone(phone_number, username)\
                    values(?, ?);",
                  [req.body["telephone"], req.body["username"]], function (err, result, fields) {
                if (err) res.send(err);
                res.sendFile('index.html', {root: 'public'});
          });
        }
      });
    //db.end(); // terminate connection
  });
});

// checks if the information is not already in the database then if it is unique it addds the user to the database
app.post("/RegisterUser", async function(req, res) { // Login Endpoint
  console.log(req.body)

  let db = await getDBConnection(); // connect to databases

  db.connect(function(err) { //
    if (err) throw err;
    db.query("SELECT * FROM customer Where email = ?",
    [req.body["email"]], function (err, result, fields) {
      if (err) throw err;
      if (Object.keys(result).length != 0) {  //load error
        res.send("That email is already registered");
      }
      else {
        db.query("insert into customer(email, name, customer_password, phone_number, building, street,\
           city, state, passport_number, passport_expiration, passport_country, birthday)\
           Values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [req.body["email"], req.body["name"], hash(req.body["password"]), req.body["phone"], req.body["building"],
         req.body["street"], req.body["city"], req.body["state"], req.body["pass-num"],
         req.body["pass-exipration"], req.body["pass-country"], req.body["birthday"]
        ], function (err, result, fields) {
          if (err) throw err;
          //console.log(result);
          res.sendFile('index.html', {root: 'public'});
        });
      }
    });
  //db.end(); // terminate connection
  });
});


// Customer endpoints

// gets all the tickets of a flight that have not already been booked
app.post("/Tickets", async function(req, res) {
  console.log(req.body);

  let db = await getDBConnection(); // connect to databases

  db.connect(function(err) { //
    if (err) throw err;
    db.query("SELECT * FROM ticket Where flight_num = ? and airline_name = ? and departure_date = ? and departure_time = ? \
              AND ticket_id not in (SELECT ticket_id FROM booked)",
            [req.body["flight_num"], req.body["airline_name"], req.body["departure_date"], req.body["departure_time"]],
            function (err, result, fields) {
      if (err) throw err;
      console.log(result);
      let results = JSON.parse(JSON.stringify(result)); // turn query data in json format
      res.send(results);
    });
  });
  //db.end(); // terminate connection
});

// inserts into booked table a ticket
app.post("/Purchase", async function(req, res) {
  console.log(req.body);



  let db = await getDBConnection(); // connect to databases
  db.connect(function(err) { //
    if (err) throw err;
    db.query("INSERT into booked(ticket_id, email, purchase_date, card_type, card_number, card_name, card_expiration, comments, rating)\
  	        VALUES(?, ?, ?, ?, ?, ?, ?, null, null)",
            [req.body["ticket-id"], req.session.userid, today, req.body["card-type"], req.body["card-num"], req.body["card-name"], req.body["card-expiration"]],
            function (err, result, fields) {
      if (err) throw err;
      console.log(result);
      //let results = JSON.parse(JSON.stringify(result)); // turn query data in json format
      res.sendFile('customer.html', {root: 'public'});
    });
  });
  //db.end(); // terminate connection
});

// get all the flights a user has bought
app.get("/MyFlights", async function(req, res) {
  console.log(req.session.userid);

  let db = await getDBConnection(); // connect to databases
  db.connect(function(err) { //
    try {
      if (err) throw err;
      db.query("SELECT ticket_id, departure_date \
                FROM booked NATURAL JOIN ticket \
                Where email = ?",
              [req.session.userid], function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        let results = JSON.parse(JSON.stringify(result)); // turn query data in json format
        res.send(results);
      });
    } catch (err){
      res.send(err)
    } finally {
      db.end(); // terminate connection
    }
  });
});

            // deletes a ticket from the from the booked table
app.post("/Cancel", async function(req, res) {
  console.log(req.body["ticket-id"]);
  console.log(req.session.userid);

  let db = await getDBConnection(); // connect to databases
  db.connect(function(err) { //
      db.query("DELETE FROM booked WHERE ticket_id = ? and email = ?",
            [req.body["ticket-id"], req.session.userid],
            function (err, result, fields) {
      if (err) throw err;
      console.log("deleting");
      res.send("complete");
      });
  });
 // db.end(); // terminate connection
});

// adds a comment and a rating to a row in booked based on the user and the ticket
app.post("/Rate" , async function(req, res) {
  console.log(req.body);

  let db = await getDBConnection(); // connect to databases
  db.connect(function(err) { //
    if (err) throw err;
    db.query("UPDATE booked SET comments = ?, rating = ? WHERE ticket_id = ? and email = ?;",
            [req.body["comment"], req.body["rating"], req.body["ticket-id"], req.session.userid],
            function (err, result, fields) {
      if (err) throw err;
      console.log(result);
    });
  });
 // db.end(); // terminate connection
});

// gets tickets spending based on a range of dates
app.post("/Spending", async function(req, res) {
  console.log(req.body);

  let db = await getDBConnection(); // connect to databases
  db.connect(function(err) { //
    if (err) throw err;
    db.query("SELECT purchase_date, sold_price FROM booked NATURAL JOIN ticket WHERE email = ?\
              AND departure_date BETWEEN ? and ?;",
            [req.session.userid, req.body["start"], req.body["end"]], function (err, result, fields) {
      if (err) throw err;
      console.log(result);
      let results = JSON.parse(JSON.stringify(result)); // turn query data in json format
      res.send(results);
    });
  });
  //db.end(); // terminate connection
});

// destory session
app.get('/Logout',(req,res) => {
  console.log(req.session.userid);
  req.session.destroy();
});




// Staff Endpoints

// gets all the airlines flights for the past year
app.post("/airline-flights", async function(req, res) {
  console.log(req.session.userid);

  let db = await getDBConnection(); // connect to databases
  db.connect(function(err) { //
    try {
      if (err) throw err;
      db.query("SELECT * FROM flight WHERE airline_name = ? and departure_date BETWEEN ? and ?",
              [req.session.airline, req.body["Start"], req.body["end"]], function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        let results = JSON.parse(JSON.stringify(result)); // turn query data in json format
        res.send(results);
      });
    } catch (err){
      res.send(err)
    } finally {
      db.end(); // terminate connection
    }
  });
});

// get all the airlines flights for a range of dates
app.post("/search-staff", async function(req, res) { // searching for flights endpoint
  console.log(req.body)

  let db = await getDBConnection(); // connect to databases
  db.connect(function(err) { // execute query (First departure then arrival if needed)
    if (err) throw err;
    db.query(
      "SELECT distinct flight_num, airline_name, departure_date, departure_time, departure_airport, arrival_date, arrival_time, arrival_airport, base_price, flight_status, plane_id \
        FROM flight JOIN airport as DEP JOIN airport as ARR \
        Where departure_date between ? and ? and (departure_airport = ? or (DEP.city = ? and Dep.airport_id = departure_airport)) and\
        (arrival_airport = ? or (ARR.city = ? and ARR.airport_id = arrival_airport)) and airline_name = ?",
      [req.body["Start"], req.body["end"], req.body["From"], req.body["From"], req.body["To"], req.body["To"], req.session.airline], function (err, result, fields) {
      if (err) throw err;
      console.log(result);
      let results = JSON.parse(JSON.stringify(result)); // turn query data in json format
      res.send(results);
    });
    db.end(); // terminate connection
  });
});

// insert a flight into the flights table, checks to make sure its in the correct airline
app.post("/add-flight", async function(req, res) {
  console.log(req.body);
  console.log(req.session.airline);

  if (req.body["airline"] == req.session.airline){
    let db = await getDBConnection(); // connect to databases
    db.connect(function(err) { //
      if (err) throw err;

      db.query("SELECT * FROM airport WHERE airport_id = ?; SELECT * FROM airport WHERE airport_id = ?;\
                SELECT * FROM airplane WHERE plane_id = ? and airline_name = ?",
                [req.body["dep-airport"], req.body["arr-airport"], req.body["plane"], req.session.airline],
        function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        if(Object.keys(result[0]).length == 0 || Object.keys(result[1]).length == 0 || Object.keys(result[2]).length == 0){
          res.send("Airport or Plane does not exist")
        } else {
            db.query("INSERT into flight(flight_num, airline_name, departure_date, departure_time, departure_airport,\
              arrival_date, arrival_time, arrival_airport, flight_status, base_price, plane_id) \
              values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [req.body["flight-num"], req.session.airline,
              req.body["dep-date"],req.body["dep-hour"], req.body["dep-airport"],
              req.body["arr-date"],req.body["arr-hour"], req.body["arr-airport"],
              req.body["status"], req.body["price"], req.body["plane"]],
            function (err, result, fields) {
                if (err) throw err;
                console.log(result);
                res.send("success")
          });
        }
      });
    });
  //db.end(); // terminate connection
  }
});

// add a plane into the airplane table, make sure it belongs to the right airline
app.post("/add-airplane", async function(req, res) {
  console.log(req.body);

  if (req.body["airline"] == req.session.airline){
    let db = await getDBConnection(); // connect to databases
    db.connect(function(err) { //
    if (err) throw err;
    db.query("insert into airplane(plane_id, airline_name, seats, manufacturer, age)\
              values(?, ?, ?, ?, ?)",
            [req.body["plane-id"], req.body["airline"], req.body["seats"], req.body["manufacturer"], req.body["age"]],
            function (err, result, fields) {
      if (err) throw err;
      console.log(result);
      res.send("Success");
    });
  });
  //db.end(); // terminate connection
  }
});

// adds an airport into the airport table, could be anything don't check for validity
app.post("/add-airport", async function(req, res) {
  console.log(req.body);

  let db = await getDBConnection(); // connect to databases
  db.connect(function(err) { //
    if (err) throw err;
    db.query("INSERT into airport(airport_id, airport_name, city, country, type)\
              values(?, ?, ?, ?, ?)",
            [req.body["airport-id"], req.body["airport-name"], req.body["city"], req.body["country"], req.body["airport-type"]],
            function (err, result, fields) {
      if (err) throw err;
      console.log(result);
      res.send("Success");
    });
  });
  //db.end(); // terminate connection
});

// edits the status of a plane
app.post("/edit-status", async function(req, res) {
  console.log(req.body);

  let db = await getDBConnection(); // connect to databases
  db.connect(function(err) { //
    if (err) throw err;
    db.query("UPDATE flight SET flight_status = ? WHERE flight_num = ? and airline_name = ? and departure_date = ? and departure_time = ?",
            [req.body["status"], req.body["flight-num"], req.session.airline, req.body["date"], req.body["time"]],
            function (err, result, fields) {
      if (err) throw err;
      console.log(result);
      //let results = JSON.parse(JSON.stringify(result)); // turn query data in json format
      res.send("Update Succesful");
    });
  });
  //db.end(); // terminate connection
});

// see all the comments and ratings of a flight
app.get("/view-rating", async function(req, res) {
  console.log(req.body);

  let db = await getDBConnection(); // connect to databases
  db.connect(function(err) { //
    if (err) throw err;
    db.query("SELECT comments, rating \
              FROM `ticket` NATURAL JOIN booked NATURAL JOIN flight \
              WHERE flight_num = ?, airline_name = ?, departure_date = ?, departure_time = ?",
            [req.body["airport-id"], req.body["airport-name"], req.body["city"], req.body["country"], req.body["airport-type"]],
            function (err, result, fields) {
      if (err) throw err;
      console.log(result);
      //let results = JSON.parse(JSON.stringify(result)); // turn query data in json format
      res.send("result");
      res.render('');
    });
  });
  db.end(); // terminate connection
});

//
/* app.get("/view-customer", async function(req, res) {
  console.log(req.body);

  let db = await getDBConnection(); // connect to databases
  db.connect(function(err) { //
    if (err) throw err;
    db.query("SELECT email, count(email) as flights\
              FROM booked natural join flight NATURAL JOIN ticket\
              WHERE departure_date between ? and ?\
              GROUP BY email",
            [req.body["start-date"], req.body["end-date"]],
            function (err, result, fields) {
      if (err) throw err;
      console.log(result);
      //let results = JSON.parse(JSON.stringify(result)); // turn query data in json format
      res.send(result);
      res.render('');
    });
  });
  db.end(); // terminate connection
}); */


// get all the revenue for the past year and last three months based on class
app.get("/view-revenue", async function(req, res) {
  console.log(today, last_year, monthago);

  let db = await getDBConnection(); // connect to databases
  db.connect(function(err) { //
    if (err) throw err;
    db.query("SELECT sum(sold_price) as revenue FROM booked natural join ticket\
              WHERE class='first' and airline_name = ? and purchase_date between ? and ?;\
              SELECT sum(sold_price) as revenue FROM booked natural join ticket\
              WHERE class='first' and airline_name = ? and purchase_date between ? and ?;\
              SELECT sum(sold_price) as revenue FROM booked natural join ticket\
              WHERE class='business' and airline_name = ? and purchase_date between ? and ?;\
              SELECT sum(sold_price) as revenue FROM booked natural join ticket\
              WHERE class='business' and airline_name = ? and purchase_date between ? and ?;\
              SELECT sum(sold_price) as revenue FROM booked natural join ticket\
              WHERE class='economy' and airline_name = ? and purchase_date between ? and ?;\
              SELECT sum(sold_price) as revenue FROM booked natural join ticket\
              WHERE class='economy' and airline_name = ? and purchase_date between ? and ?;",
            [req.session.airline, last_year, today,
             req.session.airline, monthago, today,
             req.session.airline, last_year, today,
             req.session.airline, monthago, today,
             req.session.airline, last_year, today,
             req.session.airline, monthago, today
            ],
            function (err, result, fields) {
      if (err) throw err;
      let results = JSON.parse(JSON.stringify(result)); // turn query data in json format
      console.log(results);
      res.send(results);
    });
  });
  //db.end(); // terminate connection
});

// get all the tickets that have been sold based on a range of dates
app.post("/view-sold", async function(req, res) {
  console.log(req.body, req.session.airline);
  //d.setMonth(d.getMonth() - 3);

  let db = await getDBConnection(); // connect to databases
  db.connect(function(err) { //
    if (err) throw err;
    db.query("SELECT purchase_date FROM booked natural join ticket\
              WHERE airline_name = ? and purchase_date between ? and ?",
            [req.session.airline, req.body["Start"], req.body["end"]],
             function (err, result, fields) {
      if (err) throw err;
      console.log(result);
      let results = JSON.parse(JSON.stringify(result)); // turn query data in json format
      res.send(results);
    });
  });
  //db.end(); // terminate connection
});

// get the top destination
app.get("/top-destination", async function(req, res) {
  console.log(req.body, req.session.airline);
  let monthsago;

  if (parseInt(m3) <= 0){
     monthsago = String(parseInt(yyyy)-1) + '-' + String(12-parseINT(m3)) + '-' + dd;
  } else {
      monthsago = yyyy + '-' + m3 + '-' + dd;
  }
  console.log(monthsago, last_year, today);

  let db = await getDBConnection(); // connect to databases
  db.connect(function(err) { //
    if (err) throw err;
    db.query( "SELECT count(arrival_airport) as count, arrival_airport\
               FROM booked natural join ticket natural join flight\
               WHERE airline_name = ? and purchase_date between ? and ? GROUP BY arrival_airport;\
               SELECT count(arrival_airport) as count, arrival_airport\
               FROM booked natural join ticket natural join flight\
               WHERE airline_name = ? and purchase_date between ? and ? GROUP BY arrival_airport",
               [req.session.airline, monthsago, today,
                req.session.airline, last_year, today],
               function (err, result, fields) {
      if (err) throw err;
      console.log(result);
      let results = JSON.parse(JSON.stringify(result)); // turn query data in json format
      res.send(results);
    });
  });
});

// the the customer with the most purchase in the past year
app.get("/top-customer", async function(req, res) {

  let db = await getDBConnection(); // connect to databases
  db.connect(function(err) { //
    if (err) throw err;
    db.query( "SELECT count(email) as flights, email from booked NATURAL JOIN ticket\
               WHERE airline_name = ? and purchase_date BETWEEN ? and ? GROUP BY email ORDER BY flights ASC LIMIT 1;",
               [req.session.airline, last_year, today],
               function (err, result, fields) {
      if (err) throw err;
      console.log(result);
      let results = JSON.parse(JSON.stringify(result)); // turn query data in json format
      res.send(results);
    });
  });
});

// get all the flights a given customer has taken
app.post("/all-customers-flights", async function(req, res) {
  console.log(req.body, req.session.airline);

  let db = await getDBConnection(); // connect to databases
  db.connect(function(err) { //
    if (err) throw err;
    db.query( "SELECT flight_num, departure_date, departure_time FROM ticket NATURAL JOIN booked\
               WHERE airline_name = ? and email = ?;",
               [req.session.airline, req.body["email"]],
               function (err, result, fields) {
      if (err) throw err;
      console.log(result);
      let results = JSON.parse(JSON.stringify(result)); // turn query data in json format
      res.send(results);
    });
  });
});

//get the all comments from a particular flight
app.post("/getComments", async function(req, res) {
  console.log(req.body, req.session.airline, req.body["airline_name"]);

  if(req.session.airline == req.body["airline_name"]) {
    let db = await getDBConnection(); // connect to databases
    db.connect(function(err) { //
      if (err) throw err;
      db.query( "SELECT comments, rating FROM `booked` NATURAL JOIN ticket\
                 WHERE airline_name = ? and flight_num = ? and departure_date = ? and\
                 departure_time = ? and comments is not NULL and rating is not NULL",
                 [req.session.airline, req.body["flight_num"], req.body["departure_date"], req.body["departure_time"]],
                 function (err, result, fields) {
        if (err) throw err;
        let results = JSON.parse(JSON.stringify(result)); // turn query data in json format
        console.log(results)
        res.send(results);
      });
    });
  }
});


// somewhere in your app.js (after all // endpoint definitions)
async function getDBConnection() {

  const db = await mysql.createConnection({ //connect to phpmyadmin
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'Flight',
    port: '8889',
    multipleStatements: true
  });
  return db;
}

app.use(express.static('public'));
const PORT = process.env.PORT || 8000;
app.listen(PORT);


