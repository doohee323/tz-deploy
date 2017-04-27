#!/bin/bash

#bash /mnt/tz-deploy/helpers/ready_war.sh ${WORKSPACE} ${BRANCH} topzonetomcat dev3.topzone.com pom_dev.xml

echo "---------------------------------------------------------------------------------------"
echo " git for submodule"
echo "---------------------------------------------------------------------------------------"
git config --global credential.helper cache

JENKINS_WORKSPACE="/mnt/workspace"
DEPLOY_DIR="/mnt/tz-deploy"
WORKSPACE="$1"
BRANCH="$2"
DEPLOY_ID="$3"
DOMAIN="$4"
POMFILE="$5"
echo "- JENKINS_WORKSPACE: $JENKINS_WORKSPACE" 
echo "- WORKSPACE: ${WORKSPACE}" 
echo "- BRANCH: ${BRANCH}" 
echo "- DEPLOY_DIR: ${DEPLOY_DIR}"
echo "- DEPLOY_ID: ${DEPLOY_ID}"
echo "- DOMAIN: ${DOMAIN}" 
echo "- POMFILE: ${POMFILE}" 

# git clone https://github.com/Topzone/TopzoneUI.git
echo cd ${WORKSPACE}/extLib/TopzoneUI
cd ${WORKSPACE}/extLib/TopzoneUI
echo git fetch --all
git fetch --all
echo git reset --hard origin/master
git reset --hard origin/master
echo git pull origin master
git pull origin master

echo "---------------------------------------------------------------------------------------"
echo " grunt clean build"
echo "---------------------------------------------------------------------------------------"

cd ${WORKSPACE}/extLib/TopzoneUI
npm install
bower install

echo sed -i "s/localhost:8080/${DOMAIN}/g" app/scripts/app.js
sed -i "s/localhost:8080/${DOMAIN}/g" app/scripts/app.js

grunt clean build

if [[ $? != 0 ]]; then
	echo "---------------------------------------------------------------------------------------"
	echo " UI build fail!"
	echo "---------------------------------------------------------------------------------------"
	exit -1
fi
echo "UI build success!"

echo rm -Rf ${WORKSPACE}/src/main/webapp/static/dist
rm -Rf ${WORKSPACE}/src/main/webapp/static/dist
echo cp -Rf ${WORKSPACE}/extLib/TopzoneUI/dist ${WORKSPACE}/src/main/webapp/static/dist
cp -Rf ${WORKSPACE}/extLib/TopzoneUI/dist ${WORKSPACE}/src/main/webapp/static/dist

echo cp -Rf ${WORKSPACE}/extLib/TopzoneUI/app/img ${WORKSPACE}/src/main/webapp/static/img
cp -Rf ${WORKSPACE}/extLib/TopzoneUI/app/img ${WORKSPACE}/src/main/webapp/static/img

echo "---------------------------------------------------------------------------------------"
echo " maven build"
echo "---------------------------------------------------------------------------------------"

cd ${WORKSPACE}
mvn -f ${POMFILE} clean package

echo "---------------------------------------------------------------------------------------"
echo " make version info"
echo "---------------------------------------------------------------------------------------"

path=`ls ${WORKSPACE}/target/*.war`
echo $path
mkdir -p ${DEPLOY_DIR}/download
cp $path ${DEPLOY_DIR}/download
echo cp $path ${DEPLOY_DIR}/download
#chmod o+rw ${DEPLOY_DIR}/download/*
sudo chmod o+rw ${DEPLOY_DIR}/download/*
file=$(basename $path)
echo $file

cd ${DEPLOY_DIR}/download
pos=`expr index "$file" -`
len=${#file}
let len=len-pos
version=${file:$pos:$len}
version=${version//.war/}
size=`du -b $file | cut -f1`

json='{"file": "'$file'", "version": "'$version'", "size": "'$size'"}'
echo $json
echo ${DEPLOY_DIR}/download/${DEPLOY_ID}_lastest.json
echo $json > ${DEPLOY_DIR}/download/${DEPLOY_ID}_lastest.json

echo rm -Rf ${DEPLOY_DIR}/download/${DEPLOY_ID}_lock.json
rm -Rf ${DEPLOY_DIR}/download/${DEPLOY_ID}_lock.json

echo "---------------------------------------------------------------------------------------"
echo " check out this site."
echo " http://ci.topzone.com:3000/deploylist/${DEPLOY_ID}"
echo "---------------------------------------------------------------------------------------"

exit 0


if [ ! -d "${WORKSPACE}/.git" ]; then
  cd ${WORKSPACE}
  echo git clone -b ${BRANCH} --recursive git@tzweb:Topzone/TopzoneWeb.git TopzoneBoot_dev
  git clone -b ${BRANCH} --recursive git@tzweb:Topzone/TopzoneWeb.git TopzoneBoot_dev
fi

echo cd ${WORKSPACE}
cd ${WORKSPACE}

echo git pull origin ${BRANCH}
git pull origin ${BRANCH}

cd ${WORKSPACE}/extLib/TopzoneUI
git pull origin master

