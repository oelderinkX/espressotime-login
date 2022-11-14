var url = require('url');
var params = url.parse(process.env.DATABASE_URL);
var auth = params.auth.split(':');

function localPgConfig() {
	var config = {
		user: auth[0],
		password: auth[1],
		host: params.hostname,
		port: params.port,
		database: params.pathname.split('/')[1],
		ssl: true	  
	};

	return config;
}
module.exports.localPgConfig = localPgConfig;

function getEnvironmentPgConfig(environment) {
	var env = process.env;
	environment_params = url.parse(env["DATABASE_URL_" + environment]);
	var environment_auth = environment_params.auth.split(':');
	
	var config = {
		user: environment_auth[0],
		password: environment_auth[1],
		host: environment_params.hostname,
		port: environment_params.port,
		database: environment_params.pathname.split('/')[1],
		ssl: true	  
	};
  
	return config;
}
module.exports.getEnvironmentPgConfig = getEnvironmentPgConfig;