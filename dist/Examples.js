// =====================================================================
// Example / test functions for manual testing in Google Apps Script.
// These demonstrate usage of each service wrapper function.
// Replace AWS_CONFIG_TEST with your own credentials before running.
// =====================================================================

async function sendEmailTest() {
  initConfig(AWS_CONFIG_TEST);

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

  // Modern style: options object with pagination support
  const result = await listS3Objects('myBucket', { prefix: 'folder1/' });

  // Legacy style still works:
  // const result = await listS3Objects('myBucket', 'folder1/');

  if (result === false) {
    return false;
  }

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
  return true;
}

async function copyS3ObjectTest() {
  initConfig(AWS_CONFIG_TEST);

  const result = await copyS3Object('sourceBucket', 'file.txt', 'destBucket', 'backup/file.txt');
  if (result === false) {
    return false;
  }

  Logger.log('Copied successfully');
  return true;
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

  // Modern style: options object with filters
  const result = await listEC2Instances({ region: 'us-west-2' });

  // Legacy style still works:
  // const result = await listEC2Instances('us-west-2');

  if (result === false) {
    return false;
  }

  let instances = [];

  if (
    Object.prototype.hasOwnProperty.call(result, 'reservationSet') &&
    Object.prototype.hasOwnProperty.call(result.reservationSet, 'instancesSet')
  ) {
    instances = result.reservationSet.instancesSet;
  }

  Logger.log(`${instances.length} instance${instances.length === 1 ? '' : 's'}`);
  return instances;
}

async function listSecurityGroupsTest() {
  initConfig(AWS_CONFIG_TEST);

  // Modern style: options object
  const result = await listSecurityGroups({ region: 'us-west-2' });

  // Legacy style still works:
  // const result = await listSecurityGroups('us-west-2');

  if (result === false) {
    return false;
  }

  let groups = [];

  if (Object.prototype.hasOwnProperty.call(result, 'securityGroupInfo')) {
    groups = result.securityGroupInfo;
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
  if (putResult === false) {
    return false;
  }
  Logger.log('Put: success');

  // Get the item
  const getResult = await getDynamoDBItem('TestTable', {
    userId: { S: 'user-123' },
  });
  if (getResult !== false && getResult.Item) {
    Logger.log(`Got: ${getResult.Item.name.S}`);
  }

  // Query with reserved word handling
  const queryResult = await queryDynamoDB(
    'TestTable',
    'userId = :uid',
    {
      ':uid': { S: 'user-123' },
      ':active': { S: 'active' },
    },
    {
      expressionNames: { '#s': 'status' },
      filterExpression: '#s = :active',
    },
  );
  if (queryResult !== false) {
    Logger.log(`Query found ${queryResult.Count} items`);
  }

  // Delete
  await deleteDynamoDBItem('TestTable', {
    userId: { S: 'user-123' },
  });
  Logger.log('Delete: success');
}

async function snsTest() {
  initConfig(AWS_CONFIG_TEST);

  const result = await publishSNS('arn:aws:sns:us-east-1:123456789012:MyTopic', 'Hello from GAS!', {
    subject: 'Test Notification',
  });

  if (result === false) {
    return false;
  }

  Logger.log(`Published: ${result.MessageId}`);
  return result;
}

async function sqsTest() {
  initConfig(AWS_CONFIG_TEST);
  const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/MyQueue';

  // Send a message
  const sendResult = await sendSQSMessage(queueUrl, { action: 'test', timestamp: new Date().toISOString() });
  if (sendResult === false) {
    return false;
  }
  Logger.log(`Sent: ${sendResult.MessageId}`);

  // Receive messages
  const receiveResult = await receiveSQSMessages(queueUrl, { maxMessages: 5, waitTimeSeconds: 5 });
  if (receiveResult !== false && receiveResult.Messages) {
    Logger.log(`Received ${receiveResult.Messages.length} messages`);
    // Delete the first message
    await deleteSQSMessage(queueUrl, receiveResult.Messages[0].ReceiptHandle);
    Logger.log('Deleted first message');
  }
}

async function headS3ObjectTest() {
  initConfig(AWS_CONFIG_TEST);

  const meta = await headS3Object('myBucket', 'folder1/file.jpg');
  if (meta === false) {
    Logger.log('Object does not exist');
    return false;
  }

  Logger.log(`Size: ${meta.ContentLength} bytes, Type: ${meta.ContentType}`);
  return meta;
}

function presignedUrlTest() {
  initConfig(AWS_CONFIG_TEST);

  // Generate a download link (valid for 1 hour)
  const downloadUrl = getPresignedS3Url('myBucket', 'reports/q1.pdf');
  Logger.log(`Download URL: ${downloadUrl}`);

  // Generate an upload link (valid for 15 minutes)
  const uploadUrl = getPresignedS3Url('myBucket', 'uploads/data.csv', {
    operation: 'putObject',
    expires: 900,
    contentType: 'text/csv',
  });
  Logger.log(`Upload URL: ${uploadUrl}`);
}

async function stsTest() {
  initConfig(AWS_CONFIG_TEST);

  // Verify current credentials
  const identity = await getCallerIdentity();
  if (identity !== false) {
    Logger.log(`Account: ${identity.Account}, ARN: ${identity.Arn}`);
  }

  // Assume a cross-account role
  const assumed = await assumeRole('arn:aws:iam::987654321098:role/CrossAccountRole', 'gas-session');
  if (assumed === false) {
    return false;
  }

  // Re-init with the temporary credentials
  initConfig({
    accessKeyId: assumed.Credentials.AccessKeyId,
    secretAccessKey: assumed.Credentials.SecretAccessKey,
    sessionToken: assumed.Credentials.SessionToken,
    region: 'us-east-1',
  });

  Logger.log('Now operating with assumed role credentials');
}

async function scanDynamoDBTest() {
  initConfig(AWS_CONFIG_TEST);

  // Scan with a filter
  const result = await scanDynamoDB('Users', {
    filterExpression: '#s = :active',
    expressionNames: { '#s': 'status' },
    expressionValues: { ':active': { S: 'active' } },
    limit: 100,
  });

  if (result === false) {
    return false;
  }

  Logger.log(`Found ${result.Count} active users (scanned ${result.ScannedCount})`);
  return result.Items;
}

async function updateDynamoDBTest() {
  initConfig(AWS_CONFIG_TEST);

  const result = await updateDynamoDBItem(
    'Users',
    { userId: { S: 'user-123' } },
    'SET #n = :name, age = :age',
    { ':name': { S: 'Bob' }, ':age': { N: '31' } },
    { expressionNames: { '#n': 'name' }, returnValues: 'ALL_NEW' },
  );

  if (result === false) {
    return false;
  }

  Logger.log(`Updated: ${JSON.stringify(result.Attributes)}`);
  return result;
}
