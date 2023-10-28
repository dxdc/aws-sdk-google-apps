const AWS_CONFIG_TEST = {
  accessKey: 'AK0ZXZD0KGNG4KG6REBP', // use your own AWS key
  secretKey: 'EXrPgHC41HEW2YownLUnJLgh6bMsrmW1uva1ic24', // use your own AWS key
  region: 'us-east-1',
};

function initConfig(config) {
  AWS.config = new AWS.Config();
  AWS.config.update({
    region: config.region,
    sslEnabled: true,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
      sessionToken: config.sessionToken
    },
  });
}
