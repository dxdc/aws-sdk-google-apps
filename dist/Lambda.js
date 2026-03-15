/**
 * Invoke an AWS Lambda function.
 *
 * @param {string} functionName - The name or ARN of the Lambda function.
 * @param {Object|string} [payload] - The input payload. Objects are automatically JSON-serialized.
 * @param {Object} [options] - Optional invocation parameters.
 * @param {string} [options.invocationType='RequestResponse'] - 'RequestResponse' (sync), 'Event' (async), or 'DryRun'.
 * @param {string} [options.qualifier] - Function version or alias to invoke.
 * @returns {Promise<Object>} The Lambda invoke response (includes StatusCode, Payload).
 * @throws {Error} AWS SDK errors (e.g., ResourceNotFoundException, InvalidRequestContentException).
 *
 * @example
 * const result = await invokeLambda('myFunction', { key: 'value' });
 * Logger.log(result.Payload);
 *
 * @example
 * // Async (fire-and-forget) invocation
 * await invokeLambda('myFunction', { key: 'value' }, { invocationType: 'Event' });
 */
function invokeLambda(functionName, payload, options) {
  if (typeof payload !== 'undefined' && typeof payload !== 'string') {
    payload = JSON.stringify(payload);
  }

  const params = {
    FunctionName: functionName,
    Payload: payload,
  };

  if (options) {
    if (options.invocationType) {
      params.InvocationType = options.invocationType;
    }
    if (options.qualifier) {
      params.Qualifier = options.qualifier;
    }
  }

  return new AWS.Lambda({ apiVersion: '2015-03-31' }).invoke(params).promise();
}
