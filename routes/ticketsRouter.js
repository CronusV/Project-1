const express = require('express');
const router = express.Router();
const uuid = require('uuid');
// Logger
const logger = require('../utils/logger');

const ticketDAO = require('../integration/ticketDAO');
const MW = require('./middleware/ticketMW');

// Assume we have user token or header
router.post('/', MW.validateTicket, (req, res) => {
  logger.info('Trying to post tickets');
  const newTicket = req.body;
  if (newTicket.valid) {
    // ASSUME WE HAVE AUTHOR SOMEWHERE (probably jwt token)
    const ticket_id = uuid.v4();
    ticketDAO
      .addTicket(
        ticket_id,
        newTicket.amount,
        newTicket.desc,
        newTicket.author,
        newTicket.type
      )
      .then((data) => {
        // if valid then data is simply {}
        logger.info(`Successful POST:\n ${JSON.stringify(newTicket)}`);
        res.status(201).send({
          message: 'Successfully created ticket',
          ticket_id,
        });
      })
      .catch((err) => {
        logger.info(`Failed to add ticket to dynamoDB: ${err}`);
        res.status(400).send({ message: `Failed to add ticket in dynamoDB` });
      });
  } else {
    logger.error(`Failed to post ticket because: ${newTicket.invalidMessage}`);
    res.status(400).send({
      message: `Failed to post ticket because: ${newTicket.invalidMessage}`,
    });
  }
});
module.exports = router;
