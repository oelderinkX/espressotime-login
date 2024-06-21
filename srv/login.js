var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");
var db = require('../script/db.js');

var urlencodedParser = bodyParser.urlencoded({ extended: false });
var jsonParser = bodyParser.json();

var pool = new pg.Pool(db.localPgConfig());

var loginPage = fs.readFileSync(__dirname + "/../webpage/login.html", "utf8");

module.exports = function(app) {
	app.get('/', urlencodedParser, function(req, res) {
		res.send(loginPage);
	});
	
	app.get('/login', urlencodedParser, function(req, res) {
		res.send(loginPage);
	});

	app.post('/login', jsonParser, function(req, res) {
		var shop = req.body.shop;
		var employee = req.body.employee;
		var pass = req.body.password;
	
        var sql = "select id, name, url, db_connection, type from espresso.environment";
        sql += " where id in (select current_environment_id";
        sql += " from espresso.login";
        sql += " where active = true and lower(shop_name) = lower($1))";

		pool.connect(function(err, connection, done) {
			if (err) {
				console.log(err);
			}
			connection.query(sql, [shop], function(err, result) {
				done();

				if (result && result.rowCount == 1) {
					var environment = result.rows[0].db_connection;
					var url = result.rows[0].url;

					var environment_pool = new pg.Pool(db.getEnvironmentPgConfig(environment));
				
					environment_pool.connect(function(err, environment_connection, done) {
						if (err) {
							console.log(err);
						}

						var sql = '';
						var params = [];
						var isEmployeeLogin = employee && employee.length > 0;

						if (isEmployeeLogin) {
							sql = "select name, id, job_title from espresso.employee";
							sql += " where ex = false and lower(name) = lower($1) and pin = $2 and";
							sql += " shopid = (SELECT shopid from espresso.user where lower(username) = lower($3))";
							params = [employee, pass, shop];
						} else {
							sql = "SELECT id, shopid, name, username, permissions from espresso.user where username = $1 and password = $2";
							params = [shop, pass];
						}

						environment_connection.query(sql, params, function(err, result) {
							done();

							var login = { success: false, reason: "unknown error" };

							if (result && result.rowCount == 1) {
								var encoded_identifier = '';

								if (isEmployeeLogin) {
									encoded_identifier = result.rows[0].namne;
									encoded_identifier += ';17122011;';
									encoded_identifier += result.rows[0].id;
									encoded_identifier += ';17122011;';
									encoded_identifier += 'Hi';
									encoded_identifier += ';17122011;';
									encoded_identifier += '{ "job_title_id": ' + result.rows[0].job_title + ' }';
									encoded_identifier += ';17122011;';

									url += "/employee";
								} else {
									encoded_identifier = result.rows[0].id;
									encoded_identifier += ';12121976;';
									encoded_identifier += result.rows[0].shopid;
									encoded_identifier += ';12121976;';
									encoded_identifier += result.rows[0].username;
									encoded_identifier += ';12121976;';

									url += "/device";
								}

								var encode = Buffer.from(encoded_identifier).toString('base64');
								login = { success: true, identifier: encode, redirect: url };
							} else if (result && result.rowCount > 1 ) {
								login = { success: false, reason: "multiple users found, call administrator" };
							} else {
								login = { success: false, reason: "shop name, employee name or password incorrect" };
							}
								
							res.send(login);
						});
					});
				} else {
					res.send({ success: false, reason: "shop, employee or password incorrect"});
				}
			});
		});
	});
}