#!/usr/bin/env bash

export SERVICE=$1
# SERVICE=sdtdc_boot
# SERVICE=sdtds
echo $SERVICE

sudo apt-get install systemd-services -y
sudo cp -vp $SERVICE.service /etc/systemd/system/$SERVICE.service
sudo chmod 664 /etc/systemd/system/$SERVICE.service

sudo systemctl daemon-reload
sudo systemctl enable $SERVICE
sudo systemctl start $SERVICE
sudo systemctl status $SERVICE

#sudo systemctl restart sdtds
#sudo systemctl stop sdtds
#sudo systemctl start sdtds
#sudo systemctl status sdtds

exit 0