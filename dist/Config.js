const AWS_CONFIG_TEST = {
  accessKey: 'AK0ZXZD0KGNG4KG6REBP', // use your own AWS key
  secretKey: 'EXrPgHC41HEW2YownLUnJLgh6bMsrmW1uva1ic24', // use your own AWS key
  region: 'us-east-1',
};

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
