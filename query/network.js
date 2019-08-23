const db = require('../mySQLConnection');

const queries = {

  create: (data, cb) => {
    return db.query('insert into `network`(`Name`,`Org1Name`,`Org2Name`,`ChannelName`,`Version`,`Status`) values(?,?,?,?,?,?)', [data.name, data.org1Name, data.org2Name, data.channelName, data.version, 'pending'], cb);
  },

  updateStatus: (data, cb) => {
    return db.query('update `network` set Status = ? where `Name` = ? and Id <> 0', [data.status, data.name], cb);
  },

  getAll: (cb) => {
    return db.query('select * from `network` where Status <> "removed"', cb);
  },

  getOne: (name, cb) => {
    return db.query('select * from `network` where Name = ? and Status <> "removed"', [name], cb);
  }
};

module.exports = queries;