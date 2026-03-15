function invokeLambda(functionName, payload) {
  if (typeof payload !== 'undefined' && typeof payload !== 'string') {
    payload = JSON.stringify(payload);
  }

  return new AWS.Lambda({ apiVersion: '2015-03-31' })
    .invoke({
      FunctionName: functionName,
      Payload: payload,
    })
    .promise()
    .then((data) => data)
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}
