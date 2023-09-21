// Check to see that ticket request is valid and has at least amount AND description
function validateTicket(req, res, next) {
  const body = req.body;
  const invalidMessages = [];
  if (!body.amount) invalidMessages.push('No amount in ticket');
  if (!body.desc) invalidMessages.push('No description in message');
  // Add messages if error
  if (invalidMessages.length > 0) {
    body.invalidMessage = `Invalid ticket because ${invalidMessages.join(
      ', and'
    )}`;
    body.valid = false;
  } else {
    body.valid = true;
  }
  next();
}

module.exports = { validateTicket };
