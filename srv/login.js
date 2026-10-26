const pg = require('pg');
const bodyParser = require('body-parser');
const fs = require("fs");
const db = require('../script/db.js');
const common = require('../javascript/common.js');

const urlencodedParser = bodyParser.urlencoded({ extended: false });
const jsonParser = bodyParser.json();

const pool = new pg.Pool(db.localPgConfig());

const loginPage = fs.readFileSync(__dirname + "/../webpage/login.html", "utf8");
const mobileLoginPage = fs.readFileSync(__dirname + "/../webpage/mobile_login.html", "utf8");
const environmentErrorPage = fs.readFileSync(__dirname + "/../webpage/environmenterror.html", "utf8");

module.exports = function(app) {
	app.get('/', urlencodedParser, function(req, res) {
		if (req.useragent.isMobile) {
        	res.send(mobileLoginPage);
    	} else {
			res.send(loginPage);
		}
	});
	
	app.get('/login', urlencodedParser, function(req, res) {
		if (req.useragent.isMobile) {
        	res.send(mobileLoginPage);
    	} else {
			res.send(loginPage);
		}
	});

	app.post('/login', jsonParser, function(req, res) {
		const shop = req.body.shop;
		const employee = req.body.employee;
		const pass = req.body.password;
		const loginType = req.body.loginType;
	
        let sql = "select id, name, url, db_connection, type from espresso.environment";
        sql += " where id in (select current_environment_id";
        sql += " from espresso.login";
        sql += " where active = true and lower(shop_name) = lower($1))";

		pool.connect(function(err, connection, done) {
			if (err) {
				console.log(err);
				let formatted = environmentErrorPage;
				formatted =  common.replaceAll('%SHOP%', shop);
				res.send(environmentErrorPage);
			} else {
				connection.query(sql, [shop], function(err, result) {
					done();

					if (result && result.rowCount == 1) {
						const environment = result.rows[0].db_connection;
						const url = result.rows[0].url;

						const environment_pool = new pg.Pool(db.getEnvironmentPgConfig(environment));
					
						environment_pool.connect(function(err, environment_connection, done) {
							if (err) {
								console.log(err);
							}

							let sql = '';
							const params = [];
							const isEmployeeLogin = employee && employee.length > 0;

							if (loginType == 1) {
								sql = "select e.name, e.id, e.job_title, r.name as rolename from espresso.employee as e";
								sql += " INNER JOIN espresso.role as r ON r.id = e.job_title";
								sql += " where e.ex = false and lower(e.name) = lower($1) and e.pin = $2 and";
								sql += " e.shopid = (SELECT shopid from espresso.user where lower(username) = lower($3))";
								params = [employee, pass, shop];
							} else if (loginType == 2) {
								sql = "select name, id, shopid from espresso.employee";
								sql += " where ex = false and lower(name) = lower($1) and pin = $2 and";
								sql += " job_title = (select id from espresso.role where shopid = (SELECT shopid from espresso.user where lower(username) = lower($3)) and name ilike '%manager%') and";
								sql += " shopid = (SELECT shopid from espresso.user where lower(username) = lower($3))";
								params = [employee, pass, shop];
							} else {
								sql = "SELECT id, shopid, name, username, permissions from espresso.user where username = $1 and password = $2";
								params = [shop, pass];
							}

							environment_connection.query(sql, params, function(err, result) {
								done();

								let login = { success: false, reason: "unknown error" };

								if (result && result.rowCount == 1) {
									let encoded_identifier = '';

									if (loginType == 1) {
										encoded_identifier = result.rows[0].name;
										encoded_identifier += ';17122011;';
										encoded_identifier += result.rows[0].id;
										encoded_identifier += ';17122011;';
										encoded_identifier += 'Hi';
										encoded_identifier += ';17122011;';
										encoded_identifier += '{ "job_title_id": ' + result.rows[0].job_title + ', "role": "' + result.rows[0].rolename +  '" }';
										encoded_identifier += ';17122011;';

										url += "/employee";
									} else if (loginType == 2) {
										encoded_identifier = result.rows[0].id;
										encoded_identifier += ';12121976;';
										encoded_identifier += result.rows[0].shopid;
										encoded_identifier += ';12121976;';
										encoded_identifier += 'Hi';
										encoded_identifier += ';12121976;';
										encoded_identifier += result.rows[0].name;
										encoded_identifier += ';12121976;';

										url += "/admin";
									} else {
										encoded_identifier = result.rows[0].id;
										encoded_identifier += ';12121976;';
										encoded_identifier += result.rows[0].shopid;
										encoded_identifier += ';12121976;';
										encoded_identifier += result.rows[0].username;
										encoded_identifier += ';12121976;';

										url += "/device";
									}

									const encode = Buffer.from(encoded_identifier).toString('base64');
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
			}
		});
	});
}