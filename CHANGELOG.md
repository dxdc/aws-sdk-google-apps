# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 2.2.0

### Added (all backward-compatible)

- **STS**: New `assumeRole` and `getCallerIdentity` wrappers for cross-account access and credential verification.
- **S3**: `headS3Object` to check if an object exists and read metadata without downloading.
- **S3**: `getPresignedS3Url` to generate temporary signed download/upload URLs.
- **DynamoDB**: `scanDynamoDB` for full table scans with optional filters.
- **DynamoDB**: `updateDynamoDBItem` for partial attribute updates (without replacing the entire item).
- **CI/CD**: Scheduled GitHub Actions workflow to auto-detect and PR aws-sdk-js submodule updates weekly.
- **Config**: `initConfig()` now accepts standard AWS SDK property names (`accessKeyId`, `secretAccessKey`) in addition to the legacy `accessKey`/`secretKey`. Both styles work; new names are preferred.
- **S3**: `listS3Objects` now uses `listObjectsV2` API internally (improved performance and response shape). Accepts both the legacy `(bucket, 'prefix')` and new `(bucket, { prefix, delimiter, maxKeys, continuationToken, startAfter })` calling styles.
- **EC2**: `listEC2Instances` and `listSecurityGroups` now accept both the legacy `(region)` string and new options object `({ region, filters, instanceIds, groupIds, maxResults, nextToken })`.
- DynamoDB `queryDynamoDB`: added `expressionNames` for reserved word handling, `filterExpression`, `projectionExpression`, and `exclusiveStartKey` for pagination.
- Lambda `invokeLambda`: added `options` parameter for `invocationType` and `qualifier`.
- SNS `publishSNS`: added `options` parameter for `subject` and `messageAttributes`.
- SQS `sendSQSMessage`: added `options` parameter for `delaySeconds`, `messageAttributes`, and FIFO queue support (`messageGroupId`, `messageDeduplicationId`).
- SQS `receiveSQSMessages`: added `options` parameter for `maxMessages`, `waitTimeSeconds`, `visibilityTimeout`.
- S3 `putS3Object`: added `options` parameter for `contentType`, `cacheControl`, `metadata`.
- XHR client: non-2xx HTTP responses are now passed to the SDK for proper retry handling (429, 500, 503).

### Changed

- All service wrappers: removed no-op `.then((data) => data)` promise chains
- SES `simpleMakePlainText_`: falls back to regex tag stripping when HTML is not valid XML
- S3 `copyS3Object`: URL-encodes special characters in source key
- S3 `listS3Objects`: defaults prefix to empty string instead of `undefined`
- XHR client `finishRequest`: logs errors instead of silently swallowing them
- Replaced non-standard example credentials with AWS-standard `AKIAIOSFODNN7EXAMPLE`
- Cleaned up `.gitignore` (removed ~60 lines of irrelevant boilerplate)
- Fixed `package.json` `main` field (pointed to nonexistent `index.js`)

## 2.0.1

### Added

- `process`/`process.env` polyfill — prevents `ReferenceError` when the SDK reads environment variables for credential chain detection
- CI build artifact upload — `dist/` is now uploaded as a GitHub Actions artifact on every build

### Changed

- CI pipeline: removed `markdown-spellcheck` (unreliable with formatted markdown)
- Vulnerability count: reduced from 3 to 0 by removing `markdown-spellcheck` and its 87 transitive dependencies
- Improved custom services documentation with Athena/CloudFormation examples

### Removed

- `markdown-spellcheck` dependency and `.spelling` dictionary

## 2.0.0

### Added

- New service wrappers:
  - DynamoDB: `getDynamoDBItem`, `putDynamoDBItem`, `deleteDynamoDBItem`, `queryDynamoDB`
  - SNS: `publishSNS`
  - SQS: `sendSQSMessage`, `receiveSQSMessages`, `deleteSQSMessage`
  - S3: `deleteS3Object`, `copyS3Object`
- SES options-object pattern: `sendEmail()` now accepts a single options object (backward-compatible with positional arguments)
- Lambda options: `invokeLambda()` now supports `invocationType` and `qualifier` options
- S3 `putS3Object` options: supports `contentType`, `cacheControl`, and `metadata`
- GitHub Actions CI pipeline: lint, format check, build verification, unit tests on every push and PR
- Dependabot for automated weekly dependency updates
- Unit test suite: 108 tests across 12 test suites using Jest
- Build integration test: validates SDK patches are correctly applied in dist output
- JSDoc documentation: all public functions have `@param`, `@returns`, `@example`
- CHANGELOG.md, MIGRATION.md, CONTRIBUTING.md

### Fixed

- `setTimeout` polyfill was async and returned a Promise instead of a numeric timer ID, breaking the SDK internal timer mechanism
- Missing `clearTimeout` polyfill (SDK `process.nextTick` depends on this)
- Missing `setInterval` and `clearInterval` polyfills (SDK wraps these internally)
- Missing `console` polyfill (`console.warn`, `console.error`, `console.info` mapped to `Logger.log`)
- Missing `navigator` polyfill (SDK reads `navigator.userAgent` for User-Agent header)
- `no-prototype-builtins` violations in Examples.js and Xml.js

### Changed

- Build system: replaced Gulp with zero-dependency Node.js build script (`build.js`)
- Minification: switched from gulp-minify to terser (2.0 MB to 1.0 MB SDK output)
- Dependencies: updated `@google/clasp` to v3 (fixes path traversal vulnerability)
- Vulnerability count: reduced from 38 to 3 (remaining are upstream clasp transitive deps)
- Code style: `var` replaced with `const`/`let` across all source files
- ESLint config: tuned for Google Apps Script cross-file global scope
- Default SDK services: now includes `ses,s3,lambda,ec2,dynamodb,sns,sqs,sts`

### Removed

- Gulp and all Gulp plugins (gulp, gulp-include, gulp-minify, gulp-rename, gulp-replace)
- `del` package (replaced by Node.js `fs.rmSync`)

## 1.0.0

### Added

- Initial release with S3, SES, Lambda, EC2 service wrappers
- AWS SDK v2 with Google Apps Script patches
- Polyfills for Blob, atob/btoa, TextEncoder/TextDecoder, URL, Buffer, crypto.getRandomValues
- Custom XHR client using UrlFetchApp
- XML parser using XmlService
- Google Apps Script library deployment support
