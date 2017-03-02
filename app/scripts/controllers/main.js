'use strict';

/**
 * @ngdoc function
 * @name sdtDeploy.controller:MainCtrl
 * @description # MainCtrl Controller of the sdtDeploy
 */
angular.module('sdtDeploy').controller('MainCtrl',
    function($scope) {

      $scope.sendMsg = function(scope) {
        debugger;
        console.log('----------------' + scope.text1);
      };

    });
