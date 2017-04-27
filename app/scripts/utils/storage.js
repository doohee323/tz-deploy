'use strict';

angular.module('SdtDeploy').factory('StorageCtrl', function() {
	var $scope;
	function setCache(cacheKey, cacheData, expires) {
		// if (!_super.config.cache.useYn) {
		// return;
		// }
		cacheKey = cacheKey.replace(/&/g, '').replace(/\?/g, '').replace(/,/g, '');
		if (expires === undefined || expires === 'null') {
			expires = 10000;
		}
		var date = new Date();
		var schedule = Math.round((date.setSeconds(date.getSeconds() + expires)) / 1000);
		try {
			sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
			sessionStorage.setItem(cacheKey + '_time', schedule);
		} catch (e) {
			//sessionStorage.clear();
			initCache(cacheKey);
			sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
			sessionStorage.setItem(cacheKey + '_time', schedule);
		}

	}
	function getCache(cacheKey) {
		// if (!_super.config.cache.useYn) {
		// return;
		// }
		cacheKey = cacheKey.replace(/&/g, '').replace(/\?/g, '').replace(/,/g, '');
		var date = new Date();
		var current = Math.round(+date / 1000);
		var stored_time = sessionStorage.getItem(cacheKey + '_time');
		if (stored_time === undefined || stored_time === 'null') {
			stored_time = 0;
		}
		if (stored_time < current) {
			initCache(cacheKey);
			return JSON.parse("{}");
		} else {
			return JSON.parse(sessionStorage.getItem(cacheKey) || "{}");
		}
	}

	function initCache(cacheKey) {
		cacheKey = cacheKey.replace(/&/g, '').replace(/\?/g, '').replace(/,/g, '');
		sessionStorage.setItem(cacheKey, null);
		sessionStorage.setItem(cacheKey + '_time', null);
	}

	return {
		setCache : setCache,
		getCache : getCache,
		initCache : initCache
	};
});

angular.module('SdtDeploy').service('Session', function(StorageCtrl) {
	this.create = function(data) {
		StorageCtrl.setCache('session', data, 10000);
	};
	this.invalidate = function() {
		StorageCtrl.initCache('session');
	};
	return this;
});
