const express = require('express');
const router = express.Router();
const jwtUtil = require('../utils/jwtUtil');
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
        // If {} comes back means there's no user.
        // Has to be a better way than this, surely
        if (data && Object.keys(data).length === 0) {
          userDAO
            .addUser(newUser.username, newUser.password)
            .then((data) => {
              // If valid then data is simply {}
              // Create token (jwt)
              const token = jwtUtil.createJWT(newUser.username, newUser.role);
              logger.info(`Successful POST:\n ${JSON.stringify(newUser)}`);
              res.status(201).send({
                message: 'Successfully created user',
                token,
              });
            })
            .catch((err) => {
              logger.info(`Failed to add user to dynamoDB: ${err}`);
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
