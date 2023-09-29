const express = require('express');
const router = express.Router();
const fileUpload = require('express-fileupload');
// Limits on file upload
// router.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }));
const uuid = require('uuid');
// Logger
const logger = require('../utils/logger');

const ticketDAO = require('../integration/ticketDAO');
const validateMW = require('./middleware/validateUser');
const ticketUtil = require('../utils/ticketUtil');
const { raw } = require('body-parser');

// Assume we have user token or header
// Post tickets
router.post(
  '/',
  fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }),
  validateMW.validateUser,
  async (req, res) => {
    const body = req.body;
    // Test ticket with this
    const validateTicket = ticketUtil.validateTicketForm(req);
    // Test to see if there is an file with
    const picture = ticketUtil.validateTicketPicture(req);
    // Test User with middleware
    const validUser = req.body.validUser;
    // User / input validation
    if (!validUser) {
      logger.error(`Error because ${req.body.invalidMessage}`);
      res.status(400).send(`Error because ${req.body.invalidMessage}`);
      return;
    }
    if (!validateTicket.valid) {
      logger.error(`Error because ${validateTicket.invalidMessage}`);
      res
        .status(400)
        .send({ message: `Error because ${validateTicket.invalidMessage}` });
      return;
    }

    const ticket = JSON.parse(req.body.ticket);
    // ASSUME WE HAVE AUTHOR SOMEWHERE (probably jwt token)
    const ticket_id = uuid.v4();
    // Check if we want to send with or without picture
    if (picture) {
      const picture_id = uuid.v4();
      contentType = req.files.file.mimetype;
      // buffer: Buffer.from(req.files.file.data)
      try {
        // Success returns undefined
        const pictureReq = await ticketDAO.addImage(
          Buffer.from(req.files.file.data),
          picture_id,
          contentType
        );
        // upload ticket
        const dataTicket = await ticketDAO.addTicket(
          ticket_id,
          ticket.amount,
          ticket.desc,
          body.username,
          ticket.type,
          undefined,
          ticket.resolver_id,
          picture_id
        );
        logger.info('Successfully added ticket with image');
        res
          .status(201)
          .send({ message: 'Successfully added ticket with image' });
      } catch (err) {
        logger.info(`Failed to add image to s3: ${err}`);
        res.status(500).send({ message: `Failed to add image to s3: ${err}` });
      }
    } else {
      try {
        const dataTicket = await ticketDAO.addTicket(
          ticket_id,
          ticket.amount,
          ticket.desc,
          body.username,
          ticket.type
        );
        // if valid then data is simply {}
        logger.info(`Successful POST:\n ${JSON.stringify(body)}`);
        res.status(201).send({
          message: 'Successfully created ticket',
          ticket_id,
        });
      } catch (err) {
        logger.info(`Failed to add ticket to dynamoDB: ${err}`);
        res.status(500).send({ message: `Failed to add ticket in dynamoDB` });
      }
    }
  }
);
//This takes care of changing tickets status
router.put('/', validateMW.validateUser, (req, res) => {
  logger.info('Attempting to PUT in ticketRouter');
  const body = req.body;

  const validNewStatus = ticketUtil.validateNewTicketStatus(req);
  const validTicketStatus = validNewStatus.status;
  const idQuery = ticketUtil.validateTicketIDQuery(req);
  const validQuery = idQuery.validTicket;

  if (body.validUser && validTicketStatus && validQuery) {
    const userRole = body.role;
    const username = body.username;
    const ticketID = idQuery.ticketID;
    const newStatus = body.newStatus;

    if (userRole === 'employee') {
      logger.error(`Can't process requests with role: ${userRole}`);
      res
        .status(401)
        .send({ message: `Can't process requests with role: ${userRole}` });
    }
    if (userRole === 'manager') {
      // Get ticket that was asked for
      ticketDAO.getTicketByID(ticketID).then((data) => {
        const ticket = data.Item;
        ticket.resolver_id = username;
        if (ticket) {
          if (ticket.author === username) {
            logger.error('Can not edit your own ticket!');
            res.status(401).send({ message: 'Can not edit your own ticket!' });
            return;
          }
          if (ticket.status !== 'pending') {
            logger.error(
              `Can not edit ticket that has already been processed! Ticket status: ${ticket.status}`
            );
            res.status(401).send({
              message: `Can not edit ticket that has already been processed! Ticket status: ${ticket.status}`,
            });
          } else {
            ticketDAO
              .updateTicketByID(ticketID, newStatus, username)
              .then((data) => {
                ticket.status = newStatus;
                logger.info(
                  `Successfully updated item: ${ticketID} with status: ${newStatus}`
                );
                res.status(200).send({
                  message: `Successfully updated item: ${ticketID} with status: ${newStatus}`,
                  ticket,
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
    if (!validTicketStatus) {
      logger.error(`Error because ${validNewStatus.invalidMessage}`);
      res
        .status(400)
        .send({ message: `Error because ${validNewStatus.invalidMessage}` });
    } else if (!validQuery) {
      logger.error(`Error because ${idQuery.invalidMessage}`);
      res
        .status(400)
        .send({ message: `Error because ${idQuery.invalidMessage}` });
    } else {
      logger.error(`Error because ${body.invalidMessage}`);
      res.status(400).send({ message: `Error because ${body.invalidMessage}` });
    }
  }
});

// Get all tickets. If manager you have access to all tickets, if user you can only access
// your tickets
// this endpoint only accessible with valid token (JWT)
router.get('/', validateMW.validateUser, (req, res) => {
  logger.info('Attempting to GET in ticketRouter');
  const body = req.body;
  const validGetTicket = ticketUtil.validateGetTickets(req);

  if (body.validUser) {
    const userRole = body.role;
    const userStatus = validGetTicket.status;
    const username = body.username;
    if (userRole === 'manager') {
      if (!validGetTicket.valid) {
        logger.error(validGetTicket.invalidMessage);
        res.status(400).send({ message: validGetTicket.invalidMessage });
        return;
      }

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
          logger.error(`Couldn't get ALL tickets from dynamoDB, Error:${err}`);
          res
            .status(400)
            .send(`Couldn't get ALL tickets from dynamoDB, Error:${err}`);
        });
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
