'use strict';

/**
 * Module dependencies.
 */
var express = require('express');
var http = require('http');
var path = require('path');
var fs = require('fs');
var winston = require('winston');
var util = require('util');
var utils = require('./helpers/utils');
var deploy = require('./api/deploy');

/**
 * Main application entry file. Please note that the order of loading is
 * important.
 */

// Load configurations
// Set the node enviornment variable if not set before
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || 3000;

// Initializing system variables
var config = require('./config/config');
var auth = require('./config/authorization');

console.log('process.env.NODE_ENV:' + process.env.NODE_ENV);
console.log('process.env.PORT:' + process.env.PORT);

// // server crash block
// process.on('uncaughtException', function (err) {
// console.log('Caught exception: ' + err);
// });

fs.exists(config.logs_dir, function(exists) {
	if (!exists) {
		fs.mkdir(config.logs_dir);
	}
});

var app = express();

winston.add(winston.transports.DailyRotateFile, {
	level : 'debug',
	json : false,
	filename : config.logs_dir + '/debug-',
	datePattern : 'yyyy-MM-dd.log'
});

process.argv.forEach(function(val, index, array) {
	if (index == 2) {
		if (val == 'server') {
			config.app.type = 'server';
		} else {
			config.app.appName = val;
		}
	}
	if (index == 3) {
		config.app.port = parseInt(val);
	}
});
console.log('config.app.type: ' + config.app.type);

var appExports = module.exports = {};
appExports.config = config;
appExports.utils = utils;
appExports.winston = winston;

// Express settings
require('./config/express')(app);

if (config.app.type == 'client') {
	var cron = require('node-cron');
	cron.schedule('* * * * *', function() {
		deploy.deploy(function() {
			console.log('deploy~~~!!!!');
		});
	});
} else {
	var lockPath = config.rootPath + '/' + config.deploy.sourceDir + '*_lock.json';
	var cmd = 'sudo /bin/rm -rf ' + lockPath;
	console.log(cmd)
	utils.runCommands([ cmd ], {}, function(err, options, results) {
		console.log("==========err: " + err);
		console.log("==========results: " + results);
		if (err) {
			console.log("fail: 6. deploy the lastest one")
		}
	});

}

console.log('started!!!!');
