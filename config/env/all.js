'use strict';

var path = require('path');
var rootPath = path.normalize(__dirname + '/../..');

module.exports = {
	rootPath : rootPath,

	// front-end application directory
	app_dir : '/app',

	// upload directory
	upload_dir : './upload',

	// logs directory
	logs_dir : './logs',

	// expressJwt secret
	sessionSecret : 'sdt-deploy',

	// The name of the MongoDB collection to store sessions in
	sessionCollection : 'sessions'
}

process.env['appKeys'] = 'app_info';
process.env['database'] = 'sdtDeploy';

// url for password email
if (process.env['NODE_ENV'] === 'local' || process.env['NODE_ENV'] === 'development') {
	process.env['url'] = 'ci.test.com:3000';
} else if (process.env['NODE_ENV'] === 'production') {
	process.env['url'] = 'ci.sodatransfer.com:3000';
}

console.log('url:' + process.env['url']);
