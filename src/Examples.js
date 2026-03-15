// =====================================================================
// Example / test functions for manual testing in Google Apps Script.
// These demonstrate usage of each service wrapper function.
// Replace AWS_CONFIG_TEST with your own credentials before running.
// =====================================================================

async function sendEmailTest() {
  initConfig(AWS_CONFIG_TEST);

  try {
    const result = await sendEmail({
      to: 'Your Name <you@example.com>',
      from: 'Google Apps Script <from@aws-domain.com>',
      replyTo: 'no-reply@example.com',
      subject: 'Simple email test',
      html: '<html><body><strong>This is an HTML message.</strong> Sent by AWS.</body></html>',
    });

    Logger.log(`Sent: ${result.MessageId}`);
    return result.MessageId;
  } catch (err) {
    Logger.log(err, err.stack);
    return null;
  }
}

async function listS3ObjectsTest() {
  initConfig(AWS_CONFIG_TEST);

  try {
    const result = await listS3Objects('myBucket', { prefix: 'folder1/' });
    let files = [];
    let folders = [];

    if (Object.prototype.hasOwnProperty.call(result, 'CommonPrefixes') && result.CommonPrefixes) {
      folders = result.CommonPrefixes.map((item) => item.Prefix);
    }
    if (Object.prototype.hasOwnProperty.call(result, 'Contents') && result.Contents) {
      files = result.Contents;
    }

    Logger.log(`${files.length} file${files.length === 1 ? '' : 's'}, ${folders.length} folder${folders.length === 1 ? '' : 's'}`);
    return { folders, files };
  } catch (err) {
    Logger.log(err, err.stack);
    return null;
  }
}

async function getS3ObjectTest() {
  initConfig(AWS_CONFIG_TEST);

  try {
    const result = await getS3Object('myBucket', 'folder1/file.jpg');
    const blob = Utilities.newBlob(result.Body, result.ContentType);
    return blob;
  } catch (err) {
    Logger.log(err, err.stack);
    return null;
  }
}

async function putS3ObjectTest() {
  initConfig(AWS_CONFIG_TEST);

  try {
    const result = await putS3Object('myBucket', 'folder1/test.txt', 'Hello from GAS', {
      contentType: 'text/plain',
    });
    Logger.log(`Uploaded: ETag ${result.ETag}`);
    return result;
  } catch (err) {
    Logger.log(err, err.stack);
    return null;
  }
}

async function deleteS3ObjectTest() {
  initConfig(AWS_CONFIG_TEST);

  try {
    await deleteS3Object('myBucket', 'folder1/test.txt');
    Logger.log('Deleted successfully');
    return true;
  } catch (err) {
    Logger.log(err, err.stack);
    return null;
  }
}

async function copyS3ObjectTest() {
  initConfig(AWS_CONFIG_TEST);

  try {
    await copyS3Object('sourceBucket', 'file.txt', 'destBucket', 'backup/file.txt');
    Logger.log('Copied successfully');
    return true;
  } catch (err) {
    Logger.log(err, err.stack);
    return null;
  }
}

async function invokeLambdaTest() {
  initConfig(AWS_CONFIG_TEST);

  try {
    const payload = {
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
    };
    const result = await invokeLambda('helloWorld', payload);
    Logger.log(result);
    return result;
  } catch (err) {
    Logger.log(err, err.stack);
    return null;
  }
}

async function listEC2InstancesTest() {
  initConfig(AWS_CONFIG_TEST);

  try {
    const result = await listEC2Instances({ region: 'us-west-2' });
    let instances = [];

    if (
      Object.prototype.hasOwnProperty.call(result, 'reservationSet') &&
      Object.prototype.hasOwnProperty.call(result.reservationSet, 'instancesSet')
    ) {
      instances = result.reservationSet.instancesSet;
    }

    Logger.log(`${instances.length} instance${instances.length === 1 ? '' : 's'}`);
    return instances;
  } catch (err) {
    Logger.log(err, err.stack);
    return null;
  }
}

async function listSecurityGroupsTest() {
  initConfig(AWS_CONFIG_TEST);

  try {
    const result = await listSecurityGroups({ region: 'us-west-2' });
    let groups = [];

    if (Object.prototype.hasOwnProperty.call(result, 'securityGroupInfo')) {
      groups = result.securityGroupInfo;
    }

    Logger.log(`${groups.length} security group${groups.length === 1 ? '' : 's'}`);
    return groups;
  } catch (err) {
    Logger.log(err, err.stack);
    return null;
  }
}

async function dynamoDBTest() {
  initConfig(AWS_CONFIG_TEST);

  try {
    // Put an item
    await putDynamoDBItem('TestTable', {
      userId: { S: 'user-123' },
      name: { S: 'Alice' },
      age: { N: '30' },
    });
    Logger.log('Put: success');

    // Get the item
    const getResult = await getDynamoDBItem('TestTable', {
      userId: { S: 'user-123' },
    });
    if (getResult.Item) {
      Logger.log(`Got: ${getResult.Item.name.S}`);
    }

    // Query
    const queryResult = await queryDynamoDB('TestTable', 'userId = :uid', {
      ':uid': { S: 'user-123' },
    });
    Logger.log(`Query found ${queryResult.Count} items`);

    // Delete
    await deleteDynamoDBItem('TestTable', {
      userId: { S: 'user-123' },
    });
    Logger.log('Delete: success');
  } catch (err) {
    Logger.log(err, err.stack);
  }
}

async function snsTest() {
  initConfig(AWS_CONFIG_TEST);

  try {
    const result = await publishSNS('arn:aws:sns:us-east-1:123456789012:MyTopic', 'Hello from GAS!', {
      subject: 'Test Notification',
    });
    Logger.log(`Published: ${result.MessageId}`);
    return result;
  } catch (err) {
    Logger.log(err, err.stack);
    return null;
  }
}

async function sqsTest() {
  initConfig(AWS_CONFIG_TEST);
  const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/MyQueue';

  try {
    // Send a message
    const sendResult = await sendSQSMessage(queueUrl, { action: 'test', timestamp: new Date().toISOString() });
    Logger.log(`Sent: ${sendResult.MessageId}`);

    // Receive messages
    const receiveResult = await receiveSQSMessages(queueUrl, { maxMessages: 5, waitTimeSeconds: 5 });
    if (receiveResult.Messages) {
      Logger.log(`Received ${receiveResult.Messages.length} messages`);
      // Delete the first message
      await deleteSQSMessage(queueUrl, receiveResult.Messages[0].ReceiptHandle);
      Logger.log('Deleted first message');
    }
  } catch (err) {
    Logger.log(err, err.stack);
  }
}
