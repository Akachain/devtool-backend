const mysql = require('mysql');

module.exports = mysql.createPool({
  host: 'localhost',
  port: '3306',
  user: 'arun',
  password: 'password',
  database: 'devtoolcommdb',
  multipleStatements: true
});