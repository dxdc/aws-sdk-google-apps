/**
 * List objects in an S3 bucket using the v2 list API (listObjectsV2).
 *
 * @param {string} bucketName - The name of the S3 bucket.
 * @param {Object} [options] - Optional listing parameters.
 * @param {string} [options.prefix=''] - Filter results to keys starting with this prefix.
 * @param {string} [options.delimiter='/'] - Grouping delimiter (use '/' for folder-like behavior).
 * @param {number} [options.maxKeys] - Maximum number of keys to return (default 1000).
 * @param {string} [options.continuationToken] - Token from a previous response for pagination.
 * @param {string} [options.startAfter] - Start listing after this key.
 * @returns {Promise<Object>} The S3 listObjectsV2 response (includes Contents, KeyCount, IsTruncated, NextContinuationToken).
 * @throws {Error} AWS SDK errors (e.g., NoSuchBucket, AccessDenied).
 *
 * @example
 * const result = await listS3Objects('my-bucket', { prefix: 'images/' });
 * Logger.log(result.Contents);
 * if (result.IsTruncated) {
 *   const next = await listS3Objects('my-bucket', {
 *     prefix: 'images/',
 *     continuationToken: result.NextContinuationToken,
 *   });
 * }
 */
function listS3Objects(bucketName, options) {
  const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: { Bucket: bucketName },
  });

  const params = {
    Delimiter: options && options.delimiter !== undefined ? options.delimiter : '/',
    Prefix: (options && options.prefix) || '',
  };

  if (options) {
    if (options.maxKeys) {
      params.MaxKeys = options.maxKeys;
    }
    if (options.continuationToken) {
      params.ContinuationToken = options.continuationToken;
    }
    if (options.startAfter) {
      params.StartAfter = options.startAfter;
    }
  }

  return s3.listObjectsV2(params).promise();
}

/**
 * Get an object from an S3 bucket.
 *
 * @param {string} bucketName - The name of the S3 bucket.
 * @param {string} key - The object key (path) within the bucket.
 * @returns {Promise<Object>} The S3 getObject response (includes Body, ContentType).
 * @throws {Error} AWS SDK errors (e.g., NoSuchKey, AccessDenied).
 *
 * @example
 * const result = await getS3Object('my-bucket', 'folder/file.jpg');
 * const blob = Utilities.newBlob(result.Body, result.ContentType);
 */
function getS3Object(bucketName, key) {
  return new AWS.S3({
    apiVersion: '2006-03-01',
  })
    .getObject({
      Bucket: bucketName,
      Key: key,
    })
    .promise();
}

/**
 * Upload an object to an S3 bucket.
 *
 * @param {string} bucketName - The name of the S3 bucket.
 * @param {string} key - The object key (path) within the bucket.
 * @param {string|Blob|Array} data - The content to upload.
 * @param {Object} [options] - Optional additional parameters.
 * @param {string} [options.contentType] - The MIME type of the object.
 * @param {string} [options.cacheControl] - Cache-Control header value.
 * @param {Object} [options.metadata] - User-defined metadata key-value pairs.
 * @returns {Promise<Object>} The S3 putObject response (includes ETag).
 * @throws {Error} AWS SDK errors (e.g., AccessDenied).
 *
 * @example
 * const result = await putS3Object('my-bucket', 'file.txt', 'Hello World', {
 *   contentType: 'text/plain',
 * });
 */
function putS3Object(bucketName, key, data, options) {
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: data,
  };

  if (options) {
    if (options.contentType) {
      params.ContentType = options.contentType;
    }
    if (options.cacheControl) {
      params.CacheControl = options.cacheControl;
    }
    if (options.metadata) {
      params.Metadata = options.metadata;
    }
  }

  return new AWS.S3({
    apiVersion: '2006-03-01',
  })
    .putObject(params)
    .promise();
}

/**
 * Delete an object from an S3 bucket.
 *
 * @param {string} bucketName - The name of the S3 bucket.
 * @param {string} key - The object key (path) to delete.
 * @returns {Promise<Object>} The S3 deleteObject response.
 * @throws {Error} AWS SDK errors (e.g., AccessDenied).
 *
 * @example
 * await deleteS3Object('my-bucket', 'folder/old-file.txt');
 */
function deleteS3Object(bucketName, key) {
  return new AWS.S3({
    apiVersion: '2006-03-01',
  })
    .deleteObject({
      Bucket: bucketName,
      Key: key,
    })
    .promise();
}

/**
 * Copy an object within or between S3 buckets.
 *
 * @param {string} sourceBucket - The source bucket name.
 * @param {string} sourceKey - The source object key.
 * @param {string} destBucket - The destination bucket name.
 * @param {string} destKey - The destination object key.
 * @returns {Promise<Object>} The S3 copyObject response.
 * @throws {Error} AWS SDK errors (e.g., NoSuchKey, AccessDenied).
 *
 * @example
 * await copyS3Object('source-bucket', 'file.txt', 'dest-bucket', 'backup/file.txt');
 */
function copyS3Object(sourceBucket, sourceKey, destBucket, destKey) {
  return new AWS.S3({
    apiVersion: '2006-03-01',
  })
    .copyObject({
      Bucket: destBucket,
      Key: destKey,
      CopySource: `${sourceBucket}/${encodeURIComponent(sourceKey).replace(/%2F/g, '/')}`,
    })
    .promise();
}
