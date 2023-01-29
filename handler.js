"use strict";
const DynamoDB = require("aws-sdk/clients/dynamodb");
const documentClient = new DynamoDB.DocumentClient({
  region: "us-east-1",
  // To fix DynamoDB timeouts as API-Gateway returns timeout in 29 secs
  // https://seed.run/blog/how-to-fix-dynamodb-timeouts-in-serverless-application.html
  httpOptions: {
    timeout: 5000
  },
  maxRetries: 3// by default 10 times
});
const NOTES_TABLE_NAME = process.env.NOTES_TABLE_NAME;

module.exports.createNote = async (event, context, callback) => {
  // Optimization
  // This flag is to avoid latency happened due to processing promises and callback by Node Event Loop FW
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    let data = JSON.parse(event.body);
    const params = {
      TableName: NOTES_TABLE_NAME,
      Item: {
        notesId: data.id,
        title: data.title,
        body: data.body,
      },
      // Throws validation errors if notesId already exists
      ConditionExpression: "attribute_not_exists(notesId)",
    };
    await documentClient.put(params).promise();
    callback(null, send(201, data));
  } catch (error) {
    callback(null, send(500, error.message));
  }
};

module.exports.updateNote = async (event, context, callback) => {
  // Optimization
  // This flag is to avoid latency happened due to processing promises and callback by Node Event Loop FW
  context.callbackWaitsForEmptyEventLoop = false;
  const notesId = event.pathParameters.id;
  try {
    let data = JSON.parse(event.body);
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: {
        notesId,
      },
      UpdateExpression: `set #title= :title, #body= :body`,
      ExpressionAttributeNames: {
        "#title": "title",
        "#body": "body",
      },
      ExpressionAttributeValues: {
        ":title": data.title,
        ":body": data.body,
      },
      // Throws validation errors if notesId is question does not exists
      ConditionExpression: "attribute_exists(notesId)",
    };
    await documentClient.update(params).promise();
    callback(null, send(200, data));
  } catch (error) {
    callback(null, send(500, error.message));
  }
};

module.exports.deleteNote = async (event, context, callback) => {
  // Optimization
  // This flag is to avoid latency happened due to processing promises abd callback by Node Event Loop FW
  context.callbackWaitsForEmptyEventLoop = false;
  const notesId = event.pathParameters.id;
  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: {
        notesId,
      },
      // Throws validation errors if notesId is question does not exists
      ConditionExpression: "attribute_exists(notesId)",
    };
    await documentClient.delete(params).promise();
    callback(null, send(200, notesId));
  } catch (error) {
    callback(null, send(500, error.message));
  }
};

module.exports.getAllNotes = async (event, context, callback) => {
  // Optimization
  // This flag is to avoid latency happened due to processing promises and callback by Node Event Loop FW
  context.callbackWaitsForEmptyEventLoop = false;

  // "foo": "bar" from lamda authorizer 
  // Way to pass values from lamda to lamda (microserveces)
  console.log("foo: bar", JSON.stringify(event.requestContext.authorizer))
  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
    };
    const notes = await documentClient.scan(params).promise();
    callback(null, send(200, notes));
  } catch (error) {
    callback(null, send(500, error.message));
  }
};

const send = (statusCode, data) => ({
  statusCode,
  body: JSON.stringify(data),
});
