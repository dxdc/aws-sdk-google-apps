/**
 * List objects in an S3 bucket using the v2 list API (listObjectsV2).
 *
 * Accepts either a prefix string (legacy) or an options object (modern).
 *
 * @param {string} bucketName - The name of the S3 bucket.
 * @param {string|Object} [prefixOrOptions] - A prefix string (legacy), or an options object.
 * @param {string} [prefixOrOptions.prefix=''] - Filter results to keys starting with this prefix.
 * @param {string} [prefixOrOptions.delimiter='/'] - Grouping delimiter (use '/' for folder-like behavior).
 * @param {number} [prefixOrOptions.maxKeys] - Maximum number of keys to return (default 1000).
 * @param {string} [prefixOrOptions.continuationToken] - Token from a previous response for pagination.
 * @param {string} [prefixOrOptions.startAfter] - Start listing after this key.
 * @returns {Promise<Object|false>} The S3 listObjectsV2 response (includes Contents, KeyCount, IsTruncated, NextContinuationToken), or `false` on error.
 *
 * @example
 * // Modern style with options:
 * const result = await listS3Objects('my-bucket', { prefix: 'images/', maxKeys: 100 });
 *
 * @example
 * // Legacy style with prefix string:
 * const result = await listS3Objects('my-bucket', 'images/');
 *
 * @example
 * // Pagination:
 * if (result.IsTruncated) {
 *   const next = await listS3Objects('my-bucket', {
 *     prefix: 'images/',
 *     continuationToken: result.NextContinuationToken,
 *   });
 * }
 */
function listS3Objects(bucketName, prefixOrOptions) {
  const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: { Bucket: bucketName },
  });

  let options = {};
  if (typeof prefixOrOptions === 'string') {
    options.prefix = prefixOrOptions;
  } else if (prefixOrOptions) {
    options = prefixOrOptions;
  }

  const params = {
    Delimiter: options.delimiter !== undefined ? options.delimiter : '/',
    Prefix: options.prefix || '',
  };

  if (options.maxKeys) {
    params.MaxKeys = options.maxKeys;
  }
  if (options.continuationToken) {
    params.ContinuationToken = options.continuationToken;
  }
  if (options.startAfter) {
    params.StartAfter = options.startAfter;
  }

  return s3
    .listObjectsV2(params)
    .promise()
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}

/**
 * Get an object from an S3 bucket.
 *
 * @param {string} bucketName - The name of the S3 bucket.
 * @param {string} key - The object key (path) within the bucket.
 * @returns {Promise<Object|false>} The S3 getObject response (includes Body, ContentType), or `false` on error.
 *
 * @example
 * const result = await getS3Object('my-bucket', 'folder/file.jpg');
 * if (result !== false) {
 *   const blob = Utilities.newBlob(result.Body, result.ContentType);
 * }
 */
function getS3Object(bucketName, key) {
  return new AWS.S3({
    apiVersion: '2006-03-01',
  })
    .getObject({
      Bucket: bucketName,
      Key: key,
    })
    .promise()
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
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
 * @returns {Promise<Object|false>} The S3 putObject response (includes ETag), or `false` on error.
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
    .promise()
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}

/**
 * Delete an object from an S3 bucket.
 *
 * @param {string} bucketName - The name of the S3 bucket.
 * @param {string} key - The object key (path) to delete.
 * @returns {Promise<Object|false>} The S3 deleteObject response, or `false` on error.
 *
 * @example
 * const result = await deleteS3Object('my-bucket', 'folder/old-file.txt');
 */
function deleteS3Object(bucketName, key) {
  return new AWS.S3({
    apiVersion: '2006-03-01',
  })
    .deleteObject({
      Bucket: bucketName,
      Key: key,
    })
    .promise()
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}

/**
 * Copy an object within or between S3 buckets.
 *
 * @param {string} sourceBucket - The source bucket name.
 * @param {string} sourceKey - The source object key.
 * @param {string} destBucket - The destination bucket name.
 * @param {string} destKey - The destination object key.
 * @returns {Promise<Object|false>} The S3 copyObject response, or `false` on error.
 *
 * @example
 * const result = await copyS3Object('source-bucket', 'file.txt', 'dest-bucket', 'backup/file.txt');
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
    .promise()
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}
