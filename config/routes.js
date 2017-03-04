'use strict';

module.exports = function(app, fs) {

	// deploy Routes
	var deploy = require('../api/deploy');
	var utils = require('../app.js').utils;
	var config = require('../app.js').config;

	app.get('/', function(req, res) {
		res.render('index', {
			title : "MY HOMEPAGE",
			length : 5
		})
	});

	// ex) http://ci.sodatransfer.com:3000/deploy
	app.get('/deploy/:appName', function(req, res) {
		deploy.deploy(req, res, function(err, data) {
			return utils.res(res, data);
		});
	});

	// ex) http://ci.sodatransfer.com:3000/lock
	app.post('/lock/:appName', function(req, res) {
		deploy.lock(req, res, function(err, data) {
			return utils.res(res, data);
		});
	});

	// ex) http://ci.sodatransfer.com:3000/free
	app.post('/free/:appName', function(req, res) {
		deploy.free(req, res, function(err, data) {
			return utils.res(res, data);
		});
	});

	// ex) http://ci.sodatransfer.com:3000/deploylist
	app.get('/deploylist/:appName', function(req, res) {
		deploy.deploylist(req, res, function(err, data) {
			return utils.res(res, data);
		});
	});

}
