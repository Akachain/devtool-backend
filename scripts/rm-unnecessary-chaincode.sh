#!/bin/bash

function printInColor() {
    color1=$1
    message1=$2
    color2=$3
    message2=$4
    echo -e "\033[${color1}m${message1}\033[m\033[${color2}m$message2\033[m"
}

function printRedYellow() {
    printInColor "1;31" "$1" "1;33" "$2"
}

function printUsage() {
    usageMsg=$1
    exampleMsg=$2
    printRedYellow "\nUsage:" "$usageMsg"
    printRedYellow "\nExample:" "$exampleMsg"
}

CHAINCODE_ID=${1:?`printRedYellow "Error: " "ChaincodeId must be specified"`}
CHAINCODE_VER=${2:?`printRedYellow "Error: " "ChaincodeVersion must be specified"`}

echo " ● clean docker container"
DOCKER_CHAINCODE=$(docker ps -a | grep "${CHAINCODE_ID}-${CHAINCODE_VER}" | awk '{print $1}')
set -- "$DOCKER_CHAINCODE" 
IFS=$'\n'; declare -a Array=($*) 
if [ ${#Array[@]} -gt 0 ]; then
    docker rm -f $DOCKER_CHAINCODE
fi

echo " ● clean docker images"
DOCKER_IMAGE=$(docker images | grep "${CHAINCODE_ID}-${CHAINCODE_VER}" | awk '{print $1}')
set -- "$DOCKER_IMAGE" 
IFS=$'\n'; declare -a Array=($*) 
if [ ${#Array[@]} -gt 0 ]; then
    docker rmi -f $DOCKER_IMAGE
fi

echo " ● clean peer"
DOCKER_PEER=$(docker ps -a | grep "peer" | awk '{print $14}' | grep "peer")
set -- "$DOCKER_PEER" 
IFS=$'\n'; declare -a Array=($*) 
max=`expr ${#Array[@]} - 1`
for i in `seq 0 $max`
do
    echo "   └ ${Array[i]}"
    docker exec ${Array[i]} rm -rf /var/hyperledger/production/chaincodes/${CHAINCODE_ID}.${CHAINCODE_VER}
done 
echo " ● clean chaincode folder"
echo "   └ /home/ubuntu/akachain/akc-admin/artifacts/src/chaincodes/${CHAINCODE_ID}"
rm -rf /home/ubuntu/akachain/akc-admin/artifacts/src/chaincodes/${CHAINCODE_ID}
echo "   └ /home/ubuntu/akachain/chaincodes/*${CHAINCODE_ID}*"
rm -rf /home/ubuntu/akachain/chaincodes/*${CHAINCODE_ID}*
echo "done"
