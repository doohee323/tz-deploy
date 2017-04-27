'use strict';

var postCmd = "sudo chown -Rf tomcat:tomcat /opt/tomcat; " +
			  "sudo rm -Rf /var/www/html_bak; " + 
			  "sudo mv /var/www/html /var/www/html_bak; " + 
			  "sudo mkdir -p /var/www/html; " + 
			  "sudo rsync -avP /opt/tomcat/webapps/ROOT/static/ /var/www/html/ && " + 
			  "sudo rsync -avP /opt/tomcat/webapps/ROOT/static/dist/ /var/www/html/; " + 
			  "sudo chown -Rf www-data:www-data /var/www/html; "
			  
module.exports = {
	app : {
		type : "client",
		name : "sdt-deploy - Staging",
		port : 3000,
		domain : 'http://topzone.com',
		user : 'ubuntu'
	},
	deploy : {
		ciServer: "http://ci.test.com:3000/",
		checkCnt : 15,
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
			checkUrl : "http://localhost:8080/transfer/topzoneInfo?=",
			targetDir : '/home/ubuntu',
			targetFile : 'ROOT.jar',
			postCmd: 'sudo systemctl stop topzone; sudo systemctl start topzone'
		},
		topzonetomcat: {
			awslb : "war-autoscaling",
			regions : "ap-northeast-2,us-west-1",
			checkUrl : "http://localhost:8080/transfer/topzoneInfo?=",
			targetDir : '/opt/tomcat/webapps',
			targetFile : 'ROOT.war',
			postCmd: postCmd
		},
		topzonetomcat2: {
			awslb : "war-autoscaling-prod",
			regions : "us-east-1",
			checkUrl : "http://localhost:8080/transfer/topzoneInfo?=",
			targetDir : '/opt/tomcat/webapps',
			targetFile : 'ROOT.war',
			postCmd: postCmd
		}		
	},
	mysql : {
		env : "local",
		dbUsername : "root",
		dbPassword : "1",
		dbHost : "127.0.0.1",
		port : 3306,
		database : "SdtDeploy",
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
