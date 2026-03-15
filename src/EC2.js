/**
 * List all EC2 instances in a given region.
 *
 * @param {string} [region=null] - AWS region to query. Falls back to the configured default region.
 * @returns {Promise<Object|false>} The EC2 describeInstances response, or false on error.
 *
 * @example
 * const result = await listEC2Instances('us-west-2');
 * if (result !== false && result.reservationSet) {
 *   Logger.log(result.reservationSet.instancesSet);
 * }
 */
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

/**
 * List all security groups in a given region.
 *
 * @param {string} [region=null] - AWS region to query. Falls back to the configured default region.
 * @returns {Promise<Object|false>} The EC2 describeSecurityGroups response, or false on error.
 *
 * @example
 * const result = await listSecurityGroups('us-east-1');
 * if (result !== false && result.securityGroupInfo) {
 *   Logger.log(result.securityGroupInfo);
 * }
 */
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
