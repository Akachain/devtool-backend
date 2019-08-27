'use strict';
const file_path = './Logs/';
const log4js = require('log4js');

log4js.configure({
  appenders: {
    everything: { type: 'dateFile', filename: file_path + 'AKC-dev-tool-community-system-logs.log', pattern: '.yyyy-MM-dd', compress: true },
    emergencies: { type: 'dateFile', filename: file_path + 'AKC-dev-tool-community-system-logs-error.log', pattern: '.yyyy-MM-dd', compress: true },
    information: { type: 'dateFile', filename: file_path + 'AKC-dev-tool-community-system-logs-info.log', pattern: '.yyyy-MM-dd', compress: true },
    'just-errors': { type: 'logLevelFilter', appender: 'emergencies', level: 'error' },
    'just-info': { type: 'logLevelFilter', appender: 'information', level: 'info' },
    'stdout': { type: 'stdout' }
  },
  categories: {
    default: { appenders: ['just-errors', 'just-info', 'everything', 'stdout'], level: 'debug' }
  }
});

const logger = log4js.getLogger();
logger.level = 'debug';

const getLogger = (moduleName) => {
  const logger = log4js.getLogger(moduleName);
  logger.level = 'debug';
  return logger;
};
exports.getLogger = getLogger;