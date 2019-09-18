const express = require('express');
const router = express.Router();
// require multer for the file uploads
const multer = require('multer');
const response = require('../utils/response');
const loggerCommon = require('../utils/logger.js');
const logger = loggerCommon.getLogger('Upload');
const common = require('../utils/common');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

const chaincode = require('../query/chaincode');
const installChaincodeSvc = require('../services/install-chaincode-service');
const ccSvc = require('../services/chaincode-service');

// set the directory for the uploads to the uploaded to
// const DIR = '/home/ubuntu/akachain/chaincode/';
// const DIR = './chaincode';
const DIR = path.resolve(__dirname, '../chaincode');
let chaincodeId = 0;
const storageUser = multer.diskStorage({ //multers disk storage settings
  destination: (req, file, cb) => {
    createDestination(req, cb);
  },
  filename: (req, file, cb) => {
    checkFileValidation(req, file, cb);
  }
});
const upload = multer({
  storage: storageUser,
  limits: { fileSize: 5000000 }
}).any();

// our file upload .
router.post('/', (req, res, next) => {

  // execute upload file
  upload(req, res, async (err) => {
    if (err) {
      // An error occurred when uploading
      logger.error(err);
      switch (err.code) {
        case 'LIMIT_FILE_SIZE':
          return res.json(response.errorResponse('E004'));
        default:
          logger.error('upload', err.code);
          return res.json(response.errorResponse(err.code));
      }
    } else {
      if (req.files.length === 0) {
        return res.json(response.errorResponse('E006'));
      } else {
        // No error occured.
        if (req.body.chaincodeId) { // upgrade chaincode case

          const chaincodeVersion = common.versionUp(req.body.chaincodeVersion);
          const updateData = {
            chaincodeId: req.body.chaincodeId + '',
            path: `${req.files[0].destination}/${req.files[0].filename}`,
            size: req.files[0].size,
            name: req.files[0].filename,
            version: chaincodeVersion,
            language: req.body.language
          };
          chaincode.updateChaincode(updateData, async (err, updateRes) => {
            if (err) {
              logger.error('updateChaincode', err);
              return res.json(response.errorResponse('E002'));
            } else {
              logger.info('*********    update data to db offchain successfully!    *********');

              res.io.sockets.emit('upg_cc', 'upgrading');
              res.json(response.successResponse('E008'));

              const installData = {
                chaincodeId: req.body.chaincodeId + '',
                chaincodePath: `${req.files[0].destination}/${req.files[0].filename}`,
                chaincodeVersion: chaincodeVersion + '',
                language: req.body.language,
                orgName: req.body.orgName.map(org => org.toLowerCase()), //accept lowercase only,,
                channelName: req.body.channelName
              };

              try {

                const result = await installChaincodeSvc.install(installData);
                logger.debug('result', result);
                if (result.success) {
                  const upgradeData = {
                    orgname: req.body.orgName[0].toLowerCase(), //accept lowercase only,
                    channelName: req.body.channelName,
                    chaincodeId: req.body.chaincodeId + '',
                    chaincodeVersion: chaincodeVersion + '',
                    chaincodeType: req.body.language,
                    args: req.body.args? JSON.parse(req.body.args): req.body.args
                  };
                  axios.post(`${DAPP_URL}upgradeChainCode`, upgradeData).then(upgradeResult => {
                    console.log('upgrade chaincode response: ', upgradeResult.data);
                    if (upgradeResult.data.success) {
                      res.io.sockets.emit('upg_cc', 'upgrade_succeeded');

                      // parallel thread running to update chaincode status when success
                      const updateData = {
                        id: req.body.chaincodeId + '',
                        upgradeStatus: 'success'
                      };
                      chaincode.updateUpgradeStatus(updateData, (errInit, upgStatus) => {
                        if (errInit) {
                          logger.error('upgrade cc status failed', errInit);
                        }
                      });

                    }
                  }).catch(err => {
                    logger.error('upgrade chaincode dapp error: ', err.response.data);
                    res.io.sockets.emit('upg_cc', 'upgrade_failed');

                    const data = {
                      id: req.body.chaincodeId + '',
                      upgradeStatus: 'fail'
                    };
                    chaincode.updateUpgradeStatus(data, function (errInit, upgStatus) {
                      if (errInit) {
                        logger.error('upgrade cc status failed', errInit);
                      }
                    });
                  });
                }
              } catch (err) {
                logger.error('upgrade chaincode dapp error: ', err);
                res.io.sockets.emit('upg_cc', 'upgrade_failed');

                const data = {
                  id: req.body.chaincodeId + '',
                  upgradeStatus: 'fail'
                };
                chaincode.updateUpgradeStatus(data, function (errInit, upgStatus) {
                  if (errInit) {
                    logger.error('upgrade cc status failed', errInit);
                  }
                });
              }
            }
          });

        } else { // install chaincode case

          const installData = {
            chaincodeId: chaincodeId,
            chaincodePath: `${req.files[0].destination}/${req.files[0].filename}`,
            chaincodeVersion: '1.00',
            language: req.body.language,
            orgName: req.body.orgName.map(org => org.toLowerCase()), //accept lowercase only,,
            channelName: req.body.channelName
          };

          try {
            res.io.sockets.emit('insl_cc', 'installing');
            res.json(response.successResponse('E009'));

            const result = await installChaincodeSvc.install(installData);
            logger.debug('result', result);
            if (result.success) {
              res.io.sockets.emit('insl_cc', 'install_succeeded');

              const insertData = {
                chaincodeId: chaincodeId,
                name: req.files[0].filename,
                path: `${req.files[0].destination}/${req.files[0].filename}`,
                size: req.files[0].size,
                type: 'zip',
                status: 'A',
                version: '1.00',
                language: req.body.language,
                isInit: 0
              };
              chaincode.insertChaincode(insertData, function (err, updateRes) {
                if (err) {
                  logger.error(err);
                }
              });
            }
          } catch (err) {
            logger.error(err);
            res.io.sockets.emit('insl_cc', 'install_failed');
          }

        }
      }
    }
  });

});
module.exports = router;

const createDestination = async (req, cb) => {
  if (!fs.existsSync(DIR)) {
    fs.mkdirSync(DIR);
  }
  cb(null, DIR);
};

const checkFileValidation = (req, file, cb) => {
  if (file.mimetype !== 'application/zip' && file.mimetype !== 'application/x-zip-compressed') {
    cb({ code: 'E005' });
  } else {
    const datetimestamp = Date.now();
    chaincodeId = common.genChaincodeId();
    let filename = file.originalname;
    const extension = '.' + file.originalname.split('.')[file.originalname.split('.').length - 1];
    const replacedStr = '-' + datetimestamp + extension;
    filename = req.body.name != null ? req.body.name + extension : filename.replace(/.zip$/, replacedStr);
    cb(null, filename);
  }
};