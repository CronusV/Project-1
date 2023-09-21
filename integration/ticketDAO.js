// Configure to AWS
const AWS = require('aws-sdk');
AWS.config.update({
  region: 'us-east-1',
});

// Interface to DynamoDB
const docClient = new AWS.DynamoDB.DocumentClient();
// This is table name in dynamoDB
const TableName = 'tickets-project-1';

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

function getTickets(status) {
  const params = {
    TableName,
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

module.exports = { addTicket, getTickets };
