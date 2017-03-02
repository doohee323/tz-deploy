'use strict';

module.exports = {
    app: {
      name: "sdt-deploy - Staging",
      port: 3000,
			domain: 'http://sodatransfer.com',
			instance_no: 0
    },
    mysql: {
      env: "local",
			dbUsername: "root",
			dbPassword: "1",
      dbHost: "127.0.0.1",
      port: 3306,
      database: "sdtDeploy",
      connectionLimit: 100,
			poolUseYn: true        
    },
    logging: {
			client: true,      
			sql: true,      
			debug: true,      
			input: true,      
			output: true      
    }
}

// local, staging, production
process.env['NODE_ENV'] = 'development';

