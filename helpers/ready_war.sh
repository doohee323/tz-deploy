#!/usr/bin/env bash

export PJT_DIR=/mnt/SodaTransferDeploy

path=`ls $2/target/*.war`
echo $path
mkdir -p $PJT_DIR/download
cp $path $PJT_DIR/download
chmod o+rw $PJT_DIR/download/*
file=$(basename $path)

cd $PJT_DIR/download
pos=`expr index "$file" -`
len=${#file}
let len=len-pos
version=${file:$pos:$len}
version=${version//.war/}
size=`du -b $file | cut -f1`

json='{"file": "'$file'", "version": "'$version'", "size": "'$size'"}'
echo $json
echo $json > $PJT_DIR/download/$1_lastest.json

exit 0