const Joi = require('joi');

module.exports = {
  init: {
    body: {
      chaincodeId: Joi.string().required(),
      chaincodeVersion: Joi.string().required(),
      args: Joi.array().required(),
    },
  },
  invoke: {
    body: {
      chaincodeId: Joi.string().required(),
      fcn: Joi.string().required(),
      args: Joi.array().required(),
    },
  },
  query: {
    body: {
      chaincodeId: Joi.string().required(),
      fcn: Joi.string().required(),
      args: Joi.array().required(),
    },
  }
};
