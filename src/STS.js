/**
 * Assume an IAM role and return temporary credentials.
 *
 * Commonly used for cross-account access or to obtain scoped-down permissions.
 * Call `initConfig()` with the returned credentials (including sessionToken) to
 * use the assumed role for subsequent API calls.
 *
 * @param {string} roleArn - The ARN of the role to assume (e.g., 'arn:aws:iam::123456789012:role/MyRole').
 * @param {string} sessionName - An identifier for the assumed role session.
 * @param {Object} [options] - Optional parameters.
 * @param {number} [options.durationSeconds=3600] - Session duration in seconds (900-43200).
 * @param {string} [options.externalId] - External ID for third-party role assumption.
 * @param {string} [options.policy] - An inline IAM policy (JSON string) to further restrict the session.
 * @returns {Promise<Object|false>} The STS assumeRole response (includes Credentials with AccessKeyId, SecretAccessKey, SessionToken, Expiration), or `false` on error.
 *
 * @example
 * const result = await assumeRole(
 *   'arn:aws:iam::123456789012:role/CrossAccountRole',
 *   'gas-session',
 * );
 * if (result !== false) {
 *   initConfig({
 *     accessKeyId: result.Credentials.AccessKeyId,
 *     secretAccessKey: result.Credentials.SecretAccessKey,
 *     sessionToken: result.Credentials.SessionToken,
 *     region: 'us-east-1',
 *   });
 *   // Now all subsequent calls use the assumed role
 * }
 */
function assumeRole(roleArn, sessionName, options) {
  const params = {
    RoleArn: roleArn,
    RoleSessionName: sessionName,
  };

  if (options) {
    if (options.durationSeconds) {
      params.DurationSeconds = options.durationSeconds;
    }
    if (options.externalId) {
      params.ExternalId = options.externalId;
    }
    if (options.policy) {
      params.Policy = options.policy;
    }
  }

  return new AWS.STS({ apiVersion: '2011-06-15' })
    .assumeRole(params)
    .promise()
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}

/**
 * Get the identity of the current AWS credentials.
 *
 * Useful for verifying that credentials are valid and seeing which account/user they belong to.
 *
 * @returns {Promise<Object|false>} The STS getCallerIdentity response (includes Account, Arn, UserId), or `false` on error.
 *
 * @example
 * const identity = await getCallerIdentity();
 * if (identity !== false) {
 *   Logger.log(`Account: ${identity.Account}, ARN: ${identity.Arn}`);
 * }
 */
function getCallerIdentity() {
  return new AWS.STS({ apiVersion: '2011-06-15' })
    .getCallerIdentity({})
    .promise()
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}
