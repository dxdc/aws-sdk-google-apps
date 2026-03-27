# aws-sdk-google-apps

[![mit license](https://badgen.net/badge/license/MIT/red)](https://github.com/dxdc/aws-sdk-google-apps/blob/master/LICENSE)
[![CI](https://github.com/dxdc/aws-sdk-google-apps/actions/workflows/ci.yml/badge.svg)](https://github.com/dxdc/aws-sdk-google-apps/actions/workflows/ci.yml)
[![Donate](https://badgen.net/badge/Donate/PayPal/91BE09)](https://paypal.me/ddcaspi)

Use AWS services directly from Google Apps Script. Wraps the full [AWS SDK for JavaScript v2](https://github.com/aws/aws-sdk-js) with a Google Apps Script-compatible HTTP client, so any AWS service works out of the box.

Includes ready-to-use helper functions for the most common services:

| Service      | Functions                                                                                                            |
| ------------ | -------------------------------------------------------------------------------------------------------------------- |
| **S3**       | `listS3Objects`, `getS3Object`, `putS3Object`, `deleteS3Object`, `copyS3Object`, `headS3Object`, `getPresignedS3Url` |
| **SES**      | `sendEmail`                                                                                                          |
| **Lambda**   | `invokeLambda`                                                                                                       |
| **EC2**      | `listEC2Instances`, `listSecurityGroups`                                                                             |
| **DynamoDB** | `getDynamoDBItem`, `putDynamoDBItem`, `updateDynamoDBItem`, `deleteDynamoDBItem`, `queryDynamoDB`, `scanDynamoDB`    |
| **SNS**      | `publishSNS`                                                                                                         |
| **SQS**      | `sendSQSMessage`, `receiveSQSMessages`, `deleteSQSMessage`                                                           |
| **STS**      | `assumeRole`, `getCallerIdentity`                                                                                    |

Need a service not listed? You can use **any** AWS service directly via the `AWS` object (see [Direct SDK access](#direct-sdk-access)).

## Quick start

### Option 1: Add as a library (easiest)

1. In your Google Apps Script project, go to **Libraries** (the `+` button in the sidebar)
2. Enter the Script ID: `1J6iN9mJE-NK6LGTlZcngsflJEx59tE3ZOW4-2cdHbgw0So2MmEcRZxKG`
3. Pick a version and choose an identifier (e.g., `AWSLIB`)

Then use it:

```js
function myFunction() {
  AWSLIB.initConfig({
    accessKeyId: 'YOUR_ACCESS_KEY',
    secretAccessKey: 'YOUR_SECRET_KEY',
    region: 'us-east-1',
  });

  // Download a file from S3
  const result = AWSLIB.getS3Object('my-bucket', 'path/to/file.txt');
  if (result === false) return; // error already logged
  Logger.log(result.Body);
}
```

### Option 2: Copy into your project

Copy all files from `dist/` into your Google Apps Script project. This gives you direct access to all functions without the `AWSLIB.` prefix.

## Usage examples

### Store credentials safely

Use [Script Properties](https://developers.google.com/apps-script/reference/properties/properties-service) instead of hardcoding credentials:

```js
const props = PropertiesService.getScriptProperties();
initConfig({
  accessKeyId: props.getProperty('AWS_ACCESS_KEY_ID'),
  secretAccessKey: props.getProperty('AWS_SECRET_ACCESS_KEY'),
  region: 'us-east-1',
});
```

### S3: files and objects

```js
// List files in a folder
const listing = await listS3Objects('my-bucket', { prefix: 'images/' });
Logger.log(listing.Contents); // array of objects

// Download a file
const file = await getS3Object('my-bucket', 'report.pdf');
const blob = Utilities.newBlob(file.Body, file.ContentType);

// Upload a file
await putS3Object('my-bucket', 'data.csv', csvContent, {
  contentType: 'text/csv',
});

// Check if a file exists (without downloading it)
const meta = await headS3Object('my-bucket', 'maybe-exists.txt');
if (meta !== false) {
  Logger.log(`File is ${meta.ContentLength} bytes`);
}

// Generate a temporary download link (valid for 1 hour)
const url = getPresignedS3Url('my-bucket', 'report.pdf');
Logger.log(url); // anyone with this URL can download for 1 hour

// Generate a temporary upload link
const uploadUrl = getPresignedS3Url('my-bucket', 'uploads/file.txt', {
  operation: 'putObject',
  expires: 900,
  contentType: 'text/plain',
});
```

### SES: send email

```js
await sendEmail({
  to: 'recipient@example.com',
  from: 'sender@verified-domain.com',
  subject: 'Hello from Google Apps Script',
  html: '<h1>Hello!</h1><p>Sent via AWS SES.</p>',
});
```

### DynamoDB: read and write data

```js
// Write an item
await putDynamoDBItem('Users', {
  userId: { S: 'user-123' },
  name: { S: 'Alice' },
  age: { N: '30' },
});

// Read an item
const item = await getDynamoDBItem('Users', { userId: { S: 'user-123' } });
Logger.log(item.Item.name.S); // "Alice"

// Update specific fields
await updateDynamoDBItem('Users', { userId: { S: 'user-123' } }, 'SET age = :age', { ':age': { N: '31' } });

// Query with filters (handles reserved words like "status")
const results = await queryDynamoDB(
  'Orders',
  'userId = :uid',
  {
    ':uid': { S: 'user-123' },
    ':active': { S: 'active' },
  },
  {
    expressionNames: { '#s': 'status' },
    filterExpression: '#s = :active',
    limit: 10,
  },
);
```

### Lambda: invoke functions

```js
const result = await invokeLambda('myFunction', { key: 'value' });
Logger.log(result.Payload);

// Fire-and-forget (async)
await invokeLambda('myFunction', payload, { invocationType: 'Event' });
```

### STS: cross-account access

```js
// Assume a role in another AWS account
const assumed = await assumeRole('arn:aws:iam::987654321098:role/CrossAccountRole', 'gas-session');

// Re-initialize with temporary credentials
initConfig({
  accessKeyId: assumed.Credentials.AccessKeyId,
  secretAccessKey: assumed.Credentials.SecretAccessKey,
  sessionToken: assumed.Credentials.SessionToken,
  region: 'us-east-1',
});
// All subsequent calls now use the assumed role
```

### Direct SDK access

Any AWS service works, not just the helpers above. Access the SDK directly via the `AWS` object:

```js
// Example: Athena query
initConfig(AWS_CONFIG);
const athena = new AWS.Athena();
const result = await athena
  .startQueryExecution({
    QueryString: 'SELECT * FROM my_table LIMIT 10',
    ResultConfiguration: { OutputLocation: 's3://my-bucket/results/' },
  })
  .promise();
```

When used as a library, prefix with your identifier: `new AWSLIB.AWS.Athena()`.

## Error handling

All helper functions return `false` on error and log the error details via `Logger.log`. Check for `false` to handle errors:

```js
const result = await getS3Object('my-bucket', 'file.txt');
if (result === false) {
  // Error was already logged; handle it here
  return;
}
// Use result normally
```

## Customizing included services

The default build includes: S3, SES, Lambda, EC2, DynamoDB, SNS, SQS, STS.

To add more services (e.g., Athena, CloudWatch), rebuild the SDK:

```shell
cd aws-sdk-js && npm install && cd ..
npm install
npm run sdk --sdk=ses,s3,lambda,ec2,dynamodb,sns,sqs,sts,athena,cloudwatch
npm run build
```

Use `--sdk=all` to include every AWS service (larger bundle). Any service in the [AWS SDK v2 API list](https://github.com/aws/aws-sdk-js/tree/master/apis) can be included.

## Development

### Setup

```shell
npm install
```

### Commands

```shell
npm run build       # Build dist/ from src/ and src-sdk/
npm test            # Run unit tests
npm run lint        # ESLint
npm run format      # Prettier
```

### CI/CD

GitHub Actions runs lint, build, and tests on every push and pull request. A separate scheduled workflow checks for aws-sdk-js updates weekly and opens a PR if a new version is available.

### Create your own library

1. Create a new Google Apps Script project
2. Copy all files from `dist/` into it
3. Go to **Project Settings** and copy the **Script ID**
4. In other projects, add this Script ID as a library

## Security notes

**Credentials**: Never hardcode AWS credentials. Use [Script Properties](https://developers.google.com/apps-script/reference/properties/properties-service) or STS temporary credentials.

**Crypto polyfill**: The `Crypto.js` polyfill uses `Math.random()` which is not cryptographically secure. The AWS SDK only uses this for generating request IDs (not for encryption), so this is acceptable.

## AWS SDK v3

This project uses AWS SDK v2. AWS SDK v3 uses ES Modules, Node.js Streams, and a middleware architecture that are not compatible with Google Apps Script's runtime. See [MIGRATION.md](MIGRATION.md) for details on what has changed between versions of this library.

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
