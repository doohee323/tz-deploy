'use strict';

/**
 * @ngdoc function
 * @name SdtDeploy.controller:DefaultCtrl
 * @description # Controller of the SdtDeploy
 */
angular.module('SdtDeploy').controller(
		'DefaultCtrl',
		[ '$scope', '$http', '$timeout', '$location', 'socket', 'StorageCtrl', 'SessionService', 'CommcdCtrl',
				function($scope, $http, $timeout, $location, socket, StorageCtrl, SessionService, CommcdCtrl) {

					$scope.init = function(scope) {

					}
				} ]);
