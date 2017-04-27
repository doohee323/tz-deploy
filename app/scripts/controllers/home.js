'use strict';

/**
 * @ngdoc function
 * @name SdtDeploy.controller:HomeCtrl
 * @description # Controller of the SdtDeploy
 */
angular.module('SdtDeploy').controller(
		'HomeCtrl',
		[
				'$rootScope',
				'$scope',
				'$http',
				'$timeout',
				'$location',
				'socket',
				'StorageCtrl',
				'SessionService',
				'Session',
				'$interval',
				function($rootScope, $scope, $http, $timeout, $location, socket, StorageCtrl, SessionService, Session,
						$interval) {

					$scope.selectView = function(type) {
						var active = $('#view').find("li.active");
						var inactive = $('#view').find("li.inactive#" + type);
						active.removeClass("active");
						active.addClass("inactive");
						inactive.removeClass("inactive");
						inactive.addClass("active");
						if (type == 'deploy') {
							$('.deploy_view').show();
							$('.service_view').hide();
						} else if (type == 'service') {
							$('.deploy_view').hide();
							$('.service_view').show();
						}
					}

					var deploy = $('#deploy_row');
					var deploy_row = deploy.html();
					var service = $('#service_row');
					var service_row = service.html();

					$scope.getList = function() {
						$scope._type = deploy;
						$scope._view = 'view';
						var url = 'http://ci.topzone.com:3000/deploylist/' + $scope.project_id;
						$.ajax({
							url : url,
							type : "GET",
							success : function(data, textStatus, jqXHR) {
								$('#deploy_table').DataTable().destroy();
								deploy.empty();
								for ( var row in data.deploys) {
									var checkUrl = data.deploys[row].checkUrl;
									var domain = checkUrl.substring(0, checkUrl.indexOf('/', 10));
									var file = data.deploys[row].file;
									var size = data.deploys[row].size;
									var statusCode = data.deploys[row].statusCode;
									var type = data.deploys[row].type;
									var version = data.deploys[row].version;
									var row = deploy_row.replace(/DOMAIN/g, domain).replace(/CHECKURL/g, checkUrl).replace(/TYPE/g, type)
											.replace(/VERSION/g, version).replace(/FILE/g, file).replace(/SIZE/g, size).replace(
													/STATUSCODE/g, statusCode);
									var row = row.replace(/spana/g, 'a');
									row = row.replace(/openurl/g, 'href');
									deploy.append(row);
								}
								deploy.css('display', '');

								$('#deploy_table').DataTable({
									"columnDefs" : [ {
										className : "dt-head-center",
										"targets" : [ 1, 2, 3 ]
									} ]
								});

								$('#service_table').DataTable().destroy();
								service.empty();
								for ( var row in data.services) {
									var checkUrl2 = data.services[row].checkUrl;
									var domain2 = checkUrl2.substring(0, checkUrl2.indexOf('/', 10));
									var statusCode2 = data.services[row].statusCode;
									var type2 = data.services[row].type;
									var row = service_row.replace(/DOMAIN2/g, domain2).replace(/CHECKURL2/g, checkUrl2).replace(/TYPE2/g,
											type2).replace(/STATUSCODE2/g, statusCode2);
									var row = row.replace(/spana/g, 'a');
									row = row.replace(/openurl/g, 'href');
									service.append(row);
								}

								$('#service_table').DataTable({
									"columnDefs" : [ {
										className : "dt-head-center",
										"targets" : [ 1, 2, 3 ]
									} ]
								});

							},
							error : function(jqXHR, textStatus, errorThrown) {
								$rootScope.authenticationError = true;
								Session.invalidate();
							}
						});

					}

					$scope.project_id = 'topzonetomcat';

					$scope.getList();

				} ]);
