'use strict';

module.exports = {
	app : {
		name : "sdt-deploy - Staging",
		port : 3000,
		domain : 'http://sodatransfer.com'
	},
	deploy : {
		ciServer: "http://ci.test.com:3000/",
		checkCnt : 10,
		checkUrl : "http://dev2.sodatransfer.com",
		sourceDir : "download/",
		targetPath : '/Users/dhong/Documents/workspace/sts-3.8.3.RELEASE/SodaTransferDeploy/target'
	},
	mysql : {
		env : "local",
		dbUsername : "root",
		dbPassword : "1",
		dbHost : "127.0.0.1",
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
process.env['NODE_ENV'] = 'development';
