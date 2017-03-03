'use strict';

module.exports = {
	app : {
		name : "sdt-deploy - Production",
		port : 3000,
		domain : 'http://sodatransfer.com'
	},
	deploy : {
		ciServer: "http://ci.sodatransfer.com/",
		checkCnt : 10,
		checkUrl : "http://localhost:8080",
		sourceDir : "download/",
		targetPath : '/Users/dhong/Documents/workspace/sts-3.8.3.RELEASE/SodaTransferDeploy/target'
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
