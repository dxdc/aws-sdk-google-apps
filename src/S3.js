function listS3Objects(bucketName, prefix) {
  var s3Promise = new AWS.S3({
    apiVersion: '2006-03-01',
    params: { Bucket: bucketName },
  })
    .listObjects({ Delimiter: '/', Prefix: prefix })
    .promise();

  return s3Promise
    .then((data) => {
      return data;
    })
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}

function getS3Object(bucketName, key) {
  var s3Promise = new AWS.S3({
    apiVersion: '2006-03-01',
    params: { Bucket: bucketName },
  })
    .getObject({
      Bucket: bucketName,
      Key: key,
    })
    .promise();

  return s3Promise
    .then((data) => {
      return data;
    })
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}

function putS3Object(bucketName, key, data) {
  var s3Promise = new AWS.S3({
    apiVersion: '2006-03-01',
    params: { Bucket: bucketName },
  })
    .putObject({
      Bucket: bucketName,
      Key: key,
      Body: data,
    })
    .promise();

  return s3Promise
    .then((data) => {
      return data;
    })
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}
