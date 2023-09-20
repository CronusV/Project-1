// Logger
const logger = require('./utils/logger');
// Init Express server
const express = require('express');
const server = express();
const PORT = 3000;
// router
// TODO
// middleware to parse JSON from req
const bodyParser = require('body-parser');
server.use(bodyParser.json());

// Test express
server.use('/', (req, res) => {
  logger.info('In test express endpoint');
  res.send('In test server');
});
// Spin up server
server.listen(PORT, () => {
  logger.info(`Server is listening on Port: ${PORT}`);
});
