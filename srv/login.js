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
		var name = req.body.name;
		var pass = req.body.password;

		var sql = "select id, name, url, db_connection, type from espresso.environment";
		sql += " where id in (select current_environment_id";
		sql += " from espresso.login";
		sql += " where active = true and lower(shop_name) = lower($1));";
		
		sql = "select id from espresso.environment where id = 1;";

		console.log('sql: ' + sql);

		//res.send({ success: false, reason: "shop or username not found"});

		pool.connect(function(err, connection, done) {
			console.log('after pool connect');
			res.send({ success: false, reason: "still trying to connect to db!"});
			/*connection.query(sql, [name], function(err, result) {
				console.log('beforedone');
				done();
				
				console.log('result: ' + result);
				console.log('result.rowCount: ' + result.rowCount);

				if (result && result.rowCount == 1) {
					var environment = result.rows[0].db_connection;
					console.log('environment: ' + environment);

					var environment_pool = new pg.Pool(db.getEnvironmentPgConfig(environment));
				
					var sql = "SELECT id, shopid, name, username, permissions from espresso.user where username = $1 and password = $2";

					environment_pool.connect(function(err, connection, done) {
						connection.query(sql, [name, pass], function(err, result) {
							done();

							var login = { success: false, reason: "unknown error" };

							if (result && result.rowCount == 1) {
								var encoded_identifier = result.rows[0].id;
								encoded_identifier += ';12121976;';
								encoded_identifier += result.rows[0].shopid;
								encoded_identifier += ';12121976;';
								encoded_identifier += result.rows[0].username;
								encoded_identifier += ';12121976;';

								var encode = Buffer.from(encoded_identifier).toString('base64');
								login = { success: true, identifier: encode };
							} else if (result && result.rowCount > 1 ) {
								login = { success: false, reason: "multiple users found, call administrator" };
							} else {
								login = { success: false, reason: "shop name or password incorrect" };
							}
								
							res.send(login);
						});
					});
				} else {
					res.send({ success: false, reason: "shop name or password incorrect"});
				}
			});*/
		});
	});
}