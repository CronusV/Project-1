const logger = require('../../utils/logger');

function logRequest(req, res, next) {
  logger.info(`Attempting Method: ${req.method} : ${req.originalUrl}`);
  next();
}

module.exports = { logRequest };
