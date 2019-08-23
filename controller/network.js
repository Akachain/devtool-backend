const shell = require('shelljs');
const loggerCommon = require('../utils/logger');
const logger = loggerCommon.getLogger('network');
const network = require('../query/network');
const message = require('../utils/response');
const path = require('path');
const axios = require('axios');
const channelSvc = require('../services/channel-service');

/**
 * create new network
 * @param {*} req 
 * @param {*} res 
 */
const create = async (req, res) => {

  const {
    name, org1Name, org2Name, channelName, version
  } = req.body;
  // emit socket msg and return success response
  res.io.sockets.emit('create_nw', 'creating');
  res.json(message.successResponse('N002'));

  // exec sh file to create network
  const createNWResult = await new Promise(async (resolve, reject) => {
    const scriptDir = path.resolve(__dirname, '../..', 'devtool-community-network');
    const result = shell.exec(`${scriptDir}/runFabric.sh startSingle ${channelName} ${org1Name} ${org2Name} ${version} ${name} ${scriptDir}`);
    // logger.debug('create network result: ', result);
    if (result.code === 0) {

      // register org 1
      const regOrg1Result = await channelSvc.registerUser({ orgname: org1Name });
      // console.log('========== ', regOrg1Result);
      if (regOrg1Result.data.success) {
        // register org 2
        const regOrg2Result = await channelSvc.registerUser({ orgname: org2Name });
        if (regOrg2Result.data.success) {
          // create channel
          const createChannelResult = await channelSvc.channels({
            orgname: org1Name,
            channelName: channelName,
            channelConfigPath: `../artifacts/channel-artifacts/${channelName}.tx`
          });
          if (createChannelResult.data.success) {
            // join channel org 1
            const joinChannelOrg1Res = await channelSvc.joinchannel({
              orgname: org1Name,
              channelName: channelName
            });
            if (joinChannelOrg1Res.data.success) {
              // join channel org 2
              const joinChannelOrg2Res = await channelSvc.joinchannel({
                orgname: org2Name,
                channelName: channelName
              });
              resolve(joinChannelOrg2Res);
            } else {
              resolve(joinChannelOrg1Res);
            }
          } else {
            resolve(createChannelResult);
          }
        } else {
          resolve(regOrg2Result);
        }
      } else {
        resolve(regOrg1Result);
      }

    } else {
      logger.debug(`err ${result.code}, stderr ${result.stderr}, stdout ${result.stdout} `);
      resolve({
        message: 'create nw failed' + JSON.stringify(error),
        success: false
      });
    }
  }).catch(error => {
    logger.error('create nw failed: ', error);
    resolve({
      message: 'create nw failed' + JSON.stringify(error),
      success: false
    });
  });
  logger.debug('createNWResult: ', createNWResult.data);

  // sh file ok
  if (createNWResult.data.success) {

    network.create(req.body, (error, rows) => {
      if (error) {
        logger.error('create network error: ', error);
      } else {
        logger.info('create network successfully');
      }
    });
    res.io.sockets.emit('create_nw', 'succeeded');

  } else { // sh file failed
    res.io.sockets.emit('create_nw', 'failed');
  }

};

/**
 * remove network
 * @param {*} req 
 * @param {*} res 
 */
const remove = async (req, res) => {

  res.io.sockets.emit('remove_nw', 'removing');

  // exec sh file to remove network
  const removeNWResult = await new Promise((resolve, reject) => {
    const scriptDir = path.resolve(__dirname, '../..', 'devtool-community-network');
    const result = shell.exec(`${scriptDir}/runFabric.sh clean`);
    logger.debug('create network result: ', result);
    if (result.code === 0) {
      resolve(true);
    } else {
      resolve(false);
    }
  }).catch(error => {
    logger.error('remove nw failed: ', error);
    resolve(false);
  });
  logger.debug('removeNWResult: ', removeNWResult);

  if (removeNWResult) {

    network.updateStatus({ name: req.query.name, status: 'removed' }, (error, rows) => {
      if (error) {
        logger.error('update \'removed\' status error: ', error);
        res.io.sockets.emit('remove_nw', 'failed');
        res.json(message.errorResponse('E002'));
      } else {
        logger.info('update \'removed\' status ok');
        res.io.sockets.emit('remove_nw', 'succeeded');
        res.json(message.successResponse('N001'));
      }
    });

  } else {
    res.io.sockets.emit('remove_nw', 'failed');
    res.json(message.errorResponse('E002'));
  }
};

/**
 * get list all network
 * @param {*} req 
 * @param {*} res 
 */
const getAll = async (req, res) => {
  network.getAll((error, rows) => {
    if (error) {
      logger.error('get all nw error: ', error);
      return res.json(message.errorResponse('E002'));
    } else {
      logger.info('get all nw ok');
      return res.json(message.successResponse('N001', rows));
    }
  });
};

/**
 * get one network info
 * @param {*} req 
 * @param {*} res 
 */
const getOne = async (req, res) => {
  const { name } = req.query;
  network.getOne(name, (error, rows) => {
    if (error) {
      logger.error(`get nw ${name} error: `, error);
      return res.json(message.errorResponse('E002'));
    } else {
      logger.info(`get nw ${name} ok`);
      return res.json(message.successResponse('N001', rows));
    }
  });
};
module.exports = {
  create,
  remove,
  getAll,
  getOne
};