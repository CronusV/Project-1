// Create router
const express = require('express');
const router = express.Router();
const jwtUtil = require('../utils/jwtUtil');
// Logger
const logger = require('../utils/logger');

const userDAO = require('../integration/userDAO');
const loginUtil = require('../utils/loginUtil');

router.post('/', (req, res) => {
  logger.info('Trying to login');
  const userReq = req.body;
  const validReq = loginUtil.validateUserPass(req);
  if (validReq) {
    userDAO
      .getUser(userReq.username)
      .then((data) => {
        const user = data.Item;
        // Check if user is undefined
        if (user) {
          if (user.password === userReq.password) {
            logger.info(
              `Succesfull login, current user ${JSON.stringify(user)}`
            );
            // Create token (jwt)
            const token = jwtUtil.createJWT(user.username, user.role);
            // Set header to current user and send their role back
            res.setHeader('Current-User', user.username);
            res.status(201).send({ role: user.role, token });
          } else {
            logger.error('Username and password do not match');
            res
              .status(401)
              .send({ message: 'Username and password do not match' });
          }
        } else {
          logger.error(`This username does not exist: ${userReq.username}`);
          res.status(400).send({
            message: `This username does not exist: ${userReq.username}`,
          });
        }
      })
      .catch((err) => {
        logger.error(
          `Failed to get item from DyanamoDB because invalid username. Error ${err}`
        );
        res.status(400).send({
          message: 'Failed to get item from DyanamoDB because invalid username',
        });
      });
  } else {
    logger.error(`Failed to login because either no username or password
    or empty strings in those values`);
    res.status(400).send({
      message: `Failed to login because either no username or password
    or empty strings in those values`,
    });
  }
});
module.exports = router;
