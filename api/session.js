'use strict';

/**
 * Module dependencies.
 */
var logger = require('../app.js').winston;
var config = require('../app.js').config;
var utils = require('../app.js').utils;

/**
 */
exports.deploy_insert = function(req, res, next) {
  var roomid =  req.params.roomid;
  var rslt = [];
  // node server to client broadcasting!
  var url = config.deploy.domain + ':' + config.deploy.port + '/sdt_deploy';
  return next(0, rslt);
};

exports.talklist = function(req, res, next) {
  return next(0, []);
};

exports.deploylist = function(req, res, next) {
  return next(0, []);
};
