/**
 * List EC2 instances.
 *
 * Accepts either a region string (legacy) or an options object (modern).
 *
 * @param {string|Object} [regionOrOptions] - A region string (legacy), or an options object.
 * @param {string} [regionOrOptions.region] - AWS region to query. Falls back to the configured default.
 * @param {Array<{Name: string, Values: string[]}>} [regionOrOptions.filters] - EC2 filters (e.g., [{Name: 'instance-state-name', Values: ['running']}]).
 * @param {string[]} [regionOrOptions.instanceIds] - Specific instance IDs to describe.
 * @param {number} [regionOrOptions.maxResults] - Maximum number of results per page.
 * @param {string} [regionOrOptions.nextToken] - Pagination token from a previous response.
 * @returns {Promise<Object|false>} The EC2 describeInstances response, or `false` on error.
 *
 * @example
 * // Modern style with options:
 * const result = await listEC2Instances({
 *   region: 'us-west-2',
 *   filters: [{ Name: 'instance-state-name', Values: ['running'] }],
 * });
 *
 * @example
 * // Legacy style with region string:
 * const result = await listEC2Instances('us-west-2');
 */
function listEC2Instances(regionOrOptions) {
  let options = {};
  if (typeof regionOrOptions === 'string') {
    options.region = regionOrOptions;
  } else if (regionOrOptions) {
    options = regionOrOptions;
  }

  const ec2 = new AWS.EC2({
    apiVersion: '2016-11-15',
    region: options.region || AWS.config.region,
  });

  const params = {};

  if (options.filters) {
    params.Filters = options.filters;
  }
  if (options.instanceIds) {
    params.InstanceIds = options.instanceIds;
  }
  if (options.maxResults) {
    params.MaxResults = options.maxResults;
  }
  if (options.nextToken) {
    params.NextToken = options.nextToken;
  }

  return ec2
    .describeInstances(params)
    .promise()
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}

/**
 * List EC2 security groups.
 *
 * Accepts either a region string (legacy) or an options object (modern).
 *
 * @param {string|Object} [regionOrOptions] - A region string (legacy), or an options object.
 * @param {string} [regionOrOptions.region] - AWS region to query. Falls back to the configured default.
 * @param {Array<{Name: string, Values: string[]}>} [regionOrOptions.filters] - EC2 filters.
 * @param {string[]} [regionOrOptions.groupIds] - Specific security group IDs to describe.
 * @param {string[]} [regionOrOptions.groupNames] - Specific security group names to describe.
 * @param {number} [regionOrOptions.maxResults] - Maximum number of results per page.
 * @param {string} [regionOrOptions.nextToken] - Pagination token from a previous response.
 * @returns {Promise<Object|false>} The EC2 describeSecurityGroups response, or `false` on error.
 *
 * @example
 * // Modern style:
 * const result = await listSecurityGroups({ region: 'us-east-1', groupIds: ['sg-abc'] });
 *
 * @example
 * // Legacy style:
 * const result = await listSecurityGroups('us-east-1');
 */
function listSecurityGroups(regionOrOptions) {
  let options = {};
  if (typeof regionOrOptions === 'string') {
    options.region = regionOrOptions;
  } else if (regionOrOptions) {
    options = regionOrOptions;
  }

  const ec2 = new AWS.EC2({
    apiVersion: '2016-11-15',
    region: options.region || AWS.config.region,
  });

  const params = {};

  if (options.filters) {
    params.Filters = options.filters;
  }
  if (options.groupIds) {
    params.GroupIds = options.groupIds;
  }
  if (options.groupNames) {
    params.GroupNames = options.groupNames;
  }
  if (options.maxResults) {
    params.MaxResults = options.maxResults;
  }
  if (options.nextToken) {
    params.NextToken = options.nextToken;
  }

  return ec2
    .describeSecurityGroups(params)
    .promise()
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}
