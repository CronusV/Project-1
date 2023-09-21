const express = require('express');
const router = express.Router();
// Logger
const logger = require('../utils/logger');

const ticketDAO = require('../integration/ticketDAO');
const MW = require('./middleware/ticketMW');

// Assume we have user token or header

module.exports = router;
