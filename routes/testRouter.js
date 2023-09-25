// Create router
const express = require('express');
// Allows us to access uploaded files through postman from req.files

const router = express.Router();
const fileUpload = require('express-fileupload');
// Limits on file upload
router.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }));
const uuid = require('uuid');
// Logger
const logger = require('../utils/logger');

const ticketDAO = require('../integration/ticketDAO');
const ticketUtil = require('../utils/ticketUtil');
const validateMW = require('./middleware/validateUser');
// This post will take information from formdata and use async because this is a stretch goal so I feel it's ok.
router.post(
  '/',
  fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }),
  validateMW.validateUser,
  async (req, res) => {
    const body = req.body;
    console.log(`This is body at start! ${JSON.stringify(req.body)}`);
    // console.log(`Checking to see if we have a file ${JSON.stringify(req.files)}`);
    // Test ticket with this
    const validateTicket = ticketUtil.validateTicketForm(req);
    // Test to see if there is an file with
    const picture = ticketUtil.validateTicketPicture(req);
    // Test User with middleware
    const validUser = req.body.validUser;
    console.log(`Body: ${JSON.stringify(req.body)}`);
    // User / input validation
    if (!validUser) {
      logger.error(`Error because ${req.body.invalidMessage}`);
      res.status(400).send(`Error because ${req.body.invalidMessage}`);
      return;
    }
    console.log(
      `this is validateTicket obj: ${JSON.stringify(validateTicket)}`
    );
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
      // console.log(`This is the image: ${JSON.stringify(req.files.file)}`);
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
          .status(200)
          .send({ message: 'Successfully added ticket with image' });
      } catch (err) {
        logger.info(`Failed to add image to s3: ${err}`);
        res.status(400).send({ message: `Failed to add image to s3: ${err}` });
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
        res.status(400).send({ message: `Failed to add ticket in dynamoDB` });
      }
    }
  }
);
module.exports = router;
