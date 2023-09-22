const express = require('express');
const router = express.Router();
const jwtUtil = require('../utils/jwtUtil');
const uuid = require('uuid');
// Logger
const logger = require('../utils/logger');

const ticketDAO = require('../integration/ticketDAO');
const MW = require('./middleware/ticketMW');

// Assume we have user token or header
// TODO ADD JWT TOKEN
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

// Get all tickets. If manager you have access to all tickets, if user you can only access
// your tickets
// this endpoint only accessible with valid token (JWT)
router.get('/', MW.validateGetTickets, MW.validateUser, (req, res) => {
  logger.info('Attempting to GET in ticketRouter');
  const body = req.body;
  if (body.validUser) {
    const userRole = body.role;
    const userStatus = body.status;
    const username = body.username;
    if (userRole === 'manager') {
      if (body.validTicket) {
        ticketDAO
          .getTickets(userStatus)
          .then((data) => {
            logger.info(
              `Successfully retreived available tickets with status: ${userStatus}`
            );
            res.status(200).send({
              message: `Successfully retreived available tickets with status: ${userStatus}`,
              tickets: data.Items,
            });
          })
          .catch((err) => {
            logger.error(
              `Couldn't get ALL tickets from dynamoDB, Error:${err}`
            );
            res
              .status(400)
              .send(`Couldn't get ALL tickets from dynamoDB, Error:${err}`);
          });
      } else {
        logger.error(`Error because ${body.invalidMessage}`);
        res.status(400).send({ message: body.invalidMessage });
      }
    } else if (userRole === 'employee') {
      ticketDAO
        .getTicketsByUser(username)
        .then((data) => {
          logger.info(
            `Successfully retreived all tickets for user ${username}`
          );
          res.status(200).send({
            message: `Successfully retreived all tickets for user ${username}`,
            tickets: data.Items,
          });
        })
        .catch((err) => {
          logger.error(
            `Couldn't get ALL tickets for user from dynamoDB: ${err} `
          );
          res.status(400).send({
            message: `Couldn't get ALL tickets for user from database, try again later`,
          });
        });
    }
  } else {
    logger.error(`Error because ${body.invalidMessage}`);
    res.status(400).send({ message: `Error because ${body.invalidMessage}` });
  }
});

module.exports = router;
