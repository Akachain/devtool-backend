/* eslint-disable indent */
/* eslint-disable operator-linebreak */
const path = require('path');
const hfc = require('fabric-client');
const fs = require('fs');
const shell = require('shelljs');
const axios = require('axios');
const loggerCommon = require('../utils/logger.js');
const logger = loggerCommon.getLogger('dev-chaincode-service');
const ccSvc = require('../services/chaincode-service');

hfc.setLogger(logger);

const install = async (data) => {
  const {
    chaincodeId,
    chaincodePath,
    chaincodeVersion,
    orgName,
    language
  } = data;
  logger.debug(`chaincodeId: ${chaincodeId}, chaincodePath: ${chaincodePath}, chaincodeVersion: ${chaincodeVersion}`);
  const resultCheck = await checkCCPath(chaincodePath);
  const fullPath = resultCheck.data;
  logger.debug(`fullPath: ${fullPath}`);

  // const resultBuild = await checkBuild({ chaincodeId, fullPath, chaincodeVersion });
  // logger.debug('Build chaincode: ', resultBuild);
  const result = await requestInstall({
    chaincodeId,
    chaincodePath: fullPath,
    chaincodeVersion,
    orgName,
    language
  });
  result.chaincodeId = chaincodeId;
  logger.info('Request Admin Install Chaincode Result: ', result);
  return result;
};

const checkCCPath = async (chaincodePath) => {
  const ccPath = path.resolve(__dirname, chaincodePath);
  return new Promise((resolve, reject) => {
    fs.stat(ccPath, (err, stats) => {
      if (err || err != null) {
        const msg = `Cannot read file ${ccPath}`;
        reject(msg);
      } else {
        const sizeInMegabytes = stats.size / 1000000.0;
        logger.debug(`chaincode size: ${stats.size} /  1000000.0 = ${sizeInMegabytes}MB`);
        if (sizeInMegabytes > 5.0) {
          const msg = `File invalid ${sizeInMegabytes} > 5MB`;
          reject(msg);
        } else {
          // const zip = new AdmZip(ccPath);
          // const zipEntries = zip.getEntries();
          let isValidType = true;
          let isOnlyFolder = false;
          // let isValidType = true;
          // let isOnlyFolder = true;
          // zipEntries.forEach((zipEntry) => {
          //   if (/.go$/.test(zipEntry.entryName)) {
          //     isOnlyFolder = false;
          //     logger.debug(`go file - ${zipEntry.entryName}`);
          //   } else if (/.json$/.test(zipEntry.entryName)) {
          //     isOnlyFolder = false;
          //     logger.debug(`json file - ${zipEntry.entryName}`);
          //   } else if (/.js$/.test(zipEntry.entryName)) {
          //     isOnlyFolder = false;
          //     logger.debug(`js file - ${zipEntry.entryName}`);
          //   } else if (zipEntry.isDirectory) {
          //     logger.debug(`folder - ${zipEntry.entryName}`);
          //   } else {
          //     isValidType = false;
          //     logger.debug(`entry not valid - ${zipEntry.entryName}`);
          //   }
          // });
          if (!isValidType) {
            const msg = 'Type of zip entriese invalid!';
            reject(msg);
          } else if (isOnlyFolder) {
            const msg = 'File invalid!';
            reject(msg);
          } else {
            resolve({
              data: ccPath,
            });
          }
        }
      }
    });
  });
};

const checkBuild = async (reqData) => {
  const {
    chaincodeId,
    fullPath,
    chaincodeVersion
  } = reqData;
  const scriptsFolder = path.resolve(__dirname, '../scripts');
  return new Promise((resolve, reject) => {
    const result = shell.exec(`${scriptsFolder}/build-chaincode-local.sh ${chaincodeId} ${chaincodeVersion} "${fullPath}"`);
    if (result.code === 0) {
      resolve('Build chaincode success');
    } else {
      logger.debug(`err ${result.code}, stderr ${result.stderr}, stdout ${result.stdout} `);
      reject(new Error(`Build chaincode fail! --- ERROR: ${result.stderr}`));
    }
  });
};

const requestInstall = async (req) => {
  const {
    chaincodeId,
    chaincodeVersion,
    chaincodePath,
    orgName,
    language
  } = req;
  logger.debug(`chaincodeId: ${chaincodeId}, chaincodePath: ${chaincodePath}, chaincodeVersion: ${chaincodeVersion}`);

  const scriptsFolder = path.resolve(__dirname, '../scripts');
  // shell.cd(scriptsFolder);
  // logger.debug('shell pwd: ', shell.pwd().toString());
  const result = shell.exec(`${scriptsFolder}/download-chaincode.sh ${chaincodeId} ${chaincodeVersion} ${chaincodePath}`);
  logger.debug(JSON.stringify(result));
  logger.debug('- cp & unzip chaincode success');

  // INSTALL
  let installResult = false;
  for (let i = 0; i < orgName.length; i++) {
    const data = {
      orgname: orgName[i],
      chaincodeId,
      chaincodePath: `chaincodes/${chaincodeId}/${chaincodeVersion}/`,
      chaincodeVersion,
      chaincodeType: language
    };

    const headers = {
      'content-type': 'application/json'
    };

    const installChaincodeOrgResult = await axios.post(`${DAPP_URL}chaincodes`, data, { headers }).then(res => {
      logger.debug('install chaincode on org succeeded: ', res.data);
      return res;
    }).catch(err => {
      logger.error('install chaincode on org failed: ', err);
      return {
        data: {
          message: `${err}`,
          success: false
        }
      };
    });

    installResult = installChaincodeOrgResult
    if (!installChaincodeOrgResult.data.success) {
      break;
    }
  }
  return installResult.data;

  // return new Promise((resolve, reject) => {
  //   ccSvc.installChaincode(data).then(response => {
  //     logger.debug('Install Admin Chaincode - Success: ', response.data);

  //     resolve({
  //       success: true,
  //       msg: 'Install chaincode success'
  //     });
  //   }).catch(error => {
  //     logger.error('Install Chaincode - ERROR : ', error);
  //     reject({
  //       success: false,
  //       msg: 'Install chaincode failed'
  //     });
  //   });
  // });
};

module.exports = {
  install
};