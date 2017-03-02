'use strict';

module.exports = function(app, fs) {

  // session Routes
  var session = require('../api/session');
  var utils = require('../app.js').utils;
  var config = require('../app.js').config;

  app.get('/', function(req, res) {
    res.render('index', {
      title : "MY HOMEPAGE",
      length : 5
    })
  });

  // ex) http://sodatransfer.com:3000/deploy_insert/doohee323
  app.get('/deploy_insert/:roomid', function(req, res) {
    session.deploy_insert(req, res, function(err, data) {
      return utils.res(res, data);
    });
  });
  
  // ex) http://sodatransfer.com:3000/talklist
  app.get('/talklist', function(req, res) {
    session.talklist(req, res, function(err, data) {
      return utils.res(res, data);
    });
  });
  
  // ex) http://sodatransfer.com:3000/deploylist
  app.get('/deploylist', function(req, res) {
    session.deploylist(req, res, function(err, data) {
      return utils.res(res, data);
    });
  });
  
}
