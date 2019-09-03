const mysql = require('mysql');
const path = require('path');
const fs = require('fs');

const connection = mysql.createPool({
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: '1111',
  multipleStatements: true
});
const sqlPath = path.resolve(__dirname, './devtoolcommdb.sql');
const sql = fs.readFileSync(sqlPath).toString();

connection.query(sql, function (err, results) {
  if (err) throw err;
});

const realConfig = mysql.createPool({
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: '1111',
  database: 'devtoolcommdb',
  multipleStatements: true
});

module.exports = realConfig;