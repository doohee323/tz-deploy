'use strict';

module.exports = {
	app : {
		type : "client",
		name : "sdt-deploy - Staging",
		port : 3000,
		domain : 'http://topzone.com'
	},
	deploy : {
		ciServer: "http://ci.test.com:3000/",
		checkCnt : 30,
		sourceDir : "download/",
		topzone: {
			awslb : "jetty-autoscaling",
			checkUrl : "http://dev2.topzone.com:8080/transfer/topzoneInfo?=",
			targetDir : '/Users/dhong/Documents/workspace/sts-3.8.3.RELEASE/tz-deploy/target',
			targetFile : 'ROOT.war',
			postCmd: 'sudo systemctl stop tomcat; sudo systemctl start tomcat'
		},
		topzonejetty: {
			awslb : "jetty-autoscaling",
			checkUrl : "http://localhost:8080/noticeBar2/get?type=greeting",
			targetDir : '/home/ubuntu',
			targetFile : 'ROOT.jar',
			postCmd: 'sudo systemctl stop topzone; sudo systemctl start topzone'
		},
		topzonetomcat: {
			awslb : "jetty-autoscaling",
			checkUrl : "http://localhost:8080/noticeBar2/get?type=greeting",
			targetDir : '/opt/tomcat/webapps',
			targetFile : 'ROOT.war',
			postCmd: 'sudo rsync -avP /opt/tomcat/webapps/ROOT/static/dist/ /var/www/html/; sudo chown -Rf www-data:www-data /var/www/html; sudo chmod o+rw /var/www/html/scripts'
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
