const logger = require('./logger');

// Returns a validTicket object that verifys tickets
function validateTicket(req) {
  const body = req.body;
  const validTicket = {};
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
    validTicket.invalidMessage = `${invalidMessages.join(', and ')}`;
    validTicket.valid = false;
  } else {
    validTicket.valid = true;
  }
  return validTicket;
}

function validateGetTickets(req) {
  const status = req.query.status;
  // body.status = status;
  const validTicket = {};
  validTicket.status = status;
  if (status === 'pending' || status === 'approved' || status === 'denied') {
    validTicket.valid = true;
  } else {
    validTicket.valid = false;
    validTicket.invalidMessage =
      'No valid status in query parameters. Only accept, pending, approved, and denied. If just doing GET then means you have invalid token';
  }
  return validTicket;
}

function validateNewTicketStatus(req) {
  const body = req.body;
  const newStatus = body.newStatus;
  const validTicket = {};
  if (newStatus === 'approved' || newStatus === 'denied') {
    validTicket.status = true;
  } else {
    validTicket.invalidMessage =
      'newStatus must be defined in body and be either "approved" or "denied"';
    validTicket.status = false;
  }
  return validTicket;
}
// Make sure we have ticketID as query parameter
function validateTicketIDQuery(req) {
  const body = req.body;
  const ticketID = req.query.ticketID;
  const idQuery = {};
  if (ticketID) {
    idQuery.validTicket = true;
    idQuery.ticketID = ticketID;
  } else {
    idQuery.validTicket = false;
  }
  return idQuery;
}

// NEW FUNCTIONS FOR PICTURE and TEST
function validateTicketPicture(req) {
  // If send something then there is a files
  return req.files;
}
// Validates tickets from the form
function validateTicketForm(req) {
  let ticket;

  const invalidMessages = [];
  const ticketCheck = {};
  // Only parse if valid
  console.log(req.body);
  if (req.body.ticket) {
    try {
      ticket = JSON.parse(req.body.ticket);
    } catch (err) {
      logger.error('did not format ticket JSON correctly');
      ticketCheck.invalidMessage = 'did not format ticket correctly';
      ticketCheck.valid = false;
      return ticketCheck;
    }
  }

  if (ticket) {
    // do error checking for ticket here
    if (!ticket.amount || ticket.amount === '') {
      invalidMessages.push('No amount in ticket or no amount attribute');
    }
    if (!ticket.desc || ticket.desc === '') {
      invalidMessages.push(
        'No attribute desc (description) in message or no description in message'
      );
    }

    // Add messages if error

    if (invalidMessages.length > 0) {
      ticketCheck.invalidMessage = `${invalidMessages.join(', and ')}`;
      ticketCheck.valid = false;
    } else {
      ticketCheck.valid = true;
    }
  } else {
    invalidMessages.push('Do not have ticket in form data as key');
    ticketCheck.valid = false;
  }

  ticketCheck.invalidMessage = `${invalidMessages.join(', and ')}`;
  return ticketCheck;
}
module.exports = {
  validateTicket,
  validateNewTicketStatus,
  validateGetTickets,
  validateTicketIDQuery,
  validateTicketPicture,
  validateTicketForm,
};
