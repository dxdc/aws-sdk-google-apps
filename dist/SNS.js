/**
 * Publish a message to an Amazon SNS topic.
 *
 * @param {string} topicArn - The ARN of the SNS topic.
 * @param {string|Object} message - The message to publish. Objects are JSON-serialized.
 * @param {Object} [options] - Optional publish parameters.
 * @param {string} [options.subject] - Subject line (for email-based subscriptions).
 * @param {Object} [options.messageAttributes] - SNS message attributes.
 * @returns {Promise<Object>} The SNS publish response (includes MessageId).
 * @throws {Error} AWS SDK errors (e.g., NotFoundException, InvalidParameterException).
 *
 * @example
 * const result = await publishSNS('arn:aws:sns:us-east-1:123456789:MyTopic', 'Hello!');
 * Logger.log(result.MessageId);
 */
function publishSNS(topicArn, message, options) {
  if (typeof message !== 'string') {
    message = JSON.stringify(message);
  }

  const params = {
    TopicArn: topicArn,
    Message: message,
  };

  if (options) {
    if (options.subject) {
      params.Subject = options.subject;
    }
    if (options.messageAttributes) {
      params.MessageAttributes = options.messageAttributes;
    }
  }

  return new AWS.SNS({ apiVersion: '2010-03-31' })
    .publish(params)
    .promise()
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}
