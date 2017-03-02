'use strict';

/**
 * Module dependencies.
 */
var logger = require('../app.js').winston;
var config = require('../app.js').config;
var utils = require('../app.js').utils;

/**
 */
exports.download = function(next) {
  return next(0, []);
};

exports.deploylist = function(req, res, next) {
  return next(0, []);
};
