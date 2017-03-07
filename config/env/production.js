'use strict';

module.exports = {
	app : {
		type : "client",
		name : "sdt-deploy - Production",
		port : 3000,
		domain : 'http://sodatransfer.com'
	},
	deploy : {
		ciServer: "http://ci.sodatransfer.com:3000/",
		checkCnt : 10,
		sourceDir : "download/",
		sodatransfer: {
			awslb : "jetty-autoscaling",
			checkUrl : "http://localhost:8080/transfer/sodatransferInfo?=",
			targetDir : '/opt/tomcat/webapps',
			targetFile : 'ROOT.war',
			postCmd: 'sudo systemctl stop tomcat; sudo systemctl start tomcat'
		},
		sodatransferjetty: {
			awslb : "jetty-autoscaling",
			checkUrl : "http://localhost:8080/noticeBar2/get?type=greeting",
			targetDir : '/home/ubuntu',
			targetFile : 'ROOT.jar',
			postCmd: 'sudo systemctl stop sodatransfer; sudo systemctl start sodatransfer'
		},
		sodatransfertomcat: {
			awslb : "jetty-autoscaling",
			checkUrl : "http://localhost:8080/noticeBar2/get?type=greeting",
			targetDir : '/opt/tomcat/webapps',
			targetFile : 'ROOT.war',
			postCmd: 'sudo rsync -avP /opt/tomcat/webapps/ROOT/static/dist/ /usr/share/nginx/html/; sudo chmod o+rw /var/www/html/scripts'
		}
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
