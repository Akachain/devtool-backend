#!/bin/bash

CHAINCODE_ID=$1
CHAINCODE_VER=$2
CC_PATH="$3"
echo CHAINCODE_ID: $CHAINCODE_ID
echo CHAINCODE_VER: $CHAINCODE_VER
echo CC_PATH: $CC_PATH
# set -i
CHAINCODE_FOLDER=$(dirname "$PWD")/devtool-community-network/chaincodes/${CHAINCODE_ID}/${CHAINCODE_VER}
mkdir -p "${CHAINCODE_FOLDER}"

echo CHAINCODE_FOLDER: $CHAINCODE_FOLDER

cp -r $CC_PATH $CHAINCODE_FOLDER

# find=" "
# replace="\ "
# CC_PATH_CV=${CC_PATH//$find/$replace}
# echo CC_PATH_CV: $CC_PATH_CV
# scp -i ~/akachain/key/akc-dev-tool.pem "ubuntu@54.169.63.188:${CC_PATH_CV}" "${CHAINCODE_FOLDER}"
# set +x
CURRENT_FOLDER=${PWD}
cd "${CHAINCODE_FOLDER}"
ZIP_CC=$(ls -t | head -1)
echo ZIP_CC: "$ZIP_CC"
unzip -o "$ZIP_CC"
cd $CURRENT_FOLDER
