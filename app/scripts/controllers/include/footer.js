'use strict';

/**
 * @ngdoc function
 * @name SdtDeploy.controller:FooterCtrl
 * @description # FooterCtrl Controller of the SdtDeploy
 */
angular.module('SdtDeploy').controller(
		'FooterCtrl',
		[ '$rootScope', '$scope', '$http', '$timeout', '$location', 'socket', 'StorageCtrl', 'CommcdCtrl',
				'SessionService',
				function($rootScope, $scope, $http, $timeout, $location, socket, StorageCtrl, CommcdCtrl, SessionService) {

					$rootScope.authenticated = SessionService.isLogged();

					$scope.init = function(scope) {
					}

				} ]);
