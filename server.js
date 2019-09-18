/********** Init connection setting ************/
require('./utils/env_vars');
const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const connection = require('./mySQLConnection');
const cors = require('cors');
require('./config.js');
const socketIO = require('socket.io');
/********** Initialize app ************/
const server = app.listen(44080, '0.0.0.0', () => {
  console.info(`Connecting to database [${connection.config.connectionConfig.database}] at ${connection.config.connectionConfig.host}:${connection.config.connectionConfig.port}...`);
  console.info(`Server is listening on ${server.address().address}:${server.address().port} ...`);
});
const io = socketIO.listen(server);

// listen socket connection
io.on('connection', (socket) => {

  console.info('user connected');

  socket.on('disconnect', () => {
    console.info('user disconnected');
  });
});

// using io on api
app.use((req, res, next) => {
  res.io = io;
  next();
});

/********** Display json style, url encoded ************/
app.use(bodyparser.urlencoded({
  extended: true
}));
app.use(bodyparser.json());

// set cors
const corsOpts = {
  origin: true,
  credentials: true
};
app.use(cors(corsOpts));

/********** Set route apis ************/
app.use('/api/upload', require('./routes/upload_file'));
app.use('/api/chaincode', require('./routes/chaincode'));
app.use('/api/network', require('./routes/network'));

module.exports = app;