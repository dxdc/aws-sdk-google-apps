/**
 * List EC2 instances.
 *
 * @param {Object} [options] - Optional query parameters.
 * @param {string} [options.region] - AWS region to query. Falls back to the configured default.
 * @param {Array<{Name: string, Values: string[]}>} [options.filters] - EC2 filters (e.g., [{Name: 'instance-state-name', Values: ['running']}]).
 * @param {string[]} [options.instanceIds] - Specific instance IDs to describe.
 * @param {number} [options.maxResults] - Maximum number of results per page.
 * @param {string} [options.nextToken] - Pagination token from a previous response.
 * @returns {Promise<Object>} The EC2 describeInstances response.
 * @throws {Error} AWS SDK errors (e.g., InvalidParameterValue).
 *
 * @example
 * const result = await listEC2Instances({ region: 'us-west-2' });
 *
 * @example
 * // Filter to running instances only
 * const result = await listEC2Instances({
 *   filters: [{ Name: 'instance-state-name', Values: ['running'] }],
 * });
 */
function listEC2Instances(options) {
  const ec2 = new AWS.EC2({
    apiVersion: '2016-11-15',
    region: (options && options.region) || AWS.config.region,
  });

  const params = {};

  if (options) {
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
  }

  return ec2.describeInstances(params).promise();
}

/**
 * List EC2 security groups.
 *
 * @param {Object} [options] - Optional query parameters.
 * @param {string} [options.region] - AWS region to query. Falls back to the configured default.
 * @param {Array<{Name: string, Values: string[]}>} [options.filters] - EC2 filters.
 * @param {string[]} [options.groupIds] - Specific security group IDs to describe.
 * @param {string[]} [options.groupNames] - Specific security group names to describe.
 * @param {number} [options.maxResults] - Maximum number of results per page.
 * @param {string} [options.nextToken] - Pagination token from a previous response.
 * @returns {Promise<Object>} The EC2 describeSecurityGroups response.
 * @throws {Error} AWS SDK errors (e.g., InvalidParameterValue).
 *
 * @example
 * const result = await listSecurityGroups({ region: 'us-east-1' });
 */
function listSecurityGroups(options) {
  const ec2 = new AWS.EC2({
    apiVersion: '2016-11-15',
    region: (options && options.region) || AWS.config.region,
  });

  const params = {};

  if (options) {
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
  }

  return ec2.describeSecurityGroups(params).promise();
}
