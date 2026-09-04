'use strict';

const pino = require('pino');
const config = require('./config');

const logger = pino({
  level: config.LOG_LEVEL,
  base: { service: 'script-skill' },
  transport: {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:standard' },
  }
});

module.exports = logger;
