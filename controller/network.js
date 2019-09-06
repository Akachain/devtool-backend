const shell = require('shelljs');
const loggerCommon = require('../utils/logger');
const logger = loggerCommon.getLogger('network');
const network = require('../query/network');
const message = require('../utils/response');
const path = require('path');
const axios = require('axios');

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


  // exec sh file to create network
  const createNWResult = await new Promise(async (resolve, reject) => {

    const checkNWExisted = await new Promise((rs, rj) => {
      network.getAll((err, getRes) => {
        if (err) {
          rs(false);
        } else {
          if (getRes.length != 0) {
            rs(true);
          } else {
            rs(false);
          }
        }
      });
    });
    console.log('checkNWExisted', checkNWExisted);
    if (!checkNWExisted) {
      res.io.sockets.emit('create_nw', 'creating');
      res.json(message.successResponse('N002'));

      const scriptDir = path.resolve(__dirname, '../..', 'devtool-community-network');
      const result = shell.exec(`${scriptDir}/runFabric.sh startSingle ${channelName} ${org1Name} ${org2Name} ${version} ${name} ${scriptDir}`, { async: true });

      result.stdout.on('data', function (data) {
        res.io.sockets.emit('log_sh', data);
      });

      result.on('close', async function (code) {
        console.log('close:', code);
        if (code === 0) {
          const headers = {
            'content-type': 'application/json'
          };
          // register org 1
          const regOrg1Result = await axios.post(`${DAPP_URL}registerUser`,
            { orgname: org1Name },
            { headers }
          ).then(res => {
            logger.debug('register org 1 succeeded: ', res.data);
            return res;
          }).catch(err => {
            logger.error('register org 1 failed: ', err);
          });
          // console.log('========== ', regOrg1Result);
          if (regOrg1Result.data.success) {
            // register org 2
            const regOrg2Result = await axios.post(`${DAPP_URL}registerUser`,
              { orgname: org2Name },
              { headers }
            ).then(res => {
              logger.debug('register org 2 succeeded: ', res.data);
              return res;
            }).catch(err => {
              logger.error('register org 2 failed: ', err);
            });
            if (regOrg2Result.data.success) {
              // create channel
              const createChannelResult = await axios.post(`${DAPP_URL}channels`,
                { orgname: org1Name, channelName: channelName, channelConfigPath: `../artifacts/channel-artifacts/${channelName}.tx` },
                { headers }
              ).then(res => {
                logger.debug('create channel succeeded: ', res.data);
                return res;
              }).catch(err => {
                logger.error('create channel failed: ', err);
              });
              if (createChannelResult.data.success) {
                // join channel org 1
                const joinChannelOrg1Res = await axios.post(`${DAPP_URL}joinchannel`,
                  { orgname: org1Name, channelName: channelName },
                  { headers }
                ).then(res => {
                  logger.debug('join channel org 1 succeeded: ', res.data);
                  return res;
                }).catch(err => {
                  logger.error('join channel org 1 failed: ', err);
                });
                if (joinChannelOrg1Res.data.success) {
                  // join channel org 2
                  const joinChannelOrg2Res = await axios.post(`${DAPP_URL}joinchannel`,
                    { orgname: org2Name, channelName: channelName },
                    { headers }
                  ).then(res => {
                    logger.debug('join channel org 2 succeeded: ', res.data);
                    return res;
                  }).catch(err => {
                    logger.error('join channel org 2 failed: ', err);
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
            data: {
              message: 'create nw failed' + JSON.stringify(error),
              success: false
            }
          });
        }
      })
      // logger.debug('create network result: ', result);
    } else {
      return res.json(message.errorResponse('E010'));
    }
  }).catch(error => {
    logger.error('create nw failed: ', error);
    res.io.sockets.emit('log_sh', `create nw failed: ${error}`);
    resolve({
      data: {
        message: 'create nw failed' + JSON.stringify(error),
        success: false
      }
    });
  });
  logger.debug('createNWResult: ', createNWResult.data);
  // res.io.sockets.emit('log_sh', `createNWResult: ${createNWResult.data}`);

  // sh file ok
  if (createNWResult.data.success) {

    network.create(req.body, (error, rows) => {
      if (error) {
        logger.error('create network error: ', error);
        res.io.sockets.emit('log_sh', `create network error: ${error}`);
      } else {
        logger.info('create network successfully');
        res.io.sockets.emit('log_sh', 'create network successfully');
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
    const result = shell.exec(`${scriptDir}/runFabric.sh clean ${scriptDir}`);
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