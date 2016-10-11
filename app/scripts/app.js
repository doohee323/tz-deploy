'use strict';

/**
 * @ngdoc overview
 * @name tzSocket
 * @description # tzSocket
 * 
 * Main module of the application.
 */

var config = {
  domain : 'http://www.tzchat.net',
  NODE_ENV : 'development',
  socketLogined : false
};

if(location.hostname === 'xxx.xxx.xxx.xxx') {
  config.domain = 'http://xxx.xxx.xxx.xxx';
}

angular.module(
    'tzSocket',
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
