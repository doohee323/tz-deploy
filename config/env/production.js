'use strict';

module.exports = {
	app : {
		name : "sdt-deploy - Production",
		port : 3000,
		domain : 'http://sodatransfer.com'
	},
	mysql : {
		env : "production",
		dbUsername : "root",
		dbPassword : "1",
		dbHost : "52.0.156.21",
		port : 3306,
		database : "sdtDeploy",
		connectionLimit : 100,
		poolUseYn : true
	},
	logging : {
		client : true,
		sql : true,
		debug : true,
		input : true,
		output : true
	}
}

// local, staging, production
process.env['NODE_ENV'] = 'production';
