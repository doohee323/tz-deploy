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

  // ex) http://sodatransfer.com:3000/download
  app.get('/download', function(req, res) {
    deploy.download(req, res, function(err, data) {
      return utils.res(res, data);
    });
  });
  
  // ex) http://sodatransfer.com:3000/deploylist
  app.get('/deploylist', function(req, res) {
    deploy.deploylist(req, res, function(err, data) {
      return utils.res(res, data);
    });
  });
  
}
