/**
 * @ngdoc filters
 * @name SdtDeploy.filters
 * @description # Filters of the SdtDeploy
 */
angular.module('SdtDeploy').filter('setComma',
  function() {
    return function(inNum) {
      var outNum;
      outNum = inNum;
      while (rgx2.test(outNum)) {
        outNum = outNum.replace(rgx2, '$1' + ',' + '$2');
      }
      return outNum;
    }

  });

