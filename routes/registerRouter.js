const express = require('express');
const router = express.Router();
// Logger
const logger = require('../utils/logger');

const userDAO = require('../integration/userDAO');
const MW = require('./middleware/logRegMW');

module.exports = router;
