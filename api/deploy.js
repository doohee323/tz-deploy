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

	// 1. gets lastet.json from ci
	var url = 'http://ci.test.com:3000/download/lastest.json';
	request(url, function(err, response, body) {
		if (!err) {
			logger.info(err)
			throw err;
		}
		var ciJson = JSON.parse(body);
		var localJsonPath = 'download/mine.json';
		fs.readFile(localJsonPath, 'utf8', function(err, data) {
			if (err) {
				logger.info(err)
				throw err;
			}
			logger.info(data);
			var localJson = JSON.parse(data);
			// 2. comparing server's one with local one
			if (ciJson.file != localJson.file || ciJson.version != localJson.version || ciJson.size == localJson.size) {

				// 3. gets new war, if different
				url = 'http://ci.test.com:3000/download/' + localJson.file;
				request(url, function(err, response, body) {
					if (err) {
						logger.info(err)
						throw err;
					}
					// 4. set local version and size with lastest one
					// Iterate over interfaces ...
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
							throw err;
						}

						// 5. set lock on repository
						url = 'http://ci.test.com:3000/lock';
						request.post(url, {
							form : localJson
						}, function(err, response, body) {
							if (err) {
								logger.info(err)
								throw err;
							} else {
								logger.info(body)
							}

							// 6. deploy the lastest one
							var cmd = '/bin/mv ' + config.rootPath + '/download/' + localJson.file + ' ' + config.rootPath
									+ '/target/' + localJson.file;
							logger.info("//////" + cmd)
							utils.runCommands([ cmd ], function(err, results) {
								logger.info(err)
								if (results) {
									logger.info(results)
									// 7. set free on
									// repository
									url = 'http://ci.test.com:3000/free';
									request.post(url, {
										form : localJson
									}, function(err, response, body) {
										if (!err && response.statusCode == 200) {
											logger.info(body)
										}
										return next(0, []);
									}); // 7
								}
							}); // 6
						}); // 5
					}); // 4
				}) // 3
			} else { // 2
				return next(0, []);
			}
		});

	})
};

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
