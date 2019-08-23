const db = require('../mySQLConnection');

// Table User
const chaincode = {
  // Add user
  getAll: function (callback) {
    return db.query("select * from chaincode", callback);
  },

  getOne: function (id, callback) {
    return db.query("select * from chaincode where ChaincodeId = ?", [id], callback);
  },

  insertChaincode: function (data, callback) {
    return db.query('insert into chaincode(`ChaincodeId`,`Name`,`Path`,`Size`,`Type`,`Status`,`Version`,`Language`,`IsInit`,`Description`,`InitStatus`,`UpgradeStatus`) values(?,?,?,?,?,?,?,?,?,?,?,?);', [data.chaincodeId, data.name, data.path, data.size, data.type, data.status, data.version, data.language, data.isInit, data.description, 'pending', 'pending'], callback);
  },

  updateInitStatus: function (data, callback) {
    return db.query('update chaincode set IsInit = ?, InitStatus = ? where ChaincodeId = ? and Id <> 0;', [data.isInit, data.initStatus, data.id], callback);
  },

  updateUpgradeStatus: function (data, callback) {
    return db.query('update chaincode set UpgradeStatus = ? where ChaincodeId = ? and Id <> 0;', [data.upgradeStatus, data.id], callback);
  },

  updateChaincode: function (data, callback) {
    return db.query('update chaincode set Size = ?, Path = ?, Version = ?, `Name` = ?, Language = ?, UpgradeStatus=\'pending\' where ChaincodeId = ? and Id <> 0', [data.size, data.path, data.version, data.name, data.language, data.chaincodeId], callback);
  }
};
module.exports = chaincode;