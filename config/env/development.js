'use strict';

module.exports = {
	app : {
		type : "client",
		name : "sdt-deploy - Staging",
		port : 3000,
		domain : 'http://sodatransfer.com'
	},
	deploy : {
		ciServer: "http://ci.test.com:3000/",
		checkCnt : 10,
		sourceDir : "download/",
		sodatransfer: {
			awslb : "jetty-autoscaling",
			checkUrl : "http://dev2.sodatransfer.com:8080/transfer/sodatransferInfo?=",
			targetDir : '/Users/dhong/Documents/workspace/sts-3.8.3.RELEASE/SodaTransferDeploy/target',
			targetFile : 'ROOT.war',
			postCmd: 'sudo systemctl stop tomcat; sudo systemctl start tomcat'
		},
		sodatransferboot: {
			awslb : "jetty-autoscaling",
			checkUrl : "http://localhost:8080/noticeBar2/get?type=greeting",
			targetDir : '/home/ubuntu',
			targetFile : 'ROOT.jar',
			postCmd: 'sudo systemctl stop sodatransfer; sudo systemctl start sodatransfer'
		},
		sodatransferui: {
			awslb : "jetty-autoscaling",
			checkUrl : "http://localhost/transfer/sodatransferInfo?=",
			targetDir : '/home/ubuntu',
			targetFile : 'ROOT.jar',
			postCmd: '#sync'
		}
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
