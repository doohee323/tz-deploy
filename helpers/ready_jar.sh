#!/usr/bin/env bash

export PJT_DIR=/mnt/SodaTransferDeploy

path=`ls $1/target/*.war`
echo $path
cp $path $PJT_DIR/download
chmod o+rw $PJT_DIR/download/*
file=$(basename $path)

pos=`expr index "$file" -`
len=${#file}
let len=len-pos
version=${file:$pos:$len}
version=${version//.war/}

json='{"file": "'$file'", "version": "'$version'"}'
echo $json
echo $json > $PJT_DIR/download/lastest.json

exit 0