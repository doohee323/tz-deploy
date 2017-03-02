'use strict';

/**
 * @ngdoc overview
 * @name sdtDeploy
 * @description # sdtDeploy
 * 
 * Main module of the application.
 */

var config = {
  domain : 'http://sodatransfer.com',
  NODE_ENV : 'development'
};

if(location.hostname === 'sodatransfer.com') {
  config.domain = 'http://sodatransfer.com';
}

angular.module(
    'sdtDeploy',
    [ 'ngAnimate', 'ngCookies', 'ngMessages', 'ngResource', 'ngRoute', 'ngFileUpload',
        'ngSanitize', 'ngTouch' ]).constant('config', config).config(
    function($routeProvider) {
      $routeProvider.when('/', {
        templateUrl : 'views/main.html',
        controller : 'MainCtrl',
        controllerAs : 'main'
      }).otherwise({
        redirectTo : '/'
      });
    }).run(
    [ '$rootScope', '$http', '$location',
        function($rootScope, $http, $location) {

          $rootScope.$on('$viewContentLoaded', function() {
          });

        } ]);
