// =====================================================================
// Example / test functions for manual testing in Google Apps Script.
// These demonstrate usage of each service wrapper function.
// Replace AWS_CONFIG_TEST with your own credentials before running.
// =====================================================================

async function sendEmailTest() {
  initConfig(AWS_CONFIG_TEST);

  // Modern options-object style
  const result = await sendEmail({
    to: 'Your Name <you@example.com>',
    from: 'Google Apps Script <from@aws-domain.com>',
    replyTo: 'no-reply@example.com',
    subject: 'Simple email test',
    html: '<html><body><strong>This is an HTML message.</strong> Sent by AWS.</body></html>',
  });

  if (result === false) {
    return false;
  }

  Logger.log(`Sent: ${result.MessageId}`);
  return result.MessageId;
}

async function listS3ObjectsTest() {
  initConfig(AWS_CONFIG_TEST);
  const result = await listS3Objects('myBucket', 'folder1/');
  let files = [];
  let folders = [];

  if (result !== false) {
    if (Object.prototype.hasOwnProperty.call(result, 'CommonPrefixes')) {
      folders = result.CommonPrefixes instanceof Array ? result.CommonPrefixes.map((item) => item.Prefix) : [result.CommonPrefixes.Prefix];
    }
    if (Object.prototype.hasOwnProperty.call(result, 'Contents')) {
      files = result.Contents instanceof Array ? result.Contents : [result.Contents];
    }
  }

  Logger.log(`${files.length} file${files.length === 1 ? '' : 's'}, ${folders.length} folder${folders.length === 1 ? '' : 's'}`);
  return { folders: folders, files: files };
}

async function getS3ObjectTest() {
  initConfig(AWS_CONFIG_TEST);
  const result = await getS3Object('myBucket', 'folder1/file.jpg');
  if (result === false) {
    return false;
  }

  const blob = Utilities.newBlob(result.Body, result.ContentType);
  return blob;
}

async function putS3ObjectTest() {
  initConfig(AWS_CONFIG_TEST);
  const result = await putS3Object('myBucket', 'folder1/test.txt', 'Hello from GAS', {
    contentType: 'text/plain',
  });
  if (result === false) {
    return false;
  }

  Logger.log(`Uploaded: ETag ${result.ETag}`);
  return result;
}

async function deleteS3ObjectTest() {
  initConfig(AWS_CONFIG_TEST);
  const result = await deleteS3Object('myBucket', 'folder1/test.txt');
  if (result === false) {
    return false;
  }

  Logger.log('Deleted successfully');
  return result;
}

async function copyS3ObjectTest() {
  initConfig(AWS_CONFIG_TEST);
  const result = await copyS3Object('sourceBucket', 'file.txt', 'destBucket', 'backup/file.txt');
  if (result === false) {
    return false;
  }

  Logger.log('Copied successfully');
  return result;
}

async function invokeLambdaTest() {
  initConfig(AWS_CONFIG_TEST);
  const payload = {
    key1: 'value1',
    key2: 'value2',
    key3: 'value3',
  };
  const result = await invokeLambda('helloWorld', payload);
  if (result === false) {
    return false;
  }

  Logger.log(result);
  return result;
}

async function listEC2InstancesTest() {
  initConfig(AWS_CONFIG_TEST);
  const result = await listEC2Instances('us-west-2');
  let instances = [];

  if (result !== false) {
    if (
      Object.prototype.hasOwnProperty.call(result, 'reservationSet') &&
      Object.prototype.hasOwnProperty.call(result.reservationSet, 'instancesSet')
    ) {
      instances = result.reservationSet.instancesSet;
    }
  }

  Logger.log(`${instances.length} instance${instances.length === 1 ? '' : 's'}`);
  return instances;
}

async function listSecurityGroupsTest() {
  initConfig(AWS_CONFIG_TEST);
  const result = await listSecurityGroups('us-west-2');
  let groups = [];

  if (result !== false) {
    if (Object.prototype.hasOwnProperty.call(result, 'securityGroupInfo')) {
      groups = result.securityGroupInfo;
    }
  }

  Logger.log(`${groups.length} security group${groups.length === 1 ? '' : 's'}`);
  return groups;
}

async function dynamoDBTest() {
  initConfig(AWS_CONFIG_TEST);

  // Put an item
  const putResult = await putDynamoDBItem('TestTable', {
    userId: { S: 'user-123' },
    name: { S: 'Alice' },
    age: { N: '30' },
  });
  Logger.log(`Put: ${putResult !== false}`);

  // Get the item
  const getResult = await getDynamoDBItem('TestTable', {
    userId: { S: 'user-123' },
  });
  if (getResult !== false && getResult.Item) {
    Logger.log(`Got: ${getResult.Item.name.S}`);
  }

  // Query
  const queryResult = await queryDynamoDB('TestTable', 'userId = :uid', {
    ':uid': { S: 'user-123' },
  });
  if (queryResult !== false) {
    Logger.log(`Query found ${queryResult.Count} items`);
  }

  // Delete
  const deleteResult = await deleteDynamoDBItem('TestTable', {
    userId: { S: 'user-123' },
  });
  Logger.log(`Delete: ${deleteResult !== false}`);
}

async function snsTest() {
  initConfig(AWS_CONFIG_TEST);
  const result = await publishSNS('arn:aws:sns:us-east-1:123456789012:MyTopic', 'Hello from GAS!', {
    subject: 'Test Notification',
  });
  if (result !== false) {
    Logger.log(`Published: ${result.MessageId}`);
  }
  return result;
}

async function sqsTest() {
  initConfig(AWS_CONFIG_TEST);
  const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/MyQueue';

  // Send a message
  const sendResult = await sendSQSMessage(queueUrl, { action: 'test', timestamp: new Date().toISOString() });
  if (sendResult !== false) {
    Logger.log(`Sent: ${sendResult.MessageId}`);
  }

  // Receive messages
  const receiveResult = await receiveSQSMessages(queueUrl, { maxMessages: 5, waitTimeSeconds: 5 });
  if (receiveResult !== false && receiveResult.Messages) {
    Logger.log(`Received ${receiveResult.Messages.length} messages`);

    // Delete the first message
    await deleteSQSMessage(queueUrl, receiveResult.Messages[0].ReceiptHandle);
    Logger.log('Deleted first message');
  }
}
