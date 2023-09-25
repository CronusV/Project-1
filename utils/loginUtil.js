function validateUserPass(req) {
  const body = req.body;
  if (
    !body.username ||
    !body.password ||
    body.username === '' ||
    body.password === ''
  ) {
    return false;
  } else {
    return true;
  }
}

module.exports = { validateUserPass };
