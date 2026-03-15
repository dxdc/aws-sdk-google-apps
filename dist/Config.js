/**
 * Default test configuration. Replace with your own AWS credentials.
 * WARNING: Never commit real credentials to version control.
 * @type {{accessKey: string, secretKey: string, region: string}}
 */
const AWS_CONFIG_TEST = {
  accessKey: 'AKIAIOSFODNN7EXAMPLE', // replace with your own AWS key
  secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', // replace with your own AWS key
  region: 'us-east-1',
};

/**
 * Initialize the AWS SDK configuration with credentials and region.
 *
 * @param {Object} config - Configuration object.
 * @param {string} config.region - AWS region (e.g., 'us-east-1').
 * @param {string} config.accessKey - AWS access key ID.
 * @param {string} config.secretKey - AWS secret access key.
 * @param {string} [config.sessionToken] - Optional session token for temporary credentials.
 * @param {Object} [config.rest] - Additional AWS SDK config options (e.g., maxRetries, httpOptions).
 *
 * @example
 * initConfig({
 *   region: 'us-east-1',
 *   accessKey: 'AKIAIOSFODNN7EXAMPLE',
 *   secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
 * });
 */
function initConfig({ region, accessKey, secretKey, sessionToken, ...rest }) {
  AWS.config = new AWS.Config();

  const credentials = {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
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
