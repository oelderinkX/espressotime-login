const pg = require('pg');
const bodyParser = require('body-parser');
const fs = require("fs");
const db = require('../script/db.js');
const common = require('../javascript/common.js');

const urlencodedParser = bodyParser.urlencoded({ extended: false });
const jsonParser = bodyParser.json();

const pool = new pg.Pool(db.localPgConfig());

const registrationPage = fs.readFileSync(__dirname + "/../webpage/registration.html", "utf8");

module.exports = function(app) {
	app.get('/registration', urlencodedParser, function(req, res) {
		res.send(registrationPage);
	});

	app.post('/registration', jsonParser, async function(req, res) {
		const group = req.body.group;
		const shopname = req.body.shopname;
		const shopphone = req.body.shopphone;
		const shopaddress = req.body.shopaddress;
		const shopemail = req.body.shopemail;
		const devicepassword = req.body.devicepassword;

		const rolename1 = req.body.rolename1;
		const rolecolor1 = req.body.rolecolor1;
		const roletextcolor1 = req.body.roletextcolor1;
		const roleisjob1 = req.body.roleisjob1;

		const rolename2 = req.body.rolename2;
		const rolecolor2 = req.body.rolecolor2;
		const roletextcolor2 = req.body.roletextcolor2;
		const roleisjob2 = req.body.roleisjob2;

		const rolename3 = req.body.rolename3;
		const rolecolor3 = req.body.rolecolor3;
		const roletextcolor3 = req.body.roletextcolor3;
		const roleisjob3 = req.body.roleisjob3;

		const rolename4 = req.body.rolename4;
		const rolecolor4 = req.body.rolecolor4;
		const roletextcolor4 = req.body.roletextcolor4;
		const roleisjob4 = req.body.roleisjob4;

		const employeename1 = req.body.employeename1;
		const employeephone1 = req.body.employeephone1;
		const employeeemail1 = req.body.employeeemail1;
		const employeepin1 = req.body.employeepin1;
		const employeestartdate1 = req.body.employeestartdate1;
		const employeejob1 = req.body.employeejob1;

		const employeename2 = req.body.employeename2;
		const employeephone2 = req.body.employeephone2;
		const employeeemail2 = req.body.employeeemail2;
		const employeepin2 = req.body.employeepin2;
		const employeestartdate2 = req.body.employeestartdate2;
		const employeejob2 = req.body.employeejob2;

		const employeename3 = req.body.employeename3;
		const employeephone3 = req.body.employeephone3;
		const employeeemail3 = req.body.employeeemail3;
		const employeepin3 = req.body.employeepin3;
		const employeestartdate3 = req.body.employeestartdate3;
		const employeejob3 = req.body.employeejob3;
	
        const sql = "select id, name, url, type, db_connection from espresso.environment where name = $1 order by type asc";

		const response = { success: false, error: new Error() }
		const environments = [];

		let client = await pool.connect();
		let result = await client.query(sql);
		client.release();

		for (let i = 0; i < result.rows.length; i++) {
			environments.push({
				id: result.rows[i].id,
				name: result.rows[i].name,
				url: result.rows[i].url,
				type: result.rows[i].type,
				db_connection: result.rows[i].db_connection
			});
		}

		var environmentPool = new pg.Pool(db.getEnvironmentPgConfig(environments[0].db_connection));

		res.send(`<html><body><pre><code>${JSON.stringify(environments, null, 4)}</code></pre></body></html>`);
	});
}