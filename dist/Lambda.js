function invokeLambda(functionName, payload) {
  if (typeof payload !== 'undefined' && typeof payload !== 'string') {
    payload = JSON.stringify(payload);
  }

  var lambdaPromise = new AWS.Lambda({ apiVersion: '2015-03-31' })
    .invoke({
      FunctionName: functionName,
      Payload: payload,
    })
    .promise();

  return lambdaPromise
    .then((data) => {
      return data;
    })
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}
