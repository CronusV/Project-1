const express = require('express');
const router = express.Router();
const jwtUtil = require('../utils/jwtUtil');
const uuid = require('uuid');
// Logger
const logger = require('../utils/logger');

const ticketDAO = require('../integration/ticketDAO');
const MW = require('./middleware/ticketMW');

// Assume we have user token or header
router.post('/', MW.validateTicket, MW.validateUser, (req, res) => {
  logger.info('Trying to post tickets');
  const body = req.body;
  const valid = body.valid;
  if (body.validUser) {
    if (valid) {
      // ASSUME WE HAVE AUTHOR SOMEWHERE (probably jwt token)
      const ticket_id = uuid.v4();
      ticketDAO
        .addTicket(ticket_id, body.amount, body.desc, body.username, body.type)
        .then((data) => {
          // if valid then data is simply {}
          logger.info(`Successful POST:\n ${JSON.stringify(body)}`);
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
      logger.error(`Failed to post ticket because: ${body.invalidMessage}`);
      res.status(400).send({
        message: `Failed to post ticket because: ${body.invalidMessage}`,
      });
    }
  } else {
    logger.error(`Error because ${body.invalidMessage}`);
    res.status(400).send({ message: `Error because ${body.invalidMessage}` });
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
//This takes care of changing requests
router.put(
  '/',
  MW.validateTicketIDQuery,
  MW.validateUser,
  MW.validateNewTicketStatus,
  (req, res) => {
    logger.info('Attempting to POST in ticketRouter');
    const body = req.body;
    const validTicketStatus = body.validTicketStatus;
    if (body.validUser && validTicketStatus) {
      const userRole = body.role;
      const username = body.username;
      const ticketID = body.ticketID;
      const newStatus = body.newStatus;

      if (userRole === 'employee') {
        logger.error(`Can't process requests with role: ${userRole}`);
        res
          .status(400)
          .send({ message: `Can't process requests with role: ${userRole}` });
      }
      if (userRole === 'manager') {
        // Get ticket that was asked for
        ticketDAO.getTicketByID(ticketID).then((data) => {
          const ticket = data.Item;
          if (ticket) {
            if (ticket.author === username) {
              logger.error('Can not edit your own ticket!');
              res
                .status(400)
                .send({ message: 'Can not edit your own ticket!' });
            }
            if (ticket.status !== 'pending') {
              logger.error(
                `Can not edit ticket that has already been processed! Ticket status: ${ticket.status}`
              );
              res.status(400).send({
                message: `Can not edit ticket that has already been processed! Ticket status: ${ticket.status}`,
              });
            } else {
              ticketDAO
                .updateTicketByID(ticketID, newStatus, username)
                .then((data) => {
                  logger.info(
                    `Successfully updated item: ${ticketID} with status: ${newStatus}`
                  );
                  res.status(200).send({
                    message: `Successfully updated item: ${ticketID} with status: ${newStatus}`,
                  });
                })
                .catch((err) => {
                  logger.info(`Unable to update item ${ticketID} in dynamoDB`);
                  res.status(500).send({
                    message: `Unable to update item ${ticketID} in dynamoDB`,
                  });
                });
            }
            // Means ticket is pending and we should change it
          } else {
            logger.error(`Did not find any ticket with ticketID:${ticketID}`);
            res.status(400).send({
              message: `Did not find any ticket with ticketID:${ticketID}`,
            });
          }
        });
      }
    } else {
      logger.error(`Error because ${body.invalidMessage}`);
      res.status(400).send({ message: `Error because ${body.invalidMessage}` });
    }
  }
);
module.exports = router;
