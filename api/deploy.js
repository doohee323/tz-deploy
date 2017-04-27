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

	var url = config.deploy.ciServer + config.deploy.sourceDir + appName + '_lastest.json';
	logger.debug(url);
	request(url, function(err, response, body) {
		logger.debug("-- 1. gets lastet.json from ci:" + body);
		if (!response || response.statusCode != 200) {
			return next(0, []);
		}
		var ciJson;
		try {
			ciJson = JSON.parse(body);
		} catch (e) {
			logger.error(e);
			ciJson = JSON.parse('{}');
		}
		var mineJsonPath = config.deploy.sourceDir + appName + '_mine.json';
		if (!config.req_done) {
			config.req_done = -1;
		}
		if (!config.cnt) {
			config.cnt = -1;
		}
		async.waterfall([
				function(callback) {
					logger.debug("-- 2. check my version: " + mineJsonPath);
					fs.readFile(mineJsonPath, 'utf8', function(err, data) {
						if (err) {
							logger.error(err);
							data = '{}';
						}
						var mineJson;
						try {
							logger.debug("-- mineJson:" + data)
							mineJson = JSON.parse(data);
						} catch (e) {
							logger.error(e);
							mineJson = JSON.parse('{}');
						}
						logger.debug("-- 3. comparing server's one with local one");
						if (ciJson.file != mineJson.file || ciJson.version != mineJson.version || ciJson.size != mineJson.size) {
							logger.debug("-- need to be updated!")
							callback(null, ciJson);
						} else { // 2
							logger.debug("-- already updated!")
							return next(0, []);
						}
					});
				},
				function(ciJson, callback) {
					logger.debug("-- 4. check if ci server is locked or not");
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
							logger.debug("-- response.statusCode: " + response.statusCode);
							if (response.statusCode == 404) {
								var adresses = Object.keys(ifaces).reduce(function(result, dev) {
									return result.concat(ifaces[dev].reduce(function(result, details) {
										return result.concat(details.family === 'IPv4' && !details.internal ? [ details.address ] : []);
									}, []));
								});
								logger.debug("-- 5. set lock on ci server with " + adresses);
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
					var depApp = config.deploy[appName].targetFile.substring(0, config.deploy[appName].targetFile
							.lastIndexOf("."));
					var backFolder = config.deploy[appName].targetDir;
					backFolder = backFolder.substring(0, backFolder.lastIndexOf("/"));
					backFolder = backFolder + '/' + depApp + '_bak';
					var cmd = 'sudo /bin/rm -Rf ' + backFolder + '; ' + 'sudo /bin/rm -Rf ' + config.deploy[appName].targetDir
							+ '/' + config.deploy[appName].targetFile + '; ' + 'sudo /bin/mv ' + config.deploy[appName].targetDir
							+ '/' + depApp + ' ' + backFolder + '; ' + 'sudo /bin/rm -rf ' + config.rootPath + '/'
							+ config.deploy.sourceDir + ciJson.file;
					logger.debug("-- 6. clear previous backup and backup working source");
					logger.debug(cmd);
					utils.runCommands([ cmd ], {}, function(err, options, results) {
						logger.debug("-- results: " + results);
						if (err) {
							logger.error("fail: 6. deploy the lastest one")
						}
						logger.debug("-- mineJsonPath: " + mineJsonPath);
						url = config.deploy.ciServer + config.deploy.sourceDir + ciJson.file;
						logger.debug("-- 7. downloading from: " + url + ' to ' + config.rootPath + '/' + config.deploy.sourceDir);
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
					var cmd = 'sudo /bin/rm -rf ' + config.deploy[appName].targetDir + '/' + config.deploy[appName].targetFile;
					logger.debug("-- 8. remove the current one");
					logger.debug(cmd);
					utils.runCommands([ cmd ], {}, function(err, options, results) {
						logger.debug("-- results: " + results);
						if (err) {
							logger.error("fail: 8. remove the current one")
						}
						cmd = 'sudo /bin/mv ' + config.rootPath + '/' + config.deploy.sourceDir + ciJson.file + ' '
								+ config.deploy[appName].targetDir + '/' + config.deploy[appName].targetFile + '; sudo systemctl stop tomcat; sudo systemctl start tomcat;';
						logger.debug("-- 9. deploy the lastest one");
						logger.debug(cmd);
						utils.runCommands([ cmd ], {}, function(err, options, results) {
							logger.debug("-- results: " + results);
							callback(null, ciJson);
						});
					});
				}, function(ciJson, callback) {
					var num = Array.from(Array(config.deploy.checkCnt).keys());
					Object.keys(num).forEach(function(key, i) {
						if (num[key] > config.cnt) {
							setTimeout(function() {
								if (config.req_done != 5) {
									config.cnt = num[key];
									if (config.cnt == (config.deploy.checkCnt - 1)) {
										logger.debug("-- tried: " + config.cnt + ' times, so failed!');
										ciJson.success = false;
										config.req_done = -1;
										config.cnt = -1;
										callback(null, ciJson);
									}
									if (config.cnt > 3) {
										config.cnt = config.cnt - 3;
										logger.debug("-- 10. cheking service:" + config.deploy[appName].checkUrl);
										var options = {
											url : config.deploy[appName].checkUrl,
											method : 'GET'
										};
										request(options, function(err, response, body) {
											if (err) {
												logger.error(err)
											}
											logger.debug("-- config.cnt: " + config.cnt);
											if (response) {
												// logger.debug("-- body: " + body);
												logger.debug("-- response.statusCode: " + response.statusCode);
												if (response.statusCode == 200) {
													logger.debug("-- wait more!: " + config.req_done);
													config.req_done++;
													if (config.req_done == 5) {
														config.req_done = -1;
														config.cnt = -1;
														logger.debug("-- service is OK!");
														ciJson.success = true;
														callback(null, ciJson);
													}
												}
											}
										});
									}
								}
							}, i * 10000);
						}
					});
				}, function(ciJson, callback) {
					if (ciJson.success) {
						logger.debug("-- 11. set local version and size with lastest one");
						logger.debug("write mineJsonPath: " + mineJsonPath);
						fs.writeFile(mineJsonPath, JSON.stringify(ciJson), 'utf8', function(err, data) {
							if (err) {
								logger.error(err)
								callback(err, null);
							}
							callback(null, ciJson);
						});
					} else {
						callback(null, ciJson);
					}
				} ],
				function(err, ciJson) {
					var cmd;
					if (ciJson.success) {
						cmd = config.deploy[appName].postCmd;
						logger.debug("-- 12. run post command");
						logger.info(cmd)
						utils.runCommands([ cmd ], {}, function(err, options, results) {
							logger.debug("-- results: " + results);
							if (err) {
								logger.error("fail: " + config.deploy[appName].postCmd)
							}
							logger.debug("-- 13. set free on repository callback");
							return setFree(ciJson, appName, next);
						});
					} else {
						var depApp = config.deploy[appName].targetFile.substring(0, config.deploy[appName].targetFile
								.lastIndexOf("."));
						var webFolder = config.deploy[appName].targetDir;
						var backFolder = webFolder.substring(0, webFolder.lastIndexOf("/"));
						cmd = 'sudo /bin/rm -Rf ' + webFolder + '/' + depApp + '; ' + 'sudo /bin/rm -Rf ' + webFolder + '/'
								+ config.deploy[appName].targetFile + '; ' + 'sudo /bin/mv ' + backFolder + '/' + depApp + '_bak' + ' '
								+ webFolder + '/' + depApp + '; sudo systemctl stop tomcat; sudo systemctl start tomcat; '
						logger.debug("-- 12. rollback when service fails");
						logger.info(cmd)
						utils.runCommands([ cmd ], {}, function(err, options, results) {
							logger.debug("-- results: " + results);
							if (err) {
								logger.error("fail: " + config.deploy[appName].postCmd)
							}
							return next(0, []);
						});
					}
				})
	})
};

var setFree = function(ciJson, appName, next) {
	var logger = require('../app.js').winston;
	var request = require('request');
	var config = require('../app.js').config;
	logger.debug("-- setFree: " + config.deploy.ciServer + 'free/' + appName);
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
	logger.debug("-- lockPath:" + lockPath)
	logger.debug("-- ciJson:" + JSON.stringify(ciJson))
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

	var lockJson = JSON.parse('{}');
	var appName = req.params.appName;
	logger.debug("-- config.rootPath:" + config.rootPath)
	logger.debug("-- appName:" + appName)
	var lockPath = config.rootPath + '/' + config.deploy.sourceDir + appName + '_lock.json';
	logger.debug("-- lockPath:" + lockPath)
	fs.exists(lockPath, function(exists) {
		if (exists) {
			fs.readFile(lockPath, 'utf8', function(err, data) {
				if (err) {
					logger.error(err);
					data = '{}';
				}
				try {
					logger.debug("-- lockJson:" + data)
					lockJson = JSON.parse(data);
				} catch (e) {
					logger.error(e);
					lockJson = JSON.parse('{}');
				}
				fs.unlink(lockPath);
				logger.info('free!!!!!')
				return next(0, lockJson);
			})
		} else {
			logger.error(lockPath + ' File not found, so not deleting.');
			return next(0, lockJson);
		}
	});
};

exports.deploylist = function(req, res, next) {
	var logger = require('../app.js').winston;
	var config = require('../app.js').config;
	var utils = require('../app.js').utils;
	var request = require('request');
	var async = require('async');

	var appName = req.params.appName;
	if (!config.deploy[appName] || !config.deploy[appName].awslb) {
		return next(0, 'invalid appName!');
	}

	var awslb = config.deploy[appName].awslb;
	var regions = config.deploy[appName].regions;
	var regionarry = [];
	if (regions.indexOf(',') > -1) {
		regionarry = regions.split(',');
	} else {
		regionarry[0] = regions;
	}

	var all = {
		deploys : [],
		services : []
	};
	var regionarry_cnt = 0;
	var server_cnt = 0;
	logger.info('-- regionarry.length: ' + regionarry.length);
	async.forEach(regionarry, function(region, callback2) {
		var cmd = '';
		if (config.app.user != '') {
			cmd = 'su - ' + config.app.user + ' -c "aws elb describe-instance-health --region ' + region
					+ ' --load-balancer-name ' + awslb + '"';
		} else {
			cmd = 'aws elb describe-instance-health --region ' + region + ' --load-balancer-name ' + awslb;
		}
		logger.info(cmd)
		utils.runCommands([ cmd ], region, function(err, region, results) {
			if (err) {
				logger.error("fail: " + err);
				return next(0, []);
			}
			var lbJson;
			try {
				lbJson = JSON.parse(results);
			} catch (e) {
				logger.error(e);
				lbJson = JSON.parse('{}');
			}
			var lbs2 = lbJson.InstanceStates;
			var lbs = lbs2;
			//			for ( var i in lbs2) {
			//				if (lbs2[i].State != 'InService') {
			//					lbs = lbs2.slice(i + 1);
			//				}
			//			}
			for ( var i in lbs) {
				lbs[i].region = region;
			}
			var pbips = [];
			var va = {
				deploys : [],
				services : []
			};
			if (lbs.length == 0) {
				return next(0, all);
			}
			async.waterfall([
					function(callback) {
						Object.keys(lbs).forEach(
								function(idx, i) {
									var lb = lbs[idx];
									logger.debug("lbs InstanceId: " + lb.InstanceId);
									var cmd = '';
									if (config.app.user != '') {
										cmd = 'su - ' + config.app.user + ' -c "aws ec2 describe-instances --region ' + region
												+ ' --instance-ids ' + lb.InstanceId + '"';
									} else {
										cmd = 'aws ec2 describe-instances --region ' + region + ' --instance-ids ' + lb.InstanceId;
									}
									logger.info(cmd);
									utils.runCommands([ cmd ], lbs, function(err, lbs, results) {
										if (err) {
											logger.error("fail: " + err);
											var lbs = {
												pbips : []
											};
											callback(null, lbs);
										} else {
											var instJson;
											try {
												instJson = JSON.parse(results);
											} catch (e) {
												logger.error(e);
												instJson = JSON.parse('{}');
											}
											var pbip = '';
											if (instJson.Reservations.length > 0) {
												pbip = instJson.Reservations[0].Instances[0].PublicIpAddress;
											}
											pbips.push(pbip);
											if (pbips.length == lbs.length) {
												lbs.pbips = pbips;
												callback(null, lbs);
											}
										}
									});
								})
					},
					function(lbs, callback) {
						va.services = [];
						if (lbs.pbips.length == 0) {
							callback(null, va);
						}
						Object.keys(lbs.pbips).forEach(function(jdx, i) {
							var pbip = lbs.pbips[jdx];
							var checkUrl = config.deploy[appName].checkUrl;
							var url = checkUrl.replace("localhost", pbip);
							logger.error("service check: " + url);
							var options = {
								url : url,
								method : 'GET'
							};
							request(options, function(err, response, body) {
								var rslt = {
									checkUrl : this.href,
									type : 'service',
									region : region
								};
								if (err) {
									logger.error(err);
									rslt.statusCode = -1;
								} else if (response) {
									rslt.statusCode = response.statusCode;
								} else {
									rslt.statusCode = -2;
								}
								logger.error("service rslt: " + rslt);
								va.services.push(rslt);
								if (va.services.length == lbs.length) {
									callback(null, va);
								}
							});
						});
					},
					function(va, callback) {
						va.deploys = [];
						if (pbips.length == 0) {
							callback(null, va);
						}
						Object.keys(pbips).forEach(function(jdx, i) {
							var pbip = pbips[jdx];
							var checkUrl = 'http://DOMAIN:3000/' + config.deploy.sourceDir + appName + '_mine.json';
							var url = checkUrl.replace("DOMAIN", pbip);
							var options = {
								url : url,
								method : 'GET'
							};
							request(options, function(err, response, body) {
								var rslt = {
									checkUrl : this.href,
									type : 'client'
								};
								if (err) {
									logger.error(err);
									rslt.statusCode = -1;
								} else if (response) {
									logger.error(body);
									if (body) {
										var mineJson;
										try {
											mineJson = JSON.parse(body);
										} catch (e) {
											logger.error(e);
											mineJson = JSON.parse('{}');
										}
										rslt.file = mineJson.file;
										rslt.size = mineJson.size;
										rslt.version = mineJson.version;
										rslt.statusCode = response.statusCode;
									} else {
										logger.error(body);
										rslt.statusCode = -1;
									}
								} else {
									rslt.statusCode = -2;
								}
								va.deploys.push(rslt);
								if (va.deploys.length == lbs.length) {
									callback(null, va);
								}
							});
						});
					},
					function(va, callback) {
						var url = 'http://localhost:3000/' + config.deploy.sourceDir + appName + '_lastest.json';
						var options = {
							url : url,
							method : 'GET'
						};
						request(options, function(err, response, body) {
							var rslt = {
								checkUrl : this.href,
								type : 'server'
							};
							if (err) {
								logger.error(err);
								rslt.statusCode = -1;
							} else if (response) {
								var ciJson;
								try {
									ciJson = JSON.parse(body);
								} catch (e) {
									logger.error(e);
									ciJson = JSON.parse('{}');
								}
								rslt.file = ciJson.file;
								rslt.size = ciJson.size;
								rslt.version = ciJson.version;
								rslt.statusCode = response.statusCode;
							} else {
								rslt.statusCode = -2;
							}
							va.deploys.push(rslt);
							for ( var i in va.services) {
								logger.error("-- rs.type: " + va.services[i].type + " /rs.checkUrl: " + va.services[i].checkUrl
										+ "/statusCode:" + va.services[i].statusCode);
							}
							for ( var i in va.deploys) {
								logger.error("-- rs.type: " + va.deploys[i].type + " /rs.checkUrl: " + va.deploys[i].checkUrl
										+ "/statusCode:" + va.deploys[i].statusCode);
							}
							regionarry_cnt++;
							callback(null, va);
						});
					} ], function(err, va) {
				for ( var i in va.deploys) {
					if (va.deploys[i].type == 'server') {
						if (server_cnt == 0) {
							all.deploys.push(va.deploys[i]);
						}
						server_cnt++;
					} else {
						all.deploys.push(va.deploys[i]);
					}
				}
				for ( var i in va.services) {
					all.services.push(va.services[i]);
				}
				if (regionarry_cnt == regionarry.length) {
					return next(0, all);
				}
			});
		});

	});
};
