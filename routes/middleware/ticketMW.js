const jwtUtil = require('../../utils/jwtUtil');
// Check to see that ticket request is valid and has at least amount AND description
function validateTicket(req, res, next) {
  const body = req.body;
  const invalidMessages = [];
  // should trim to make sure we don't get something like body.amount = "    "
  if (!body.amount || body.amount === '') {
    invalidMessages.push('No amount in ticket or no amount attribute');
  }
  if (!body.desc || body.desc === '') {
    invalidMessages.push(
      'No description in message or no description in message'
    );
  }
  // Add messages if error
  if (invalidMessages.length > 0) {
    body.invalidMessage = `${invalidMessages.join(', and ')}`;
    body.valid = false;
  } else {
    body.valid = true;
  }
  next();
}

function validateGetTickets(req, res, next) {
  const body = req.body;
  const status = req.query.status;
  body.status = status;
  if (status === 'pending' || status === 'approved' || status === 'denied') {
    body.validTicket = true;
  } else {
    body.validTicket = false;
    body.invalidMessage =
      'No valid status in query parameters. Only accept, pending, approved, and denied';
  }
  next();
}

// Make sure we have valid token
function validateUser(req, res, next) {
  const body = req.body;
  const authorizationHead = req.headers.authorization;
  // Confirm that authorization exists and have Bearer
  if (authorizationHead && authorizationHead.startsWith('Bearer ')) {
    const token = authorizationHead.split(' ')[1]; // ['Bearer', <token>]
    jwtUtil.verifyTokenAndReturnPayload(token).then((payload) => {
      const userRole = payload.role;
      if (userRole === 'employee' || userRole === 'manager') {
        body.validUser = true;
        body.role = userRole;
      } else {
        // Means that userRole is something we don't have implemented yet
        body.validUser = false;
        body.role = userRole;
        body.invalidMessage = `Get not defined for role:${userRole}`;
      }
    });
  } else {
    // No authorization
    body.validUser = false;
    body.invalidMessage = 'Need Authorization header with Bearer token';
  }
  next();
}

module.exports = { validateTicket, validateGetTickets, validateUser };
