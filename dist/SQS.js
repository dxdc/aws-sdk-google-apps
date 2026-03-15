/**
 * Send a message to an Amazon SQS queue.
 *
 * @param {string} queueUrl - The URL of the SQS queue.
 * @param {string|Object} messageBody - The message body. Objects are JSON-serialized.
 * @param {Object} [options] - Optional send parameters.
 * @param {number} [options.delaySeconds] - Delay before the message becomes visible (0-900).
 * @param {Object} [options.messageAttributes] - SQS message attributes.
 * @param {string} [options.messageGroupId] - Required for FIFO queues.
 * @param {string} [options.messageDeduplicationId] - Required for FIFO queues without content-based dedup.
 * @returns {Promise<Object>} The SQS sendMessage response (includes MessageId).
 * @throws {Error} AWS SDK errors (e.g., InvalidMessageContents).
 *
 * @example
 * const result = await sendSQSMessage('https://sqs.us-east-1.amazonaws.com/123456789/MyQueue', {
 *   action: 'processOrder',
 *   orderId: '12345',
 * });
 */
function sendSQSMessage(queueUrl, messageBody, options) {
  if (typeof messageBody !== 'string') {
    messageBody = JSON.stringify(messageBody);
  }

  const params = {
    QueueUrl: queueUrl,
    MessageBody: messageBody,
  };

  if (options) {
    if (options.delaySeconds !== undefined) {
      params.DelaySeconds = options.delaySeconds;
    }
    if (options.messageAttributes) {
      params.MessageAttributes = options.messageAttributes;
    }
    if (options.messageGroupId) {
      params.MessageGroupId = options.messageGroupId;
    }
    if (options.messageDeduplicationId) {
      params.MessageDeduplicationId = options.messageDeduplicationId;
    }
  }

  return new AWS.SQS({ apiVersion: '2012-11-05' }).sendMessage(params).promise();
}

/**
 * Receive messages from an Amazon SQS queue.
 *
 * @param {string} queueUrl - The URL of the SQS queue.
 * @param {Object} [options] - Optional receive parameters.
 * @param {number} [options.maxMessages=1] - Maximum number of messages to receive (1-10).
 * @param {number} [options.waitTimeSeconds] - Long-poll wait time in seconds (0-20).
 * @param {number} [options.visibilityTimeout] - Override the queue's default visibility timeout.
 * @returns {Promise<Object>} The SQS receiveMessage response (includes Messages array).
 * @throws {Error} AWS SDK errors.
 *
 * @example
 * const result = await receiveSQSMessages(queueUrl, { maxMessages: 5, waitTimeSeconds: 10 });
 * if (result.Messages) {
 *   result.Messages.forEach((msg) => Logger.log(msg.Body));
 * }
 */
function receiveSQSMessages(queueUrl, options) {
  const params = {
    QueueUrl: queueUrl,
    MaxNumberOfMessages: 1,
  };

  if (options) {
    if (options.maxMessages) {
      params.MaxNumberOfMessages = options.maxMessages;
    }
    if (options.waitTimeSeconds !== undefined) {
      params.WaitTimeSeconds = options.waitTimeSeconds;
    }
    if (options.visibilityTimeout !== undefined) {
      params.VisibilityTimeout = options.visibilityTimeout;
    }
  }

  return new AWS.SQS({ apiVersion: '2012-11-05' }).receiveMessage(params).promise();
}

/**
 * Delete a message from an Amazon SQS queue.
 *
 * @param {string} queueUrl - The URL of the SQS queue.
 * @param {string} receiptHandle - The receipt handle of the message to delete (from receiveMessage).
 * @returns {Promise<Object>} The SQS deleteMessage response.
 * @throws {Error} AWS SDK errors (e.g., ReceiptHandleIsInvalid).
 *
 * @example
 * const msgs = await receiveSQSMessages(queueUrl);
 * if (msgs.Messages) {
 *   await deleteSQSMessage(queueUrl, msgs.Messages[0].ReceiptHandle);
 * }
 */
function deleteSQSMessage(queueUrl, receiptHandle) {
  return new AWS.SQS({ apiVersion: '2012-11-05' })
    .deleteMessage({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    })
    .promise();
}
