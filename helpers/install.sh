#!/usr/bin/env bash

if [ "$1" == 'server' ]; then
	sudo mkdir -p /mnt
	cd /mnt
else
	sudo mkdir -p /home/ubuntu
	cd /home/ubuntu
fi

git clone https://github.com/Sodacrew/SodaTransferDeploy.git

cd SodaTransferDeploy

npm install

if [ "$1" == 'server' ]; then
	echo "$1 is emptry! usage) install.sh sodatransfer"
	exit 1;
fi

if [ "$1" == 'server' ]; then
	cd /mnt/SodaTransferDeploy/config/etc/systemd/system
	bash register.sh sdtds
	echo bash register.sh sdtds
else
	cd /mnt/SodaTransferDeploy/config/etc/systemd/system
	bash register.sh $1
	echo bash register.sh $1
fi

exit 0
