const loggerComon = require('./logger.js');

const logger = loggerComon.getLogger('query');

const Query = async (request, channel) => {
  try {
    const responsePayloads = await channel.queryByChaincode(request);
    if (responsePayloads) {
      for (let i = 0; i < responsePayloads.length; i += i) {
        if (responsePayloads[i].status && responsePayloads[i].status !== 200) {
          const err = responsePayloads[i];
          // const jsonErr = JSON.stringify(err, Object.getOwnPropertyNames(err));
          // logger.error('jsonErr.message: ', err.toString());
          // const objErr = JSON.parse(jsonErr);
          // const convertObj = JSON.parse(objErr.message);
          throw new Error(err.toString());
        }
        logger.debug(`------->>> R E S P O N S E : ${responsePayloads[i].toString('utf8')}`);
        const result = JSON.parse(responsePayloads[i].toString('utf8'));
        return result;
      }
      throw new Error('responsePayloads is null');
    } else {
      throw new Error('responsePayloads is null');
    }
  } catch (error) {
    logger.error(`Failed to query due to error: ${error.stack ? error.stack : error}`);
    throw error;
  }
};

exports.Query = Query;
