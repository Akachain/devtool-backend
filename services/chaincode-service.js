// 'use strict';
// let path = require('path');
// let util = require('util');
// const loggerCommon = require('../utils/logger.js');
// const logger = loggerCommon.getLogger('chaincode-service');
// let hfc = require('fabric-client');
// let fs = require('fs');
// hfc.setLogger(logger);
// const eventHubs = require('../utils/eventHubs');
// const queryLib = require('../utils/query');
// const fabricClient = require('../utils/client');

// const setupChaincodeDeploy = function () {
//   logger.debug(__dirname, hfc.getConfigSetting('CC_SRC_PATH'));
//   process.env.GOPATH = path.join(__dirname, hfc.getConfigSetting('CC_SRC_PATH'));
// };

// const installChaincode = async function (req) {
//   setupChaincodeDeploy();
//   let username = req.orgname;
//   let orgname = req.orgname;
//   let chaincodeId = req.chaincodeId;
//   let chaincodePath = req.chaincodePath;
//   let p_tmp = path.resolve(__dirname, '../artifacts/src/chaincodes/');
//   let metadata_path;
//   if (req.metadata_path != null) {
//     p_tmp = p_tmp + req.metadata_path;
//   } else {
//     p_tmp = p_tmp + '/' + chaincodeId + '/META-INF/';
//   }
//   if (fs.existsSync(p_tmp)) {
//     metadata_path = p_tmp;
//   }
//   let chaincodeVersion = req.chaincodeVersion;
//   let chaincodeType = req.chaincodeType;
//   let error_message = null;
//   try {
//     let client = await fabricClient.getClientForOrg(orgname, username);
//     let peers = client.getPeersForOrg();
//     logger.debug(`'Successfully got the fabric client for the organization ${orgname}`);

//     // enable Client TLS
//     var tlsInfo = await fabricClient.tlsEnroll(client);
//     client.setTlsClientCertAndKey(tlsInfo.certificate, tlsInfo.key);

//     let request = {
//       targets: peers,
//       chaincodePath: chaincodePath,
//       chaincodeId: chaincodeId,
//       metadataPath: metadata_path,
//       chaincodeVersion: chaincodeVersion,
//       chaincodeType: chaincodeType
//     };
//     let results = await client.installChaincode(request);
//     let proposalResponses = results[0];
//     let all_good = true;
//     for (let i in proposalResponses) {
//       let one_good = false;
//       if (proposalResponses && proposalResponses[i].response &&
//         proposalResponses[i].response.status === 200) {
//         one_good = true;
//         logger.info('install proposal was good');
//       } else {
//         logger.error('install proposal was bad');
//       }
//       all_good = all_good & one_good;
//     }
//     if (all_good) {
//       let response = {
//         success: true,
//         message: 'Successfully sent install Proposal and received ProposalResponse'
//       };
//       logger.info('Successfully sent install Proposal and received ProposalResponse');
//       return response;
//     } else {
//       error_message = `Failed to send install Proposal or receive valid response. Detail: ${proposalResponses[0].message}`;
//       logger.error(error_message);
//       throw new Error(error_message);
//     }
//   } catch (error) {
//     logger.error('Failed to install due to error: ' + error.stack ? error.stack : error);
//     error_message = error.message;
//     throw new Error(error_message);
//   }
// };

// const initChaincode = async function (req) {
//   let username = req.orgname;
//   let orgname = req.orgname;
//   let channelName = req.channelName;
//   let chaincodeId = req.chaincodeId;
//   let chaincodeVersion = req.chaincodeVersion;
//   let chaincodeType = req.chaincodeType;
//   let args = req.args;
//   logger.debug('\n\n============ Instantiate chaincode on channel ' + channelName +
//     ' ============\n');
//   let error_message = null;

//   try {

//     let client = await fabricClient.getClientForOrg(orgname, username);
//     logger.debug('Successfully got the fabric client for the organization "%s"', orgname);

//     // enable Client TLS
//     var tlsInfo = await fabricClient.tlsEnroll(client);
//     client.setTlsClientCertAndKey(tlsInfo.certificate, tlsInfo.key);

//     let peers = client.getPeersForOrg();

//     let channel = client.getChannel(channelName);
//     if (!channel) {
//       let message = util.format('Channel %s was not defined in the connection profile', channelName);
//       logger.error(message);
//       throw new Error(message);
//     }

//     let tx_id = client.newTransactionID(true); // Get an admin based transactionID
//     // An admin based transactionID will
//     // indicate that admin identity should
//     // be used to sign the proposal request.
//     // will need the transaction ID string for the event registration later
//     let deployId = tx_id.getTransactionID();


//     // send proposal to endorser
//     let request = {
//       targets: peers,
//       chaincodeId: chaincodeId,
//       chaincodeVersion: chaincodeVersion,
//       chaincodeType: chaincodeType,
//       args: args,
//       txId: tx_id
//     };

//     let results = await channel.sendInstantiateProposal(request, 80000); //instantiate takes much longer

//     // the returned object has both the endorsement results
//     // and the actual proposal, the proposal will be needed
//     // later when we send a transaction to the orderer
//     let proposalResponses = results[0];
//     let proposal = results[1];
//     logger.error('>> proposalResponses: ', proposalResponses);

//     // lets have a look at the responses to see if they are
//     // all good, if good they will also include signatures
//     // required to be committed
//     let all_good = true;
//     for (let i in proposalResponses) {
//       let one_good = false;
//       if (proposalResponses && proposalResponses[i].response &&
//         proposalResponses[i].response.status === 200) {
//         one_good = true;
//         logger.info('instantiate proposal was good');
//       } else {
//         logger.error('instantiate proposal was bad');
//       }
//       all_good = all_good & one_good;
//     }
//     if (all_good) {
//       logger.info(util.format(
//         'Successfully sent Proposal and received ProposalResponse: Status - %s, message - %s, metadata - %s, endorsement signature: %s',
//         proposalResponses[0].response.status, proposalResponses[0].response.message,
//         proposalResponses[0].response.payload, proposalResponses[0].endorsement
//           .signature));

//       // wait for the channel-based event hub to tell us that the
//       // instantiate transaction was committed on the peer
//       let promises = [];
//       let event_hubs = channel.getChannelEventHubsForOrg();
//       logger.debug('found %s eventhubs for this organization %s', event_hubs.length, orgname);
//       event_hubs.forEach((eh) => {
//         let instantiateEventPromise = new Promise((resolve, reject) => {
//           logger.debug('instantiateEventPromise - setting up event');
//           let event_timeout = setTimeout(() => {
//             let message = 'REQUEST_TIMEOUT:' + eh.getPeerAddr();
//             logger.error(message);
//             eh.disconnect();
//             // reject(new Error(message));
//           }, 60000);
//           eh.registerTxEvent(deployId, (tx, code, block_num) => {
//             logger.info('The chaincode instantiate transaction has been committed on peer %s', eh.getPeerAddr());
//             logger.info('Transaction %s has status of %s in blocl %s', tx, code, block_num);
//             clearTimeout(event_timeout);

//             if (code !== 'VALID') {
//               let message = util.format('The chaincode instantiate transaction was invalid, code:%s', code);
//               logger.error(message);
//               reject(new Error(message));
//             } else {
//               let message = 'The chaincode instantiate transaction was valid.';
//               logger.info(message);
//               resolve(message);
//             }
//           }, (err) => {
//             clearTimeout(event_timeout);
//             logger.error(err);
//             reject(err);
//           },
//             // the default for 'unregister' is true for transaction listeners
//             // so no real need to set here, however for 'disconnect'
//             // the default is false as most event hubs are long running
//             // in this use case we are using it only once
//             {
//               unregister: true,
//               disconnect: true
//             }
//           );
//           eh.connect();
//         });
//         promises.push(instantiateEventPromise);
//       });

//       let orderer_request = {
//         txId: tx_id, // must include the transaction id so that the outbound
//         // transaction to the orderer will be signed by the admin
//         // id as was the proposal above, notice that transactionID
//         // generated above was based on the admin id not the current
//         // user assigned to the 'client' instance.
//         proposalResponses: proposalResponses,
//         proposal: proposal
//       };
//       let sendPromise = channel.sendTransaction(orderer_request);
//       // put the send to the orderer last so that the events get registered and
//       // are ready for the orderering and committing
//       promises.push(sendPromise);
//       let results = await Promise.all(promises);
//       logger.debug(util.format('------->>> R E S P O N S E : %j', results));
//       let response = results.pop(); //  orderer results are last in the results
//       if (response.status === 'SUCCESS') {
//         logger.info('Successfully sent transaction to the orderer.');
//       } else {
//         error_message = util.format('Failed to order the transaction. Error code: %s', response.status);
//         logger.debug(error_message);
//       }

//       // now see what each of the event hubs reported
//       for (let i in results) {
//         let event_hub_result = results[i];
//         let event_hub = event_hubs[i];
//         logger.debug('Event results for event hub :%s', event_hub.getPeerAddr());
//         if (typeof event_hub_result === 'string') {
//           logger.debug(event_hub_result);
//         } else {
//           if (!error_message) error_message = event_hub_result.toString();
//           logger.debug(event_hub_result.toString());
//         }
//       }
//     } else {
//       error_message = `Failed to send Proposal and receive all good ProposalResponse. Detail: ${proposalResponses[0].message}`;
//       logger.debug(error_message);
//     }

//   } catch (error) {
//     logger.error('Failed to send instantiate due to error: ' + error.stack ? error.stack : error);
//     error_message = error.toString();
//   }
//   if (!error_message) {
//     let message = util.format(
//       'Successfully instantiate chaincode in organization %s to the channel \'%s\'',
//       orgname, channelName);
//     logger.info(message);
//     // build a response to send back to the REST caller
//     let response = {
//       success: true,
//       message: message
//     };
//     return response;
//   } else {
//     let message = util.format('Failed to instantiate. Cause: %s', error_message);
//     logger.error(message);
//     throw new Error(message);
//   }
// };

// let upgradeChaincode = async function (req) {
//   let username = req.orgname;
//   let orgname = req.orgname;
//   let channelName = req.channelName;
//   let chaincodeId = req.chaincodeId;
//   let chaincodeVersion = req.chaincodeVersion;
//   let chaincodeType = req.chaincodeType;
//   const args = req.args;
//   logger.debug('\n\n============ Instantiate chaincode on channel ' + channelName +
//     ' ============\n');
//   let error_message = null;

//   try {

//     let client = await fabricClient.getClientForOrg(orgname, username);
//     logger.debug('Successfully got the fabric client for the organization "%s"', orgname);

//     let peers = client.getPeersForOrg();

//     let channel = client.getChannel(channelName);
//     if (!channel) {
//       let message = util.format('Channel %s was not defined in the connection profile', channelName);
//       logger.error(message);
//       throw new Error(message);
//     }

//     let tx_id = client.newTransactionID(true); // Get an admin based transactionID
//     // An admin based transactionID will
//     // indicate that admin identity should
//     // be used to sign the proposal request.
//     // will need the transaction ID string for the event registration later
//     let deployId = tx_id.getTransactionID();

//     // send proposal to endorser
//     let request = {
//       targets: peers,
//       chaincodeId: chaincodeId,
//       chaincodeVersion: chaincodeVersion,
//       chaincodeType: chaincodeType,
//       args,
//       txId: tx_id
//     };

//     let results = await channel.sendUpgradeProposal(request, 80000); //instantiate takes much longer

//     // the returned object has both the endorsement results
//     // and the actual proposal, the proposal will be needed
//     // later when we send a transaction to the orderer
//     let proposalResponses = results[0];
//     let proposal = results[1];
//     logger.error('>> proposalResponses: ', proposalResponses);

//     // lets have a look at the responses to see if they are
//     // all good, if good they will also include signatures
//     // required to be committed
//     let all_good = true;
//     for (let i in proposalResponses) {
//       let one_good = false;
//       if (proposalResponses && proposalResponses[i].response &&
//         proposalResponses[i].response.status === 200) {
//         one_good = true;
//         logger.info('upgrade proposal was good');
//       } else {
//         logger.error('upgrade proposal was bad');
//       }
//       all_good = all_good & one_good;
//     }
//     if (all_good) {
//       logger.info(util.format(
//         'Successfully sent Proposal and received ProposalResponse: Status - %s, message - %s, metadata - %s, endorsement signature: %s',
//         proposalResponses[0].response.status, proposalResponses[0].response.message,
//         proposalResponses[0].response.payload, proposalResponses[0].endorsement
//           .signature));

//       // wait for the channel-based event hub to tell us that the
//       // instantiate transaction was committed on the peer
//       let promises = [];
//       let event_hubs = channel.getChannelEventHubsForOrg();
//       logger.debug('found %s eventhubs for this organization %s', event_hubs.length, orgname);
//       event_hubs.forEach((eh) => {
//         let instantiateEventPromise = new Promise((resolve, reject) => {
//           logger.debug('instantiateEventPromise - setting up event');
//           let event_timeout = setTimeout(() => {
//             let message = 'REQUEST_TIMEOUT:' + eh.getPeerAddr();
//             logger.error(message);
//             eh.disconnect();
//             // reject(new Error(message));
//           }, 60000);
//           eh.registerTxEvent(deployId, (tx, code, block_num) => {
//             logger.info('The chaincode instantiate transaction has been committed on peer %s', eh.getPeerAddr());
//             logger.info('Transaction %s has status of %s in blocl %s', tx, code, block_num);
//             clearTimeout(event_timeout);

//             if (code !== 'VALID') {
//               let message = util.format('The chaincode instantiate transaction was invalid, code:%s', code);
//               logger.error(message);
//               reject(new Error(message));
//             } else {
//               let message = 'The chaincode instantiate transaction was valid.';
//               logger.info(message);
//               resolve(message);
//             }
//           }, (err) => {
//             clearTimeout(event_timeout);
//             logger.error(err);
//             reject(err);
//           },
//             // the default for 'unregister' is true for transaction listeners
//             // so no real need to set here, however for 'disconnect'
//             // the default is false as most event hubs are long running
//             // in this use case we are using it only once
//             {
//               unregister: true,
//               disconnect: true
//             }
//           );
//           eh.connect();
//         });
//         promises.push(instantiateEventPromise);
//       });

//       let orderer_request = {
//         txId: tx_id, // must include the transaction id so that the outbound
//         // transaction to the orderer will be signed by the admin
//         // id as was the proposal above, notice that transactionID
//         // generated above was based on the admin id not the current
//         // user assigned to the 'client' instance.
//         proposalResponses: proposalResponses,
//         proposal: proposal
//       };
//       let sendPromise = channel.sendTransaction(orderer_request);
//       // put the send to the orderer last so that the events get registered and
//       // are ready for the orderering and committing
//       promises.push(sendPromise);
//       let results = await Promise.all(promises);
//       logger.debug(util.format('------->>> R E S P O N S E : %j', results));
//       let response = results.pop(); //  orderer results are last in the results
//       if (response.status === 'SUCCESS') {
//         logger.info('Successfully sent transaction to the orderer.');
//       } else {
//         error_message = util.format('Failed to order the transaction. Error code: %s', response.status);
//         logger.debug(error_message);
//       }

//       // now see what each of the event hubs reported
//       for (let i in results) {
//         let event_hub_result = results[i];
//         let event_hub = event_hubs[i];
//         logger.debug('Event results for event hub :%s', event_hub.getPeerAddr());
//         if (typeof event_hub_result === 'string') {
//           logger.debug(event_hub_result);
//         } else {
//           if (!error_message) error_message = event_hub_result.toString();
//           logger.debug(event_hub_result.toString());
//         }
//       }
//     } else {
//       error_message = `Failed to send Proposal and receive all good ProposalResponse. Detail: ${proposalResponses[0].message}`;
//       logger.debug(error_message);
//     }

//   } catch (error) {
//     logger.error('Failed to send upgrade due to error: ' + error.stack ? error.stack : error);
//     error_message = error.toString();
//   }
//   if (!error_message) {
//     let message = util.format(
//       'Successfully upgrade chaincode in organization %s to the channel \'%s\'',
//       orgname, channelName);
//     logger.info(message);
//     // build a response to send back to the REST caller
//     let response = {
//       success: true,
//       message: message
//     };
//     return response;
//   } else {
//     let message = util.format('Failed to upgrade. Cause: %s', error_message);
//     logger.error(message);
//     throw new Error(message);
//   }
// };

// const invoke = async (req) => {
//   const {
//     chaincodeId,
//     orgName,
//     channelName,
//     fcn,
//     args
//   } = req.body;
//   const client = await hfc.getClientForOrg(orgName, orgName);
//   const channel = client.getChannel(channelName);
//   if (!channel) {
//     const message = util.format('Channel %s was not defined in the connection profile', channelName);
//     logger.error(message);
//     throw new Error(message);
//   }

//   const targets = client.getPeersForOrg();
//   const txId = client.newTransactionID();
//   logger.debug(util.format('Sending transaction "%j"', txId));

//   // send proposal to endorser
//   const request = {
//     targets,
//     chaincodeId,
//     fcn,
//     args,
//     txId,
//     chainId: channelName
//   };
//   const resultInvoke = await eventHubs.setEventHubs(
//     orgName, channel, txId, request, channelName
//   );
//   const txIdString = txId.getTransactionID();
//   logger.debug('chaincode response => typeof resultInvoke:', typeof resultInvoke, '; value: ', resultInvoke, 'txId: ', txIdString);
//   return {
//     success: true,
//     data: resultInvoke,
//     txId: txIdString
//   };
// };

// const query = async (req) => {
//   const {
//     chaincodeId,
//     orgName,
//     channelName,
//     fcn,
//     args
//   } = req.body;

//   const client = await hfc.getClientForOrg(orgName, orgName);
//   const channel = client.getChannel(channelName);
//   if (!channel) {
//     const message = util.format('Channel %s was not defined in the connection profile', channelName);
//     logger.error(message);
//     throw new Error(message);
//   }

//   const targets = client.getPeersForOrg();
//   const txId = client.newTransactionID();
//   logger.debug(util.format('Sending transaction "%j"', txId));

//   // send proposal to endorser
//   const request = {
//     targets,
//     chaincodeId,
//     fcn,
//     args,
//     txId,
//     chainId: channelName
//   };
//   const resultQuery = await queryLib.Query(request, channel);
//   logger.debug('chaincode response => typeof resultQuery:', typeof resultQuery, '; value: ', resultQuery);
//   return resultQuery;
// };

// module.exports = {
//   installChaincode,
//   initChaincode,
//   upgradeChaincode,
//   invoke,
//   query
// };
