// Configure to AWS
const AWS = require('aws-sdk');
AWS.config.update({
  region: 'us-east-1',
});

// Interface to DynamoDB
const docClient = new AWS.DynamoDB.DocumentClient();
// This is table name in dynamoDB
const TableName = 'tickets-project-1';
// GSI to for status
const statusGSI = 'status-index';
// GSI for author in tickets table
const authorGSI = 'author-index';
// POST tickets
// if successful then returns {}, if not then throws error
function addTicket(
  ticket_id,
  amount,
  desc,
  author,
  type = 'none',
  status = 'pending',
  resolver_id = 0
) {
  const params = {
    TableName,
    Item: {
      ticket_id,
      amount,
      desc,
      author,
      type,
      status,
      resolver_id,
    },
  };
  return docClient.put(params).promise();
}

// This is manager function so they get access to all tickets depending on the status
// pending, denied, approved
function getTickets(status) {
  const params = {
    TableName,
    IndexName: statusGSI,
    KeyConditionExpression: '#status = :status',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':status': status,
    },
  };
  return docClient.query(params).promise();
}
// Gets all tickets from user using GSI
function getTicketsByUser(author) {
  const params = {
    TableName,
    IndexName: authorGSI,
    KeyConditionExpression: '#author = :author',
    ExpressionAttributeNames: {
      '#author': 'author',
    },
    ExpressionAttributeValues: {
      ':author': author,
    },
  };
  return docClient.query(params).promise();
}

function getTicketByID(ticket_id) {
  const params = {
    TableName,
    Key: {
      ticket_id,
    },
  };
  return docClient.get(params).promise();
}

function updateTicketByID(ticket_id, newStatus, resolver_id) {
  let params = {
    TableName,
    Key: { ticket_id },
    UpdateExpression: 'set #status = :status, #resolver_id = :resolver_id',
    ExpressionAttributeNames: {
      '#status': 'status',
      '#resolver_id': 'resolver_id',
    },
    ExpressionAttributeValues: {
      ':status': newStatus,
      ':resolver_id': resolver_id,
    },
  };

  return docClient.update(params).promise();
}
module.exports = {
  addTicket,
  getTickets,
  getTicketsByUser,
  getTicketByID,
  updateTicketByID,
};
