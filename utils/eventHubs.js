'use strict';
/* eslint-disable indent */
/* eslint-disable operator-linebreak */
const util = require('util');
const loggerCommon = require('./logger.js');

const logger = loggerCommon.getLogger('eventHubs');

const EVENT_TIMEOUT = 60000;

async function setEventHubs(orgname, channel, txId, request, channelName) {
  let errorMessage = null;
  const txIdString = txId.getTransactionID();
  try {
    const results = await channel.sendTransactionProposal(request);

    const proposalResponses = results[0];
    logger.debug('proposalResponses: ', proposalResponses);
    const proposal = results[1];
    let allGood = true;
    // const errResponses = [];
    proposalResponses.forEach((proposalResponse) => {
      let oneGood = false;
      if (proposalResponses && proposalResponse.response &&
        proposalResponse.response.status === 200) {
        oneGood = true;
        logger.info('invoke chaincode proposal was good');
      } else {
        const err = proposalResponse;
        errorMessage = err.toString();
        logger.error('invoke chaincode proposal was bad');
      }
      allGood = allGood && oneGood;
    });

    if (allGood) {
      logger.info(util.format(
        'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s"',
        proposalResponses[0].response.status, proposalResponses[0].response.message,
        proposalResponses[0].response.payload,
      ));
      const promises = [];
      const eventHubs = channel.getChannelEventHubsForOrg();
      eventHubs.forEach((eh) => {
        logger.debug('invokeEventPromise - setting up event');
        const invokeEventPromise = new Promise((resolve, reject) => {
          const eventTimeout = setTimeout(() => {
            const message = `REQUEST_TIMEOUT:${eh.getPeerAddr()}`;
            logger.error(message);
            eh.disconnect();
          }, EVENT_TIMEOUT);
          eh.registerTxEvent(txIdString, (tx, code, blockNum) => {
              logger.info('The chaincode invoke chaincode transaction has been committed on peer %s', eh.getPeerAddr());
              logger.info('Transaction %s has status of %s in blocl %s', tx, code, blockNum);
              clearTimeout(eventTimeout);

              if (code !== 'VALID') {
                const message = util.format('The invoke chaincode transaction was invalid, code:%s', code);
                logger.error(message);
                reject(new Error(message));
              } else {
                const message = 'The invoke chaincode transaction was valid.';
                logger.info(message);
                resolve(message);
              }
            }, (err) => {
              clearTimeout(eventTimeout);
              logger.error(err);
              reject(err);
            },
            // the default for 'unregister' is true for transaction listeners
            // so no real need to set here, however for 'disconnect'
            // the default is false as most event hubs are long running
            // in this use case we are using it only once
            {
              unregister: true,
              disconnect: false,
            });
          eh.connect();
        });
        promises.push(invokeEventPromise);
      });

      const ordererRequest = {
        txId,
        proposalResponses,
        proposal,
      };
      const sendPromise = channel.sendTransaction(ordererRequest);
      promises.push(sendPromise);

      const resultsPromise = await Promise.all(promises);

      // logger.debug(util.format('------->>> R E S P O N S E : %j', results));
      const response = resultsPromise.pop(); //  orderer results are last in the results
      if (response.status === 'SUCCESS') {
        logger.info('Successfully sent transaction to the orderer.');
      } else {
        errorMessage = util.format('Failed to order the transaction. Error code: %s', response.status);
        logger.debug(errorMessage);
      }
      resultsPromise.forEach((eventHubResult, i) => {
        const eventHub = eventHubs[i];
        logger.debug('Event results for event hub :%s', eventHub.getPeerAddr());
        if (typeof eventHubResult === 'string') {
          logger.debug(eventHubResult);
        } else {
          if (!errorMessage) errorMessage = eventHubResult.toString();
          logger.debug(eventHubResult.toString());
        }
      });
    } else {
      errorMessage = `${errorMessage}`;
      logger.debug(errorMessage);
    }
    if (!errorMessage) {
      const message = util.format(
        'Successfully invoked the chaincode %s to the channel %s for transaction ID: %s',
        orgname, channelName, txIdString,
      );
      logger.debug(message);
      logger.debug('results: ', results[0][0].response.payload.toString('utf8'));
      // const obj = JSON.parse(results[0][0].response.payload.toString('utf8'));
      return results[0][0].response.payload.toString('utf8');
    }
    const message = util.format('Failed to invoke chaincode. cause:%s', errorMessage);
    logger.error(message);
    throw new Error(message);
  } catch (error) {
    logger.error(`Failed to invoke due to error: ${error.stack ? error.stack : error}`);
    errorMessage = error.toString();
    throw new Error(errorMessage);
  }
}

exports.setEventHubs = setEventHubs;
