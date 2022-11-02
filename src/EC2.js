function listEC2Instances(region = null) {
  var ec2Promise = new AWS.EC2({
    apiVersion: '2016-11-15',
    region: region || AWS.config.region,
  })
    .describeInstances()
    .promise();

  return ec2Promise
    .then((data) => {
      return data;
    })
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}

function listSecurityGroups(region = null) {
  var ec2Promise = new AWS.EC2({
    apiVersion: '2016-11-15',
    region: region || AWS.config.region,
  })
    .describeSecurityGroups()
    .promise();

  return ec2Promise
    .then((data) => {
      return data;
    })
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}
