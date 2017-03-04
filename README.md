# SodaTransferDeploy app

1. run the app on local env
```
- run server
	/mnt/SodaTransferDeploy$ node app.js server &
- run client
	/mnt/SodaTransferDeploy$ node app.js ${appName} &
	ex) node app.js sodatransfer &
- kill node
	/mnt/SodaTransferDeploy$ killall node

- debug on local
	npm install devtool -g
	devtool app.js --index index.html --watch
	
	with appName parameter
	devtool app.js sodatransfer --index index.html --watch

```

2. set jenkins's Execute Shell
```
bash /mnt/SodaTransferDeploy/helpers/ready_war.sh sodatransfer ${WORKSPACE}

or 

bash /mnt/SodaTransferDeploy/helpers/ready_war.sh sodatransferboot ${WORKSPACE}

or

bash /mnt/SodaTransferDeploy/helpers/ready_jar.sh sodatransfer ${WORKSPACE}

```

* Workflow for deploy
```
[for consumer] check lastest with polling
1. gets lastet.json from ci
  - ci: 
  	wget http://ci.sodatransfer.com:3000/download/lastest.json
  	
2. comparing server's one with local one
  - local: {app.path}/download/mime.json
	{ipaddress: '13.1.1.2', file: 'sodatransfer-1.0.0-SNAPSHOT-jar-with-dependencies.jar', version: '1.0.0-SNAPSHOT', size: 2000}

3. gets new war, if different
	wget http://ci.sodatransfer.com:3000/download/sodatransfer-1.0.0-SNAPSHOT-jar-with-dependencies.jar 
		to {app.path}/download

4. set local version and size with lastest one
  - local: {app.path}/download/mime.json
	{ipaddress: '13.1.1.2', file: 'sodatransfer-1.0.0-SNAPSHOT-jar-with-dependencies.jar', version: '1.0.0-SNAPSHOT', size: 2000}
  	
5. set lock on repository
  	put http://ci.sodatransfer.com:3000/lock
  	- ci: {app.path}/download/lock.json
	{ipaddress: '13.1.1.2', file: 'sodatransfer-1.0.0-SNAPSHOT-jar-with-dependencies.jar', version: '1.0.0-SNAPSHOT', size: 2000}

6. deploy the lastest one
	mv sodatransfer-1.0.0-SNAPSHOT-jar-with-dependencies.jar to target dir

7. set free on repository
	put http://ci.sodatransfer.com:3000/free
	- ci: remove {app.path}/download/lock.json

cf. get consumer's version
  	get http://13.1.1.2:3000/download/mime.json
  	- local: {app.path}/download/mime.json
  	{ipaddress: '13.1.1.2', file: 'sodatransfer-1.0.0-SNAPSHOT-jar-with-dependencies.jar', version: '1.0.0-SNAPSHOT', size: 2000}

cf. get lock from ci
  	get http://ci.sodatransfer.com:3000/lock
  	{ipaddress: '13.1.1.2', file: 'sodatransfer-1.0.0-SNAPSHOT-jar-with-dependencies.jar', version: '1.0.0-SNAPSHOT', size: 2000}

```