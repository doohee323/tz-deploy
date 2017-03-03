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

	// 1. gets lastet.json from ci
	var url = 'http://ci.test.com:3000/download/lastest.json';
	request(url, function(err, response, body) {
		logger.info(err)
		var ciJson = JSON.parse(body);
		var localJsonPath = 'download/mine.json';
		async.waterfall([
				function(callback) {
					fs.readFile(localJsonPath, 'utf8', function(err, data) {
						if (err) {
							logger.info(err)
							throw err;
						}
						logger.info(data);
						var localJson = JSON.parse(data);
						// 2. comparing server's one with local one
						if (ciJson.file != localJson.file || ciJson.version != localJson.version || ciJson.size == localJson.size) {
							callback(null, localJson);
						} else { // 2
							callback(err, null);
						}
					});
				},
				function(localJson, callback) {
					// 3. gets new war, if different
					url = 'http://ci.test.com:3000/download/' + localJson.file;
					request(url, function(err, response, body) {
						if (err) {
							callback(err, null);
						}
						callback(null, localJson);
					}) // 3
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
					request.post('http://ci.test.com:3000/lock', {
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
					var cmd = '/bin/mv ' + config.rootPath + config.deploy.sourceDir + '/' + localJson.file + ' '
							+ config.deploy.targetDir + '/' + localJson.file;
					logger.info(cmd)
					utils.runCommands([ cmd ], function(err, results) {
						if (!results) {
							logger.info(results);
							callback(null, localJson);
						} else {
							logger.info("fail: 6. deploy the lastest one")
							// 7. set free on repository callback(null, localJson);
							return setFree(localJson, next);
						}
					}); // 6
				}, function(localJson, callback) {
					var num = Array.from(Array(10).keys());
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
								if ((response && response.statusCode == 200) || this.cnt == 2) {
									config.req_done = true;
									callback(null, localJson);
								}
							});
						}, i * 2000);
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
	request.post('http://ci.test.com:3000/free', {
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
	logger.info("----config.rootPath:" + config.rootPath)

	var localJson = req.body;
	logger.info("req.body" + req.body)
	var lockPath = config.rootPath + '/download/lock.json';
	logger.info("--------------lockPath:" + lockPath)
	logger.info("--------------localJson:" + JSON.stringify(localJson))
	fs.writeFile(lockPath, JSON.stringify(localJson), 'utf8', function(err, data) {
		logger.info("--------------2")
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

	var lockPath = config.rootPath + '/download/lock.json';
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
