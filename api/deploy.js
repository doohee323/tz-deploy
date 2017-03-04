'use strict';

/**
 * Module dependencies.
 */

/**
 */
exports.deploy = function(req, res, cb) {

	var logger = require('../app.js').winston;
	var config = require('../app.js').config;
	var utils = require('../app.js').utils;
	var request = require('request');
	var fs = require('fs');
	var ifaces = require('os').networkInterfaces();
	var async = require('async');
	var sleep = require('sleep-promise');
	var download = require('download-file');

	var next = cb;
	if (!next) {
		var next = function(err, data) {
			logger.info("close batch!");
			return;
		}
	}

	// 1. gets lastet.json from ci
	var url = config.deploy.ciServer + config.deploy.sourceDir + 'lastest.json';
	logger.info(url);
	request(url, function(err, response, body) {
		logger.info(err)
		logger.info("--------------ciJson:" + body);
		if (!body) {
			return next(0, []);
		}
		var ciJson = JSON.parse(body);
		var mineJsonPath = config.deploy.sourceDir + 'mine.json';
		logger.info(mineJsonPath);
		async.waterfall([
				function(callback) {
					logger.info("--------------mineJsonPath:" + mineJsonPath)
					fs.readFile(mineJsonPath, 'utf8', function(err, data) {
						if (err) {
							logger.info(err)
							throw err;
						}
						logger.info("--------------mineJson:" + mineJson)
						var mineJson = JSON.parse(data);
						// 2. comparing server's one with local one
						if (ciJson.file != mineJson.file || ciJson.version != mineJson.version || ciJson.size != mineJson.size) {
							callback(null, ciJson);
						} else { // 2
							return next(0, []);
						}
					});
				},
				function(ciJson, callback) {
					var cmd = 'sudo /bin/rm -rf ' + config.rootPath + '/' + config.deploy.sourceDir + ciJson.file;
					logger.info(cmd)
					utils.runCommands([ cmd ], function(err, results) {
						logger.info("==========err: " + err);
						logger.info("==========results: " + results);
						if (err) {
							logger.info("fail: 6. deploy the lastest one")
						}
						logger.info("!!!!!mineJsonPath: " + mineJsonPath);
						// 3. gets new war, if different
						url = config.deploy.ciServer + config.deploy.sourceDir + ciJson.file;
						logger.info("downloading url: " + url + ' to ' + config.deploy.targetFile);
						var options = {
							directory : config.rootPath + '/' + config.deploy.sourceDir,
							filename : ciJson.file
						}
						download(url, options, function(err) {
							if (err) {
								logger.info(err);
								logger.info("Not found: " + url);
								return next(0, []);
							}
							callback(null, ciJson);
						})
					})
				},
				function(ciJson, callback) {
					// 5. check if it can deploy now or not
					var url = config.deploy.ciServer + config.deploy.sourceDir + 'lock.json';
					logger.info(url);
					var options = {
						url : url,
						method : 'GET'
					};
					request(options, function(err, response, body) {
						if (err) {
							logger.info(err)
						}
						if (response) {
							logger.info("---response.statusCode: " + response.statusCode);
							if (response.statusCode == 404) {
								// 4. set lock on repository
								var adresses = Object.keys(ifaces).reduce(function(result, dev) {
									return result.concat(ifaces[dev].reduce(function(result, details) {
										return result.concat(details.family === 'IPv4' && !details.internal ? [ details.address ] : []);
									}, []));
								});
								logger.info(adresses)
								ciJson.ipaddress = adresses;
								request.post(config.deploy.ciServer + 'lock', {
									form : ciJson
								}, function(err, response, body) {
									if (err) {
										logger.info(err)
										callback(err, null);
									} else {
										logger.info(body)
										callback(null, ciJson);
									}
								});
							} else {
								logger.info("can't lock now: " + body);
								return next(0, []);
							}
						}
					});
				},
				function(ciJson, callback) {
					// 6. deploy the lastest one
					var cmd = 'sudo /bin/rm -rf ' + config.deploy.targetDir + '/' + config.deploy.targetFile;
					logger.info(cmd)
					utils.runCommands([ cmd ], function(err, results) {
						logger.info("==========err: " + err);
						logger.info("==========results: " + results);
						if (err) {
							logger.info("fail: 6. deploy the lastest one")
						}
						cmd = 'sudo /bin/mv ' + config.rootPath + '/' + config.deploy.sourceDir + ciJson.file + ' '
								+ config.deploy.targetDir + '/' + config.deploy.targetFile;
						logger.info(cmd)
						utils.runCommands([ cmd ], function(err, results) {
							logger.info("==========err: " + err);
							logger.info("==========results: " + results);
							if (!err) {
								callback(null, ciJson);
							} else {
								logger.info("fail: 6. deploy the lastest one")
								// 7. set free on repository callback(null, ciJson);
								return setFree(ciJson, next);
							}
						}); // 6
					}); // 6
				}, function(ciJson, callback) {
					var num = Array.from(Array(config.deploy.checkCnt).keys());
					config.req_done = false;
					Object.keys(num).forEach(function(key, i) {
						setTimeout(function() {
							if (config.req_done) {
								return;
							}
							logger.info("cheking service:" + config.deploy.checkUrl);
							var options = {
								url : config.deploy.checkUrl,
								method : 'GET',
								cnt : num[key]
							};
							request(options, function(err, response, body) {
								if (err) {
									logger.info(err)
								}
								logger.info("---this.cnt: " + this.cnt);
								if (response) {
									logger.info("---response.statusCode: " + response.statusCode);
									if (response.statusCode == 200) {
										config.req_done = true;
										callback(null, ciJson);
									}
								}
							});
						}, i * 10000);
					});
				}, function(ciJson, callback) {
					// 5. set local version and size with lastest one
					fs.writeFile(mineJsonPath, JSON.stringify(ciJson), 'utf8', function(err, data) {
						if (err) {
							logger.info(err)
							callback(err, null);
						}
						callback(null, ciJson);
					});
				} ], function(err, ciJson) {

			var cmd = 'sudo systemctl restart tomcat';
			logger.info(cmd)
			utils.runCommands([ cmd ], function(err, results) {
				logger.info("==========err: " + err);
				logger.info("==========results: " + results);
				if (err) {
					logger.info("fail: sudo systemctl restart tomcat")
				}
				// 7. set free on repository callback(null, ciJson);
				return setFree(ciJson, next);
			});
		})
	})
};

var setFree = function(ciJson, next) {
	var logger = require('../app.js').winston;
	var request = require('request');
	var config = require('../app.js').config;
	request.post(config.deploy.ciServer + 'free', {
		form : ciJson
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

	var ciJson = req.body;
	logger.info("req.body" + req.body)
	var lockPath = config.rootPath + '/' + config.deploy.sourceDir + 'lock.json';
	logger.info("--------------lockPath:" + lockPath)
	logger.info("--------------ciJson:" + JSON.stringify(ciJson))
	fs.writeFile(lockPath, JSON.stringify(ciJson), 'utf8', function(err, data) {
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
