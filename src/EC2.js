function listEC2Instances(region = null) {
  const ec2 = new AWS.EC2({
    apiVersion: '2016-11-15',
    region: region || AWS.config.region,
  });

  return ec2
    .describeInstances()
    .promise()
    .then((data) => data)
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}

function listSecurityGroups(region = null) {
  const ec2 = new AWS.EC2({
    apiVersion: '2016-11-15',
    region: region || AWS.config.region,
  });

  return ec2
    .describeSecurityGroups()
    .promise()
    .then((data) => data)
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}
