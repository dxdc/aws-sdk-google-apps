# aws-sdk-google-apps

[![mit license](https://badgen.net/badge/license/MIT/red)](https://github.com/dxdc/aws-sdk-google-apps/blob/master/LICENSE)
[![CI](https://github.com/dxdc/aws-sdk-google-apps/actions/workflows/ci.yml/badge.svg)](https://github.com/dxdc/aws-sdk-google-apps/actions/workflows/ci.yml)
[![Donate](https://badgen.net/badge/Donate/PayPal/91BE09)](https://paypal.me/ddcaspi)

Native support for the entire AWS SDK for JavaScript in Google Apps Script.

Working examples for S3, SES, Lambda, EC2, DynamoDB, SNS, and SQS. This project can easily accommodate _all_ other AWS services, e.g.,

```
npm run sdk --sdk=ses,s3,ec2,lambda,dynamodb,sns,sqs && npm run build
```

## Supported services

| Service      | Functions                                                                       |
| ------------ | ------------------------------------------------------------------------------- |
| **S3**       | `listS3Objects`, `getS3Object`, `putS3Object`, `deleteS3Object`, `copyS3Object` |
| **SES**      | `sendEmail` (supports options-object or positional args)                        |
| **Lambda**   | `invokeLambda` (sync, async, dry-run)                                           |
| **EC2**      | `listEC2Instances`, `listSecurityGroups`                                        |
| **DynamoDB** | `getDynamoDBItem`, `putDynamoDBItem`, `deleteDynamoDBItem`, `queryDynamoDB`     |
| **SNS**      | `publishSNS`                                                                    |
| **SQS**      | `sendSQSMessage`, `receiveSQSMessages`, `deleteSQSMessage`                      |

Any AWS service can also be used directly via the `AWS` object (see [Advanced usage](#advanced-usage)).

## Library deployment

1. Add the existing Google Apps Script project [as a Library](https://developers.google.com/apps-script/guides/libraries#add_a_library_to_your_script_project)

- Script ID `1J6iN9mJE-NK6LGTlZcngsflJEx59tE3ZOW4-2cdHbgw0So2MmEcRZxKG`
- Choose an identifier, e.g., `AWSLIB`
- Versions of the Google Apps Script project map to tags on this Git repository

2. Initialize your AWS config settings and use any of the service wrapper functions. See [Examples.js](src/Examples.js) for full examples.

```js
const AWS_CONFIG = {
  accessKeyId: 'YOUR_ACCESS_KEY', // use your own AWS key
  secretAccessKey: 'YOUR_SECRET_KEY', // use your own AWS key
  region: 'us-east-1',
};

// Example: retrieve an S3 object
async function getS3ObjectExample() {
  AWSLIB.initConfig(AWS_CONFIG);
  try {
    const result = await AWSLIB.getS3Object('myBucket', 'folder1/file.jpg');
    return Utilities.newBlob(result.Body, result.ContentType);
  } catch (err) {
    Logger.log(err, err.stack);
    return null;
  }
}

// Example: send an email via SES
async function sendEmailExample() {
  AWSLIB.initConfig(AWS_CONFIG);
  const result = await AWSLIB.sendEmail({
    to: 'recipient@example.com',
    from: 'sender@example.com',
    subject: 'Hello from GAS',
    html: '<h1>Hello!</h1><p>Sent via AWS SES.</p>',
  });
  return result;
}

// Example: DynamoDB query with reserved word handling
async function queryExample() {
  AWSLIB.initConfig(AWS_CONFIG);
  const result = await AWSLIB.queryDynamoDB(
    'Orders',
    'userId = :uid',
    { ':uid': { S: 'user-123' }, ':active': { S: 'active' } },
    {
      limit: 10,
      expressionNames: { '#s': 'status' },
      filterExpression: '#s = :active',
    },
  );
  return result;
}
```

### Advanced usage

Direct access to the AWS SDK is available via the `AWS` property on your chosen library identifier:

```js
// Create a new service object directly
const s3 = new AWSLIB.AWS.S3({
  apiVersion: '2006-03-01',
  params: { Bucket: albumBucketName },
});
```

## Advanced deployment

1. Customize the AWS SDK if additional services are needed

2. Copy & paste all the files from `dist/` into your project.

- `Examples.js` and `Config.js` are placeholders, which should be adapted with your code.

### Customized AWS SDK

The AWS SDK can be customized for specific API versions and/or services.

This project defaults to the following services: `ses,s3,lambda,ec2,dynamodb,sns,sqs`.

To add a service, rebuild the SDK with it included:

```shell
$ cd aws-sdk-js
$ npm install
$ cd ..
$ npm install
$ npm run sdk --sdk=ses,s3,lambda,ec2,dynamodb,sns,sqs,athena && npm run build
```

Commonly requested additions include **Athena**, **CloudFormation**, **CloudWatch**, and **Secrets Manager**. Any service supported by the [AWS SDK v2 API list](https://github.com/aws/aws-sdk-js/tree/master/apis) can be included. Use `--sdk=all` to include every service (larger bundle size).

Once rebuilt, access the service via the `AWS` object:

```js
// Example: Athena query
AWSLIB.initConfig(AWS_CONFIG);
const athena = new AWSLIB.AWS.Athena();
const result = await athena
  .startQueryExecution({
    QueryString: 'SELECT * FROM my_table LIMIT 10',
    ResultConfiguration: { OutputLocation: 's3://my-bucket/results/' },
  })
  .promise();
```

### Create your own library

1. Create a new project in Google Scripts.

2. Copy & paste all the files from `dist/` into your project file and save it.

3. Go `File → Manage versions` and click `Save new version`.

4. You can `Share` and make it public.

5. Copy your library Script ID from `File → Project properties → Script ID`

6. Reference this Script ID as a library in other projects.

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```shell
$ npm install
```

### Build

```shell
$ npm run build     # Build dist/ from src/ and src-sdk/
$ npm test          # Run unit tests
$ npm run lint      # Run ESLint
$ npm run format    # Format code with Prettier
```

### CI/CD

This project includes a GitHub Actions CI pipeline that runs on every push and pull request:

- **Lint & Format** — ESLint and Prettier checks
- **Build** — Full build with output validation and artifact upload
- **Unit Tests** — Jest test suite

Dependabot is configured for automated weekly dependency updates.

## Security notes

### Crypto polyfill

The `Crypto.js` polyfill uses `Math.random()` which is **NOT cryptographically secure**. The AWS SDK uses `crypto.getRandomValues()` for generating unique request IDs (not for encryption or key generation), so this is acceptable for that use case. Do not use this polyfill for security-sensitive operations.

### Credentials

Never commit real AWS credentials to version control. Use Google Apps Script's [Properties Service](https://developers.google.com/apps-script/reference/properties/properties-service) to store sensitive values:

```js
const props = PropertiesService.getScriptProperties();
const config = {
  accessKeyId: props.getProperty('AWS_ACCESS_KEY_ID'),
  secretAccessKey: props.getProperty('AWS_SECRET_ACCESS_KEY'),
  region: 'us-east-1',
};
initConfig(config);
```

## Background

Several other projects exist for interfacing between the AWS API and Google Apps Script. However, these projects have very limited support for the full suite of AWS services offered. This is the first project which invokes the AWS SDK directly.

### SDK Core modifications

Several key changes to the AWS SDK core were required to make it compatible with the Google Apps Script framework.

Google Apps Script does not have support for `window`, `XMLHttpRequest`, and `DOMParser` — instead, it requires the use of `UrlFetchApp` and `XmlService`. Additional polyfills are provided for `setTimeout`/`clearTimeout`, `setInterval`/`clearInterval`, `console`, `Blob`, `Buffer`, `TextEncoder`/`TextDecoder`, `atob`/`btoa`, `URL`, `navigator`, `process`/`process.env`, and `crypto.getRandomValues`. These patch files can be found in `src-sdk` and `src/Polyfill.js`.

Note, the final patched build remains compatible in the browser, e.g.,

```diff
-AWS.HttpClient.prototype = AWS.XHRClient.prototype;
+AWS.HttpClient.prototype = typeof XMLHttpRequest === 'undefined' && typeof UrlFetchApp !== 'undefined' ? AWS.XHRGoogleClient.prototype : AWS.XHRClient.prototype;
```

## AWS SDK v3

This project uses AWS SDK v2, which entered maintenance mode in September 2024. See [MIGRATION.md](MIGRATION.md) for a detailed analysis of why v3 is not currently feasible for Google Apps Script and what the options are going forward.

## How to contribute

Have an idea? Found a bug? Contributions and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## Credits

Acknowledgements to @lsegal for [initial research](https://github.com/aws/aws-sdk-js/issues/620), @sk16 for [modifying AWS.XHRClient for use with fetch](https://github.com/aws/aws-sdk-js/issues/1902), as well as the authors of existing repositories (e.g., [aws-apps-scripts](https://github.com/smithy545/aws-apps-scripts), [apps-script-aws-request](https://github.com/wmakeev/apps-script-aws-request)), for insight in how to solve this problem.

## Support this project

I try to reply to everyone needing help using these projects. Obviously, this takes time. However, if you get some profit from this or just want to encourage me to continue creating stuff, there are few ways you can do it:

- Starring and sharing the projects you like :rocket:
- [![PayPal][badge_paypal]][paypal-donations-dxdc] **PayPal**— You can make one-time donations to **dxdc** via PayPal.
- **Venmo**— You can make one-time donations via Venmo.
  ![Venmo QR Code](/images/venmo.png?raw=true 'Venmo QR Code')
- **Bitcoin**— You can send me Bitcoin at this address: `33sT6xw3tZWAdP2oL4ygbH5TVpVMfk9VW7`

[badge_paypal]: https://img.shields.io/badge/Donate-PayPal-blue.svg
[paypal-donations-dxdc]: https://paypal.me/ddcaspi
