# Migration Guide

## Adopting v2.2.0 features

v2.2.0 is fully backward-compatible. No existing code needs to change. You can adopt new features incrementally.

### Config: standard AWS SDK property names

Both old and new property names work. New names are preferred:

```js
// Old style (still works):
initConfig({ accessKey: '...', secretKey: '...', region: 'us-east-1' });

// New style (preferred, matches AWS SDK conventions):
initConfig({ accessKeyId: '...', secretAccessKey: '...', region: 'us-east-1' });
```

### S3: options object with pagination

The old prefix-string style still works. The new options style adds pagination and delimiter control:

```js
// Old style (still works):
const result = await listS3Objects('bucket', 'prefix/');

// New style with pagination:
const result = await listS3Objects('bucket', { prefix: 'prefix/', maxKeys: 100 });
if (result.IsTruncated) {
  const next = await listS3Objects('bucket', {
    prefix: 'prefix/',
    continuationToken: result.NextContinuationToken,
  });
}

// Flat listing (no folder grouping):
const result = await listS3Objects('bucket', { prefix: 'images/', delimiter: '' });
```

Note: `listS3Objects` now uses the `listObjectsV2` API internally (AWS recommended). The response shape includes `KeyCount`, `IsTruncated`, and `NextContinuationToken` instead of the v1 `Marker` field.

### EC2: options object with filters

The old region-string style still works. The new options style adds filters and pagination:

```js
// Old style (still works):
const result = await listEC2Instances('us-west-2');

// New style with filters:
const result = await listEC2Instances({
  region: 'us-west-2',
  filters: [{ Name: 'instance-state-name', Values: ['running'] }],
  maxResults: 50,
});
```

### DynamoDB: query enhancements

Reserved word handling, filtering, projection, and pagination are now supported:

```js
const result = await queryDynamoDB(
  'Orders',
  'userId = :uid',
  {
    ':uid': { S: 'user-123' },
    ':active': { S: 'active' },
  },
  {
    expressionNames: { '#s': 'status' },
    filterExpression: '#s = :active',
    projectionExpression: 'orderId, total',
    limit: 25,
    exclusiveStartKey: lastKey,
  },
);
```

### XHR client improvements

Non-2xx HTTP responses are now passed to the AWS SDK instead of being thrown as generic errors. This enables the SDK's built-in retry logic for throttling (429) and server errors (500, 503).

---

## Migrating from v1.x to v2.0

### Breaking changes

There are no breaking changes to existing function signatures. All existing code will continue to work without modification.

### New features you can adopt

#### SES: Options-object pattern

The old positional-argument style still works, but you can now use a cleaner options object:

```js
// Old style (still works):
await sendEmail('to@example.com', '', '', 'from@example.com', '', 'Subject', '<html>...</html>');

// New style (recommended):
await sendEmail({
  to: 'to@example.com',
  from: 'from@example.com',
  subject: 'Subject',
  html: '<html>...</html>',
});
```

#### S3: New operations and options

```js
// Delete an object
await deleteS3Object('my-bucket', 'path/to/file.txt');

// Copy between buckets
await copyS3Object('source-bucket', 'file.txt', 'dest-bucket', 'backup/file.txt');

// Put with options
await putS3Object('my-bucket', 'file.txt', data, {
  contentType: 'text/plain',
  cacheControl: 'max-age=3600',
  metadata: { 'uploaded-by': 'gas-script' },
});
```

#### Lambda: Invocation options

```js
// Async (fire-and-forget) invocation
await invokeLambda('myFunction', payload, { invocationType: 'Event' });

// Invoke a specific version or alias
await invokeLambda('myFunction', payload, { qualifier: 'v2' });
```

#### New services

DynamoDB, SNS, and SQS wrappers are now included. To use them, rebuild the SDK with these services:

```shell
npm run sdk --sdk=ses,s3,lambda,ec2,dynamodb,sns,sqs,sts
npm run build
```

See [Examples.js](src/Examples.js) for usage.

### Build system

If you use a custom build process, note that Gulp has been replaced with a plain Node.js script:

```shell
# Old:
gulp

# New:
node build.js
# or:
npm run build
```
