async function sendEmailTest() {
  initConfig(AWS_CONFIG_TEST);
  var result = await sendEmail(
    'Your Name <you@example.com>', // to
    '', // cc
    '', // bcc
    'Google Apps Script <from@aws-domain.com>', // from
    'no-reply@example.com', // reply-to
    'Simple email test', // subject
    '<html><body><strong>This is an HTML message.</strong> Sent by AWS.</body></html>', // html
  );

  if (result === false) {
    return false;
  }

  Logger.log(`Sent: ${result.MessageId}`);
  return result.MessageId;
}

async function listS3ObjectsTest() {
  initConfig(AWS_CONFIG_TEST);
  var result = await listS3Objects('myBucket', 'folder1/');
  var files = [];
  var folders = [];

  if (result !== false) {
    if (result.hasOwnProperty('CommonPrefixes')) {
      folders = result.CommonPrefixes instanceof Array ? result.CommonPrefixes.map((item) => item.Prefix) : [result.CommonPrefixes.Prefix];
    }
    if (result.hasOwnProperty('Contents')) {
      files = result.Contents instanceof Array ? result.Contents : [result.Contents];
    }
  }

  Logger.log(`${files.length} file${files.length === 1 ? '' : 's'}, ${folders.length} folder${folders.length === 1 ? '' : 's'}`);
  return { folders: folders, files: files };
}

async function getS3ObjectTest() {
  initConfig(AWS_CONFIG_TEST);
  var result = await getS3Object('myBucket', 'folder1/file.jpg');
  if (result === false) {
    return false;
  }

  var blob = Utilities.newBlob(result.Body, result.ContentType);
  // Logger.log(blob.getDataAsString());
  return blob;
}

async function invokeLambdaTest() {
  initConfig(AWS_CONFIG_TEST);
  var payload = {
    key1: 'value1',
    key2: 'value2',
    key3: 'value3',
  };
  var result = await invokeLambda('helloWorld', payload);
  if (result === false) {
    return false;
  }

  Logger.log(result);
  return result;
}

async function listEC2InstancesTest() {
  initConfig(AWS_CONFIG_TEST);
  var result = await listEC2Instances('us-west-2');
  var instances = [];

  if (result !== false) {
    if (result.hasOwnProperty('reservationSet') && result.reservationSet.hasOwnProperty('instancesSet')) {
      instances = result.reservationSet.instancesSet;
    }
  }

  Logger.log(`${instances.length} instance${instances.length === 1 ? '' : 's'}`);
  return instances;
}

async function listSecurityGroupsTest() {
  initConfig(AWS_CONFIG_TEST);
  var result = await listSecurityGroups('us-west-2');
  var groups = [];

  if (result !== false) {
    if (result.hasOwnProperty('securityGroupInfo')) {
      groups = result.securityGroupInfo;
    }
  }

  Logger.log(`${groups.length} security group${groups.length === 1 ? '' : 's'}`);
  return groups;
}
