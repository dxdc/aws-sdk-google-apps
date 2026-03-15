# Migration Guide

## Migrating from v2.x to v3.0

### Breaking changes

#### 1. Error handling: errors now throw instead of returning `false`

All service wrappers now let AWS SDK errors propagate. Replace `=== false` checks with `try/catch`:

```js
// Old (v2):
const result = await getS3Object('bucket', 'key');
if (result === false) {
  return false;
}

// New (v3):
try {
  const result = await getS3Object('bucket', 'key');
  // use result
} catch (err) {
  Logger.log(err.code); // e.g., 'NoSuchKey', 'AccessDenied'
  Logger.log(err.statusCode); // e.g., 404, 403
  Logger.log(err.retryable); // true for throttling/server errors
}
```

#### 2. Config: property names changed to match AWS SDK

```js
// Old (v2):
initConfig({ accessKey: '...', secretKey: '...', region: 'us-east-1' });

// New (v3):
initConfig({ accessKeyId: '...', secretAccessKey: '...', region: 'us-east-1' });
```

#### 3. S3: `listS3Objects` now uses `listObjectsV2` with options

```js
// Old (v2):
const result = await listS3Objects('bucket', 'prefix/');

// New (v3):
const result = await listS3Objects('bucket', { prefix: 'prefix/' });

// New: pagination support
if (result.IsTruncated) {
  const next = await listS3Objects('bucket', {
    prefix: 'prefix/',
    continuationToken: result.NextContinuationToken,
  });
}
```

#### 4. EC2: functions now take an options object

```js
// Old (v2):
const result = await listEC2Instances('us-west-2');

// New (v3):
const result = await listEC2Instances({ region: 'us-west-2' });

// New: filter support
const result = await listEC2Instances({
  filters: [{ Name: 'instance-state-name', Values: ['running'] }],
});
```

### New features in v3.0

#### DynamoDB query enhancements

Reserved word handling, filtering, and pagination are now supported:

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

#### XHR client improvements

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
npm run sdk --sdk=ses,s3,lambda,ec2,dynamodb,sns,sqs
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

---

## AWS SDK v3: Feasibility Assessment

### Current status

This project uses AWS SDK for JavaScript v2. AWS announced that v2 entered maintenance mode on September 8, 2024 and will reach end of support on September 8, 2025. After that date, v2 will continue to function but will not receive new features, services, or non-critical bug fixes.

### Why v3 is not currently feasible for Google Apps Script

AWS SDK v3 was a complete ground-up rewrite with a fundamentally different architecture that is incompatible with Google Apps Script's runtime. Here are the specific blockers:

#### 1. Modular package architecture

v3 split the monolithic SDK into 300+ individual packages (`@aws-sdk/client-s3`, `@aws-sdk/client-ses`, etc.), each with its own dependency tree. The current approach of patching a single bundled SDK file cannot work with this structure without a complex bundler setup.

#### 2. ES Modules and modern JavaScript

v3 is built around ES Modules (`import`/`export`), while Google Apps Script uses a flat global scope where all `.gs` files share the same namespace. There is no `import` statement in GAS.

#### 3. Streams and async I/O

v3 heavily uses Node.js Streams API and async iterators for request/response handling. Google Apps Script's `UrlFetchApp` is synchronous — there is no event loop, no streaming, and no way to implement the async patterns v3 depends on.

#### 4. Middleware stack

v3 uses a pluggable middleware architecture (similar to Express.js) where each request passes through a chain of async middleware functions. Replacing the HTTP handler in v3 requires implementing a complete middleware-compatible transport layer, which is fundamentally different from the v2 approach of patching `XHRClient`.

#### 5. Bundle size

Even with tree-shaking, v3 bundles for individual services are larger than the equivalent v2 bundle because of the middleware infrastructure, credential providers, retry logic, and other framework code that comes with every client.

### Options going forward

#### Option A: Continue with v2 (recommended)

v2 will continue to function indefinitely after end-of-support. The AWS API endpoints it calls are not changing. The risk is:

- No patches for newly discovered security vulnerabilities in v2
- No support for AWS services launched after the EOL date
- No bug fixes for edge cases

For most Google Apps Script use cases (sending emails, reading/writing S3, invoking Lambda), this risk is acceptable.

#### Option B: Fork and maintain v2

If security patches are needed after September 2025, the v2 SDK can be forked and maintained independently. This project already patches the SDK, so the infrastructure for this exists.

#### Option C: Build lightweight service-specific clients

Instead of depending on any version of the full AWS SDK, build minimal clients that:

1. Implement AWS Signature Version 4 signing directly
2. Use `UrlFetchApp.fetch()` for HTTP requests
3. Parse responses with `XmlService` or `JSON.parse()`

This eliminates the SDK dependency entirely but requires significant development effort for each service. Several community projects (e.g., `apps-script-aws-request`) take this approach for individual services.

#### Option D: Wait for community v3 adapter

As of March 2026, no community project has successfully adapted AWS SDK v3 for Google Apps Script. If one emerges, this project will evaluate adopting it.

### Recommendation

**Stay with v2 for now.** The AWS APIs themselves are stable and backward-compatible. v2's core HTTP signing and request logic will continue to work correctly. Monitor the situation and consider Option B or C if specific security concerns arise.
