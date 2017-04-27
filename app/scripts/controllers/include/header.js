'use strict';

/**
 * @ngdoc function
 * @name SdtDeploy.controller:HeaderCtrl
 * @description # HeaderCtrl Controller of the SdtDeploy
 */
angular.module('SdtDeploy').controller(
		'HeaderCtrl',
		[
				'$rootScope',
				'$scope',
				'$http',
				'$timeout',
				'$location',
				'socket',
				'StorageCtrl',
				'CommcdCtrl',
				'SessionService',
				'$interval',
				'$window',
				function($rootScope, $scope, $http, $timeout, $location, socket, StorageCtrl, CommcdCtrl, SessionService,
						$interval) {

					$rootScope.authenticated = SessionService.isLogged();
					window.sc = $scope;

					$scope.init = function(scope) {

					}

				} ]);
