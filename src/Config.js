/**
 * Default test configuration. Replace with your own AWS credentials.
 * WARNING: Never commit real credentials to version control.
 * @type {{accessKeyId: string, secretAccessKey: string, region: string}}
 */
const AWS_CONFIG_TEST = {
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE', // replace with your own AWS key
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', // replace with your own AWS key
  region: 'us-east-1',
};

/**
 * Initialize the AWS SDK configuration with credentials and region.
 *
 * Accepts both the standard AWS SDK property names (`accessKeyId`, `secretAccessKey`)
 * and the legacy names (`accessKey`, `secretKey`) for backward compatibility.
 *
 * @param {Object} config - Configuration object.
 * @param {string} config.region - AWS region (e.g., 'us-east-1').
 * @param {string} [config.accessKeyId] - AWS access key ID (preferred).
 * @param {string} [config.secretAccessKey] - AWS secret access key (preferred).
 * @param {string} [config.accessKey] - Legacy alias for accessKeyId.
 * @param {string} [config.secretKey] - Legacy alias for secretAccessKey.
 * @param {string} [config.sessionToken] - Optional session token for temporary credentials.
 * @param {Object} [config.rest] - Additional AWS SDK config options (e.g., maxRetries, httpOptions).
 *
 * @example
 * // Preferred style:
 * initConfig({
 *   region: 'us-east-1',
 *   accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
 *   secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
 * });
 *
 * @example
 * // Legacy style (still supported):
 * initConfig({
 *   region: 'us-east-1',
 *   accessKey: 'AKIAIOSFODNN7EXAMPLE',
 *   secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
 * });
 */
function initConfig({ region, accessKeyId, secretAccessKey, accessKey, secretKey, sessionToken, ...rest }) {
  AWS.config = new AWS.Config();

  const credentials = {
    accessKeyId: accessKeyId || accessKey,
    secretAccessKey: secretAccessKey || secretKey,
  };

  if (sessionToken) {
    credentials.sessionToken = sessionToken;
  }

  AWS.config.update({
    region,
    sslEnabled: true,
    credentials,
    ...rest,
  });
}
