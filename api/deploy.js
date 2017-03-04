'use strict';

/**
 * Module dependencies.
 */

/**
 */
exports.deploy = function(req, res, next) {

	var logger = require('../app.js').winston;
	var config = require('../app.js').config;
	var utils = require('../app.js').utils;
	var request = require('request');
	var fs = require('fs');
	var ifaces = require('os').networkInterfaces();
	var async = require('async');
	var sleep = require('sleep-promise');
	var download = require('download-file')

	// 1. gets lastet.json from ci
	var url = config.deploy.ciServer + config.deploy.sourceDir + 'lastest.json';
	logger.info(url);
	request(url, function(err, response, body) {
		logger.info(err)
		var ciJson = JSON.parse(body);
		var localJsonPath = config.deploy.sourceDir + 'mine.json';
		logger.info(localJsonPath);
		async.waterfall([
				function(callback) {
					fs.readFile(localJsonPath, 'utf8', function(err, data) {
						if (err) {
							logger.info(err)
							throw err;
						}
						var localJson = JSON.parse(data);
						// 2. comparing server's one with local one
						if (ciJson.file != localJson.file || ciJson.version != localJson.version || ciJson.size == localJson.size) {
							callback(null, localJson);
						} else { // 2
							return next(0, []);
						}
					});
				},
				function(localJson, callback) {
					logger.info("!!!!!localJsonPath: " + localJsonPath);
					// 3. gets new war, if different
					url = config.deploy.ciServer + config.deploy.sourceDir + localJson.file;
					logger.info("downloading url: " + url);
					var options = {
					    directory: config.rootPath + '/' + config.deploy.sourceDir,
					    filename: localJson.file
					}
					download(url, options, function(err){
							if (err) {
								logger.info(err)
								callback(err, null);
							}
							callback(null, localJson);
					}) 
				},
				function(localJson, callback) {
					// 4. set local version and size with lastest one
					var adresses = Object.keys(ifaces).reduce(function(result, dev) {
						return result.concat(ifaces[dev].reduce(function(result, details) {
							return result.concat(details.family === 'IPv4' && !details.internal ? [ details.address ] : []);
						}, []));
					});
					logger.info(adresses)
					localJson = ciJson;
					localJson.ipaddress = adresses;
					fs.writeFile(localJsonPath, JSON.stringify(localJson), 'utf8', function(err, data) {
						if (err) {
							logger.info(err)
							callback(err, null);
						}
						callback(null, localJson);
					}); // 4
				},
				function(localJson, callback) {
					// 5. set lock on repository
					request.post(config.deploy.ciServer + 'lock', {
						form : localJson
					}, function(err, response, body) {
						if (err) {
							logger.info(err)
							callback(err, null);
						} else {
							logger.info(body)
							callback(null, localJson);
						}
					}); // 5
				},
				function(localJson, callback) {
					// 6. deploy the lastest one
					fs.exists(config.deploy.targetDir + '/' + config.deploy.targetFile, function(exists) {
						if (exists) {
							fs.unlink(config.deploy.targetDir + '/' + config.deploy.targetFile);
							logger.info('delete file!: ' + config.deploy.targetDir + '/' + config.deploy.targetFile);
							var cmd = '/bin/mv ' + config.rootPath + '/' + config.deploy.sourceDir + localJson.file + ' '
									+ config.deploy.targetDir + '/' + config.deploy.targetFile;
							logger.info(cmd)
							utils.runCommands([ cmd ], function(err, results) {
								logger.info("==========results: " + results);
								if (!results) {
									callback(null, localJson);
								} else {
									logger.info("fail: 6. deploy the lastest one")
									// 7. set free on repository callback(null, localJson);
									return setFree(localJson, next);
								}
							}); // 6
						} else {
							logger.info('File not found, so not deleting.:' + config.deploy.targetDir + '/' + config.deploy.targetFile);
							return setFree(localJson, next);
						}
					});
				}, function(localJson, callback) {
					var num = Array.from(Array(config.deploy.checkCnt).keys());
					config.req_done = false;
					Object.keys(num).forEach(function(key, i) {
						setTimeout(function() {
							if (config.req_done) {
								return;
							}
							var options = {
								url : config.deploy.checkUrl,
								method : 'GET',
								cnt : num[key]
							};
							request(options, function(err, response, body) {
								if (err) {
									logger.info(err)
								}
								logger.info("---this.cnt:" + this.cnt);
								if ((response && response.statusCode == 200)) {
									config.req_done = true;
									callback(null, localJson);
								}
							});
						}, i * 10000);
					});
				} ], function(err, localJson) {
			// 7. set free on repository callback(null, localJson);
			return setFree(localJson, next);
		})
	})
};

var setFree = function(localJson, next) {
	var logger = require('../app.js').winston;
	var request = require('request');
	var config = require('../app.js').config;
	request.post(config.deploy.ciServer + 'free', {
		form : localJson
	}, function(err, response, body) {
		if (!err && response.statusCode == 200) {
			logger.info(body)
		}
		return next(0, []);
	});
}

exports.lock = function(req, res, next) {
	var logger = require('../app.js').winston;
	var config = require('../app.js').config;
	var fs = require('fs');

	var localJson = req.body;
	logger.info("req.body" + req.body)
	var lockPath = config.rootPath + '/' + config.deploy.sourceDir + 'lock.json';
	logger.info("--------------lockPath:" + lockPath)
	logger.info("--------------localJson:" + JSON.stringify(localJson))
	fs.writeFile(lockPath, JSON.stringify(localJson), 'utf8', function(err, data) {
		if (err) {
			logger.info("write err" + err)
			throw err;
		}
		logger.info('locked!!!!!')
	});
	return next(0, []);
};

exports.free = function(req, res, next) {
	var logger = require('../app.js').winston;
	var config = require('../app.js').config;
	var fs = require('fs');
	logger.info("----config.rootPath:" + config.rootPath)

	var lockPath = config.rootPath + '/' + config.deploy.sourceDir + 'lock.json';
	logger.info("--------------lockPath:" + lockPath)
	fs.exists(lockPath, function(exists) {
		if (exists) {
			fs.unlink(lockPath);
			logger.info('free!!!!!')
		} else {
			logger.info('File not found, so not deleting.');
		}
	});
	return next(0, []);
};

exports.deploylist = function(req, res, next) {
	return next(0, []);
};
