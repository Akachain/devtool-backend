const mysql = require('mysql');
const path = require('path');
const fs = require('fs');

const connection = mysql.createPool({
  host: '0.0.0.0',
  port: '4406',
  user: 'root',
  password: 'Akachain',
  multipleStatements: true
});
const sqlPath = path.resolve(__dirname, './devtoolcommdb.sql');
const sql = fs.readFileSync(sqlPath).toString();

connection.query(sql, function (err, results) {
  if (err) throw err;
});

const realConfig = mysql.createPool({
  host: '0.0.0.0',
  port: '4406',
  user: 'root',
  password: 'Akachain',
  database: 'devtoolcommdb',
  multipleStatements: true
});

module.exports = realConfig;
