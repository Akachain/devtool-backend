const ErrorMap = {
  'N001': { Code: 'N001', Msg: 'OK', MsgDetail: '' },
  'E001': { Code: 'E001', Msg: 'API not found', MsgDetail: '' },
  'E002': { Code: 'E002', Msg: 'We\'re busy at the moment. Please try again later', MsgDetail: '' },
  'W001': { Code: 'W001', Msg: 'No data', MsgDetail: '' },
  'E003': { Code: 'E003', Msg: 'Chaincode is disabled', MsgDetail: '' },
  'E004': { Code: 'E004', Msg: 'File is too large (> 5mb)', MsgDetail: '' },
  'E005': { Code: 'E005', Msg: 'Wrong file extension. Only .zip is allowed!', MsgDetail: '' },
  'E006': { Code: 'E006', Msg: 'No file selected', MsgDetail: '' },
  'E007': { Code: 'E007', Msg: 'Chaincode is initializing... Please wait a while', MsgDetail: '' },
  'E008': { Code: 'E008', Msg: 'Chaincode is upgrading... Please wait a while', MsgDetail: '' },
  'E009': { Code: 'E009', Msg: 'Chaincode is installing... Please wait a while', MsgDetail: '' },
  'N002': { Code: 'N002', Msg: 'Network is generating... Please wait a while', MsgDetail: '' }
};

const Response = {

  noDataResponse: () => {
    return {
      result: 601,
      message: ErrorMap['W001'].Msg
    };
  },

  successResponse: (err, data) => {
    return {
      result: ErrorMap[err].Code,
      data: data,
      message: ErrorMap[err].Msg
    };
  },

  errorResponse: (err, data) => {
    return {
      result: ErrorMap[err].Code,
      message: ErrorMap[err].Msg
    };
  }
};
module.exports = Response;