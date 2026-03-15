async function sendEmailTest() {
  initConfig(AWS_CONFIG_TEST);
  const result = await sendEmail(
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
  // Logger.log(blob.getDataAsString());
  return blob;
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
