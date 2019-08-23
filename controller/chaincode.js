const chaincode = require('../query/chaincode');
const axios = require('axios');
const response = require('../utils/response');
const loggerCommon = require('../utils/logger.js');
const logger = loggerCommon.getLogger('Chaincode');
const ccSvc = require('../services/chaincode-service');

const init = async (req, res) => {
  logger.info('*****************    INIT CHAINCODE    *****************');
  logger.debug('init data req.body: ', req.body);

  const data = {
    chaincodeId: req.body.chaincodeId,
    chaincodeVersion: req.body.chaincodeVersion,
    orgname: req.body.orgName,
    channelName: req.body.channelName,
    chaincodeType: req.body.language,
    args: req.body.args
  };

  axios.post(`${DAPP_URL}initchaincodes`, data).then(response => {
    logger.debug('init cc result', response);
    res.json(response);

    if (response.success) {
      const updateData = {
        id: req.body.chaincodeId,
        initStatus: 'success',
        isInit: 1
      };
      chaincode.updateInitStatus(updateData, function (errInit, initStatus) {
        if (errInit) {
          logger.error('update init status failed', errInit);
          return res.json(response.errorResponse('E002'));
        }
      });
    }
  }).catch(error => {
    logger.error('Fail to init chaincode ', error);
    res.json(error.toString());

    const updateData = {
      id: req.body.chaincodeId,
      initStatus: 'fail',
      isInit: 0
    };
    chaincode.updateInitStatus(updateData, function (errInit, initStatus) {
      if (errInit) {
        logger.error('update init status failed', errInit);
      }
    });
  });

};

const invoke = async (req, res) => {

  logger.info('================= INVOKE CHAINCODE =================');

  const data = {
    username: req.body.orgName,
    orgname: req.body.orgName,
    channelName: req.body.channelName,
    chaincodeId: req.body.chaincodeId,
    chaincodeVersion: req.body.chaincodeVersion,
    chaincodeType: req.body.language,
    fcn: req.body.fcn,
    args: req.body.args
  };

  axios.post(`${DAPP_URL}invokeChainCode`, data).then(response => {
    logger.debug('invoke cc result', response);
    res.json(response);
  }).catch(error => {
    logger.error('Fail to invoke chaincode ', error);
    res.json({
      success: false,
      messages: `${error}`
    });
  });

};

const query = async (req, res) => {

  logger.info('================= QUERY CHAINCODE =================');
  const data = {
    username: req.body.orgName,
    orgname: req.body.orgName,
    channelName: req.body.channelName,
    chaincodeId: req.body.chaincodeId,
    fcn: req.body.fcn,
    args: req.body.args
  };

  axios.post(`${DAPP_URL}queryChainCode`, data).then(response => {
    logger.debug('query cc result', response);
    res.json(response);
  }).catch(error => {
    logger.error('Fail to query chaincode ', error);
    res.json({
      success: false,
      messages: `${error}`
    });
  });

};

const getAll = async (req, res) => {
  chaincode.getAll((err, rows) => {
    if (err) {
      logger.error('get all user\'s chaincode failed', err);
      return res.json(response.errorResponse('E002'));
    } else {
      if (rows.length === 0) {
        return res.json(response.noDataResponse());
      } else {
        return res.json(response.successResponse('N001', rows));
      }
    }
  });
};

const getOne = async (req, res) => {
  const { id } = req.query;
  chaincode.getOne(id, (err, rows) => {
    if (err) {
      logger.error('get chaincode by id failed', err);
      return res.json(response.errorResponse('E002'));
    } else {
      if (rows.length === 0) {
        return res.json(response.errorResponse('W001'));
      } else {
        return res.json(response.successResponse('N001', rows));
      }
    }
  });
};

module.exports = {
  init,
  invoke,
  query,
  // insert,
  getAll,
  getOne
};