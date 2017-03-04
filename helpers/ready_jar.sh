#!/usr/bin/env bash

export PJT_DIR=/mnt/SodaTransferDeploy

echo $1
echo $2

path=`ls $2/target/*.jar`
echo $path
mkdir -p $PJT_DIR/download
cp $path $PJT_DIR/download
chmod o+rw $PJT_DIR/download/*
file=$(basename $path)

pos=`expr index "$file" -`
len=${#file}
let len=len-pos
version=${file:$pos:$len}
version=${version//.jar/}

json='{"file": "'$file'", "version": "'$version'"}'
echo $json
echo $json > $PJT_DIR/download/$1_lastest.json

exit 0