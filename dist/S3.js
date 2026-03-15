/**
 * List objects in an S3 bucket under a given prefix.
 *
 * @param {string} bucketName - The name of the S3 bucket.
 * @param {string} [prefix] - Optional prefix to filter results (e.g., 'folder1/').
 * @returns {Promise<Object|false>} The S3 listObjects response, or false on error.
 *
 * @example
 * const result = await listS3Objects('my-bucket', 'images/');
 * if (result !== false) {
 *   Logger.log(result.Contents); // Array of object metadata
 * }
 */
function listS3Objects(bucketName, prefix) {
  const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: { Bucket: bucketName },
  });

  return s3
    .listObjects({ Delimiter: '/', Prefix: prefix || '' })
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
 * @returns {Promise<Object|false>} The S3 getObject response (includes Body, ContentType), or false on error.
 *
 * @example
 * const result = await getS3Object('my-bucket', 'folder/file.jpg');
 * if (result !== false) {
 *   const blob = Utilities.newBlob(result.Body, result.ContentType);
 * }
 */
function getS3Object(bucketName, key) {
  const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: { Bucket: bucketName },
  });

  return s3
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
 * @returns {Promise<Object|false>} The S3 putObject response (includes ETag), or false on error.
 *
 * @example
 * const result = await putS3Object('my-bucket', 'folder/file.txt', 'Hello World');
 * // With options:
 * const result = await putS3Object('my-bucket', 'images/photo.jpg', imageBlob, {
 *   contentType: 'image/jpeg',
 *   metadata: { 'uploaded-by': 'gas-script' },
 * });
 */
function putS3Object(bucketName, key, data, options) {
  const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: { Bucket: bucketName },
  });

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

  return s3
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
 * @returns {Promise<Object|false>} The S3 deleteObject response, or false on error.
 *
 * @example
 * const result = await deleteS3Object('my-bucket', 'folder/old-file.txt');
 */
function deleteS3Object(bucketName, key) {
  const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: { Bucket: bucketName },
  });

  return s3
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
 * @returns {Promise<Object|false>} The S3 copyObject response, or false on error.
 *
 * @example
 * const result = await copyS3Object('source-bucket', 'file.txt', 'dest-bucket', 'backup/file.txt');
 */
function copyS3Object(sourceBucket, sourceKey, destBucket, destKey) {
  const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
  });

  return s3
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
