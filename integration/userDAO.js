// Configure to AWS
const AWS = require('aws-sdk');
AWS.config.update({
  region: 'us-east-1',
});

// Interface to DynamoDB
const docClient = new AWS.DynamoDB.DocumentClient();
// This is table name in dynamoDB
const TableName = 'users-project-1';

// GET user
function getUser(username) {
  // Query like this when you have a partion key AND sort key. If you want to use
  // get then also have to include sort attribute and value in Key.
  // const params = {
  //   TableName,
  //   KeyConditionExpression: 'username = :n',
  //   ExpressionAttributeValues: { ':n': username },
  // };
  // docClient.query(params).promise();
  // console.log(`params: ${JSON.stringify(params)}`);
  const params = {
    TableName: TableName,
    Key: { username },
  };
  return docClient.get(params).promise();
}

// POST user
// if successful then returns {}, if not then throws error
function addUser(username, password, role = 'employee') {
  const params = {
    TableName,
    Item: {
      username,
      password,
      role,
    },
  };
  return docClient.put(params).promise();
}

module.exports = { getUser, addUser };
