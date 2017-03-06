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

	var appName;
	if (req && req.params) {
		appName = req.params.appName;
	} else {
		appName = config.app.appName;
	}

	var next = cb;
	if (!next) {
		var next = function(err, data) {
			logger.debug("close batch!");
			return;
		}
	}

	// 1. gets lastet.json from ci
	var url = config.deploy.ciServer + config.deploy.sourceDir + appName + '_lastest.json';
	logger.debug(url);
	request(url, function(err, response, body) {
		logger.debug(err)
		logger.debug("--------------ciJson:" + body);
		if (response.statusCode != 200) {
			return next(0, []);
		}
		var ciJson = JSON.parse(body);
		var mineJsonPath = config.deploy.sourceDir + appName + '_mine.json';
		logger.debug(mineJsonPath);
		async.waterfall([
				function(callback) {
					logger.debug("--------------mineJsonPath:" + mineJsonPath)
					fs.readFile(mineJsonPath, 'utf8', function(err, data) {
						if (err) {
							logger.error(err);
							data = '{}';
						}
						var mineJson = JSON.parse(data);
						logger.debug("--------------mineJson:" + mineJson)
						// 2. comparing server's one with local one
						if (ciJson.file != mineJson.file || ciJson.version != mineJson.version || ciJson.size != mineJson.size) {
							callback(null, ciJson);
						} else { // 2
							return next(0, []);
						}
					});
				},
				function(ciJson, callback) {
					// 3. check if it can deploy now or not
					var url = config.deploy.ciServer + config.deploy.sourceDir + appName + '_lock.json';
					logger.debug(url);
					var options = {
						url : url,
						method : 'GET'
					};
					request(options, function(err, response, body) {
						if (err) {
							logger.error(err)
						}
						if (response) {
							logger.debug("---response.statusCode: " + response.statusCode);
							if (response.statusCode == 404) {
								// 4. set lock on repository
								var adresses = Object.keys(ifaces).reduce(function(result, dev) {
									return result.concat(ifaces[dev].reduce(function(result, details) {
										return result.concat(details.family === 'IPv4' && !details.internal ? [ details.address ] : []);
									}, []));
								});
								logger.debug(adresses)
								ciJson.ipaddress = adresses;
								request.post(config.deploy.ciServer + 'lock/' + appName, {
									form : ciJson
								}, function(err, response, body) {
									if (err) {
										logger.error(err)
										callback(err, null);
									} else {
										logger.debug(body)
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
					var cmd = 'sudo /bin/rm -rf ' + config.rootPath + '/' + config.deploy.sourceDir + ciJson.file;
					logger.debug(cmd)
					utils.runCommands([ cmd ], {}, function(err, options, results) {
						logger.debug("==========err: " + err);
						logger.debug("==========results: " + results);
						if (err) {
							logger.error("fail: 6. deploy the lastest one")
						}
						logger.debug("!!!!!mineJsonPath: " + mineJsonPath);
						// 5. gets new war, if different
						url = config.deploy.ciServer + config.deploy.sourceDir + ciJson.file;
						logger.info("downloading url: " + url + ' to ' + config.deploy[appName].targetFile);
						var options = {
							directory : config.rootPath + '/' + config.deploy.sourceDir,
							filename : ciJson.file
						}
						download(url, options, function(err) {
							if (err) {
								logger.error(err);
								logger.error("Not found: " + url);
								return next(0, []);
							}
							callback(null, ciJson);
						})
					})
				},
				function(ciJson, callback) {
					// 6. deploy the lastest one
					var cmd = 'sudo /bin/rm -rf ' + config.deploy[appName].targetDir + '/' + config.deploy[appName].targetFile;
					logger.debug(cmd)
					utils.runCommands([ cmd ], {}, function(err, options, results) {
						logger.debug("==========err: " + err);
						logger.debug("==========results: " + results);
						if (err) {
							logger.error("fail: 6. deploy the lastest one")
						}
						cmd = 'sudo /bin/mv ' + config.rootPath + '/' + config.deploy.sourceDir + ciJson.file + ' '
								+ config.deploy[appName].targetDir + '/' + config.deploy[appName].targetFile;
						logger.debug(cmd)
						utils.runCommands([ cmd ], {}, function(err, options, results) {
							logger.debug("==========err: " + err);
							logger.debug("==========results: " + results);
							if (!err) {
								callback(null, ciJson);
							} else {
								logger.error("fail: 6. deploy the lastest one")
								// 7. set free on repository callback(null, ciJson);
								return setFree(ciJson, appName, next);
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
							var cnt = num[key];
							if (cnt > 3) {
								cnt = cnt - 3;
								logger.info("cheking service:" + config.deploy[appName].checkUrl);
								var options = {
									url : config.deploy[appName].checkUrl,
									method : 'GET',
									cnt : cnt
								};
								request(options, function(err, response, body) {
									if (err) {
										logger.error(err)
									}
									logger.debug("---this.cnt: " + this.cnt);
									if (response) {
										logger.debug("---response.statusCode: " + response.statusCode);
										logger.debug("---body: " + body);
										if (response.statusCode == 200) {
											config.req_done = true;
											callback(null, ciJson);
										}
									}
								});
							}
						}, i * 20000);
					});
				}, function(ciJson, callback) {
					// 5. set local version and size with lastest one
					logger.debug("write mineJsonPath: " + mineJsonPath);
					fs.writeFile(mineJsonPath, JSON.stringify(ciJson), 'utf8', function(err, data) {
						if (err) {
							logger.error(err)
							callback(err, null);
						}
						callback(null, ciJson);
					});
				} ], function(err, ciJson) {

			var cmd = config.deploy[appName].postCmd;
			logger.info(cmd)
			utils.runCommands([ cmd ], {}, function(err, options, results) {
				logger.debug("==========err: " + err);
				logger.debug("==========results: " + results);
				if (err) {
					logger.error("fail: " + config.deploy[appName].postCmd)
				}
				// 7. set free on repository callback(null, ciJson);
				return setFree(ciJson, appName, next);
			});
		})
	})
};

var setFree = function(ciJson, appName, next) {
	var logger = require('../app.js').winston;
	var request = require('request');
	var config = require('../app.js').config;
	request.post(config.deploy.ciServer + 'free/' + appName, {
		form : ciJson
	}, function(err, response, body) {
		if (!err && response.statusCode == 200) {
			logger.debug(body)
		}
		return next(0, []);
	});
}

exports.lock = function(req, res, next) {
	var logger = require('../app.js').winston;
	var config = require('../app.js').config;
	var fs = require('fs');

	var appName = appName = req.params.appName;
	var ciJson = req.body;
	logger.debug("req.body" + req.body)
	var lockPath = config.rootPath + '/' + config.deploy.sourceDir + appName + '_lock.json';
	logger.debug("--------------lockPath:" + lockPath)
	logger.debug("--------------ciJson:" + JSON.stringify(ciJson))
	fs.writeFile(lockPath, JSON.stringify(ciJson), 'utf8', function(err, data) {
		if (err) {
			logger.error("write err" + err)
		} else {
			logger.info('locked!!!!!')
		}
	});
	return next(0, []);
};

exports.free = function(req, res, next) {
	var logger = require('../app.js').winston;
	var config = require('../app.js').config;
	var fs = require('fs');
	logger.debug("----config.rootPath:" + config.rootPath)

	var appName = appName = req.params.appName;
	var lockPath = config.rootPath + '/' + config.deploy.sourceDir + appName + '_lock.json';
	logger.debug("--------------lockPath:" + lockPath)
	fs.exists(lockPath, function(exists) {
		if (exists) {
			fs.unlink(lockPath);
			logger.info('free!!!!!')
		} else {
			logger.error('File not found, so not deleting.');
		}
	});
	return next(0, []);
};

exports.deploylist = function(req, res, next) {
	var logger = require('../app.js').winston;
	var config = require('../app.js').config;
	var utils = require('../app.js').utils;
	var request = require('request');
	var async = require('async');

	var cmd = 'su - ubuntu -c "aws elb describe-instance-health --load-balancer-name jetty-autoscaling"';
	logger.info(cmd)
	utils.runCommands([ cmd ], {}, function(err, options, results) {
		// logger.debug("==========results: " + results);
		if (err) {
			logger.error("fail: " + err);
		}
		var lbJson = JSON.parse(results);
		var lbs = lbJson.InstanceStates;
		async.waterfall([ function(callback) {
			Object.keys(lbs).forEach(function(idx, i) {
				var lb = lbs[idx];
				logger.error("lbs InstanceId: " + lb.InstanceId);
				var cmd = 'su - ubuntu -c "aws ec2 describe-instances --instance-ids ' + lb.InstanceId + '"';
				logger.info(cmd);
				utils.runCommands([ cmd ], idx, function(err, idx, results) {
					if (err) {
						logger.error("fail: " + err);
					}
					var instJson = JSON.parse(results);
					var pbip = instJson.Reservations[0].Instances[0].PublicIpAddress;
					// logger.error("==========pbip: " + pbip);
					pbips.push(pbip);
				});
			})
		}, function(pbips, callback) {
			var resultArry = [];
			Object.keys(pbips).forEach(function(jdx, i) {
				var pbip = pbips[jdx];
				var checkUrl = "http://DOMAIN:3000/download/sodatransferboot_mine.json";
				var url = checkUrl.replace("DOMAIN", pbip);
				logger.error("==========url: " + url);
				var options = {
					url : url,
					method : 'GET',
					jdx : jdx
				};
				request(options, function(err, response, body) {
					logger.error("==========this.checkUrl: " + this.checkUrl);
					logger.error("==========this.jdx: " + this.jdx);
					var rslt = {
						checkUrl : this.href
					};
					if (err) {
						logger.error(err);
						rslt.statusCode = -1;
					}
					if (response) {
						logger.debug("---response: " + response);
						logger.debug("---body: " + body);
						logger.debug("---response.statusCode: " + response.statusCode);
						rslt.statusCode = response.statusCode;
					} else {
						rslt.statusCode = -2;
					}
					resultArry.push(rslt);
				});
			});
		}, function(resultArry, callback) {
			for ( var i in resultArry) {
				logger.error("==========rs.checkUrl: " + resultArry[i].checkUrl + "/statusCode:" + resultArry[i].statusCode);
			}
			return next(0, []);
		} ], function(err, ciJson) {
			// 7. set free on repository callback(null, ciJson);
			return setFree(ciJson, appName, next);
		});

		// http://ci.sodatransfer.com:3000/download/sodatransferboot_lastest.json
		// http://13.124.49.60:3000/download/sodatransferboot_mine.json
		// http://13.124.29.171:3000/download/sodatransferboot_mine.json
		//
		// http://13.124.49.60:8080/home2
		// http://13.124.29.171:8080/home2
	});
};
