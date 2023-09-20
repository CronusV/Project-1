// Check to see that the post request has a valid username and password
function validateUserPass(req, res, next) {
  const body = req.body;
  if (
    !body.username ||
    !body.password ||
    body.username === '' ||
    body.password === ''
  ) {
    body.valid = false;
  } else {
    body.valid = true;
  }
  next();
}

module.exports = { validateUserPass };
