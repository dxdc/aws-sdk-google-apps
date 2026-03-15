function listS3Objects(bucketName, prefix) {
  const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: { Bucket: bucketName },
  });

  return s3
    .listObjects({ Delimiter: '/', Prefix: prefix })
    .promise()
    .then((data) => data)
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}

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
    .then((data) => data)
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}

function putS3Object(bucketName, key, data) {
  const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: { Bucket: bucketName },
  });

  return s3
    .putObject({
      Bucket: bucketName,
      Key: key,
      Body: data,
    })
    .promise()
    .then((data) => data)
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}
