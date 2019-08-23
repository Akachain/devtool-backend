CC_ID=$1
CC_VER=$2
ZIP_CC_PATH=$3
echo -- build-chaincode-local.sh -- CC_ID:${CC_ID} - CC_VER:${CC_VER} - ZIP_CC_PATH:"${ZIP_CC_PATH}"
mkdir -p $GOPATH/src/${CC_ID}/${CC_VER}/
sleep 5
ls -al  "$ZIP_CC_PATH"
unzip -o "$ZIP_CC_PATH" -d "${GOPATH}/src/${CC_ID}/${CC_VER}/"
echo -- build-chaincode-local.sh -- unzip success
CURRENT_FOLDER=$PWD
cd "${GOPATH}/src/${CC_ID}/${CC_VER}/"
# go build 2> result.txt
go build 2>&2
if [ $? -eq 0 ]; then 
    echo "success"
    cd ${GOPATH}/src/
    rm -rf ${CC_ID}
    exit 0
fi
cd ${GOPATH}/src/
rm -rf ${CC_ID}
exit 1

cd $CURRENT_FOLDER
echo -- build-chaincode-local.sh -- completed!
