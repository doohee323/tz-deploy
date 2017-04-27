'use strict';

/**
 * @ngdoc overview
 * @name SdtDeploy
 * @description # SdtDeploy
 *
 * Main module of the application.
 */

// for local
var config = {
	domain : 'http://localhost:8080/',
	baseUrl : 'http://localhost:8080/',
	NODE_ENV : 'development',
	socketLogined : false,
	socket_domain : 'http://localhost:8080/',
	defaultKRW : '1,000,000',
	dafaultUSD : '1,000',
	maxKRW : 3000000,
	maxUSD : 3000,
	minKRW : 100000,
	minUSD : 100,
  couponSaveMoney : 45,
	accessible : ['/','/about*','/createProfile','/etc/*','/legal/*','/ref/*','/forgot/*','/update/password/*']
};

// var socketUrl = document.location.protocol + '//' +
// document.location.hostname
// + ':3002' + '/socket.io/socket.io.js';
// document.write('\x3Cscript src="' + socketUrl + '">\x3C/script>');

angular.module(
		'SdtDeploy',
		[ 'ngAnimate', 'ngCookies', 'ngMessages', 'ngResource', 'ngRoute', 'ngSanitize' ])
    .constant('config', config)
    .config(function($routeProvider, $locationProvider, $httpProvider) {

	//$locationProvider.hashPrefix("");

	$httpProvider.interceptors.push('interceptors');

	$routeProvider.when('/', {
		templateUrl : 'views/home.html',
		controller : 'HomeCtrl',
	}).when('/login', {
		templateUrl : 'views/login.html',
		controller : 'LoginCtrl',
		controllerAs : 'login'
	}).otherwise({
		redirectTo : '/'
	});

	$locationProvider.html5Mode(true);

}).run(
		[
				'$rootScope',
				'$http',
				'$timeout',
				'$location',
				'$window',
				'socket',
				'StorageCtrl',
				'SessionService',
				'CommcdCtrl',
				function($rootScope, $http, $timeout, $location, $window, socket, StorageCtrl, SessionService, CommcdCtrl) {
					$rootScope.baseUrl = '/tzUI';

					// below lines are declared in index.html
					var language = navigator.languages && navigator.languages[0] || // Chrome / Firefox
					navigator.language ||   // All browsers
					navigator.userLanguage; // IE <= 10

					$rootScope.$on('$viewContentLoaded', function(event) {
						$rootScope.doTheBack = function() {
							window.history.back();
						};

						var user = SessionService.getSession();
						if (!user.id) {
							var bchk = false;
							for(var i in config.accessible) {
								var rsc = config.accessible[i];
								if(rsc.indexOf('*') > -1) {
									rsc = rsc.substring(0, rsc.indexOf('*'));
									if($location.$$path.indexOf(rsc) > -1) {
										bchk = true;
										break;
									}
								} else {
									if($location.$$path === rsc) {
										bchk = true;
										break;
									}
								}
							}
							if(!bchk) {
								$location.path('/login');
							}
						}

						$rootScope.rejectTypeList = {
							option : CommcdCtrl.getCache('Refuse')
						};
					});


				} ]);
