const jwtUtil = require('../../utils/jwtUtil');
// Make sure we have valid token
// Need to make await because jwtUtil was promised
async function validateUser(req, res, next) {
  const body = req.body;
  const authorizationHead = req.headers.authorization;
  // Confirm that authorization exists and have Bearer
  if (authorizationHead && authorizationHead.startsWith('Bearer ')) {
    const token = authorizationHead.split(' ')[1]; // ['Bearer', <token>]
    await jwtUtil
      .verifyTokenAndReturnPayload(token)
      .then((payload) => {
        const username = payload.username;
        const userRole = payload.role;
        if (userRole === 'employee' || userRole === 'manager') {
          body.validUser = true;
        } else {
          // Means that userRole is something we don't have implemented yet
          body.validUser = false;
          body.invalidMessage = `Get not defined for role:${userRole}`;
        }
        body.role = userRole;
        body.username = username;
      })
      .catch((err) => {
        logger.info(`Error with jwtUtil ${err}`);
        body.invalidMessage = err;
        body.validUser = false;
      });
  } else {
    // No authorization
    body.validUser = false;
    body.invalidMessage = 'Need Authorization header with Bearer token';
  }
  next();
}

module.exports = { validateUser };
