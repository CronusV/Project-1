const express = require('express');
const router = express.Router();
// Logger
const logger = require('../utils/logger');

const userDAO = require('../integration/userDAO');
const MW = require('./middleware/logRegMW');

router.post('/', MW.validateUserPass, (req, res) => {
  logger.info('Trying to register');
  const newUser = req.body;
  if (newUser.valid) {
    userDAO
      .getUser(newUser.username)
      .then((data) => {
        // If get something back then means we already have that user
        // If {} comes back means there's no user.
        // TODO check for {}
        // TODO add user
        // Has to be a better way than this surely
        if (data && Object.keys(data).length === 0) {
          userDAO
            .addUser(newUser.username, newUser.password)
            .then((data) => {
              // If get something back then means we already have that user
              // If {} comes back means there's no user.
              // TODO check for {}
              logger.info(`Successful POST:\n ${JSON.stringify(newUser)}`);
              res.status(201).send({
                message: 'Successfully created user',
              });
            })
            .catch((err) => {
              logger.info('Failed to add item to dynamoDB');
              res
                .status(400)
                .send({ message: `Failed to add user in dynamoDB` });
            });
        } else {
          // Means we got a user back so can't create an already used user
          logger.error(
            `Couldn't create user because username already taken: ${newUser.username}`
          );
          res.status(400).send({
            message: `Couldn't create user because username already taken: ${newUser.username}`,
          });
        }
      })
      .catch((err) => {
        // Means the put failed in dynamoDB
        logger.error('DynamoDB failed put execution');
        res.status(400).send({
          message: 'DynamoDB failed PUT execution, please try again later',
        });
      });
  } else {
    logger.error(`Failed to register because either no username or password
    or empty strings in those values`);
    res.status(400).send({
      message: `Failed to register because either no username or password
    or empty strings in those values`,
    });
  }
});

module.exports = router;
