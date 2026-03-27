const fs = require('fs');
const vm = require('vm');

function loadSQS() {
  const code = fs.readFileSync(`${__dirname}/../src/SQS.js`, 'utf8');

  const mockSendMessage = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({ MessageId: 'msg-456' }),
  });
  const mockReceiveMessage = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({ Messages: [{ Body: 'hello', ReceiptHandle: 'rh-1' }] }),
  });
  const mockDeleteMessage = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({}),
  });

  const sandbox = {
    ...global,
    AWS: {
      SQS: jest.fn().mockReturnValue({
        sendMessage: mockSendMessage,
        receiveMessage: mockReceiveMessage,
        deleteMessage: mockDeleteMessage,
      }),
    },
    Logger: { log: jest.fn() },
    _mocks: { mockSendMessage, mockReceiveMessage, mockDeleteMessage },
  };

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox;
}

describe('SQS', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = loadSQS();
  });

  describe('sendSQSMessage', () => {
    test('sends a string message', async () => {
      const result = await sandbox.sendSQSMessage('https://sqs.us-east-1.amazonaws.com/123/Q', 'hello');
      expect(result).toEqual({ MessageId: 'msg-456' });
      expect(sandbox._mocks.mockSendMessage).toHaveBeenCalledWith({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123/Q',
        MessageBody: 'hello',
      });
    });

    test('JSON-serializes object messages', async () => {
      await sandbox.sendSQSMessage('url', { key: 'value' });
      expect(sandbox._mocks.mockSendMessage).toHaveBeenCalledWith(expect.objectContaining({ MessageBody: '{"key":"value"}' }));
    });

    test('passes FIFO queue options', async () => {
      await sandbox.sendSQSMessage('url.fifo', 'msg', {
        delaySeconds: 10,
        messageGroupId: 'group1',
        messageDeduplicationId: 'dedup1',
      });
      expect(sandbox._mocks.mockSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          DelaySeconds: 10,
          MessageGroupId: 'group1',
          MessageDeduplicationId: 'dedup1',
        }),
      );
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockSendMessage.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('InvalidMessageContents')),
      });
      const result = await sandbox.sendSQSMessage('url', 'msg');
      expect(result).toBe(false);
    });
  });

  describe('receiveSQSMessages', () => {
    test('receives messages with defaults', async () => {
      const result = await sandbox.receiveSQSMessages('url');
      expect(result.Messages).toHaveLength(1);
      expect(sandbox._mocks.mockReceiveMessage).toHaveBeenCalledWith({
        QueueUrl: 'url',
        MaxNumberOfMessages: 1,
      });
    });

    test('passes maxMessages and waitTimeSeconds', async () => {
      await sandbox.receiveSQSMessages('url', { maxMessages: 5, waitTimeSeconds: 10 });
      expect(sandbox._mocks.mockReceiveMessage).toHaveBeenCalledWith({
        QueueUrl: 'url',
        MaxNumberOfMessages: 5,
        WaitTimeSeconds: 10,
      });
    });

    test('passes visibilityTimeout', async () => {
      await sandbox.receiveSQSMessages('url', { visibilityTimeout: 30 });
      expect(sandbox._mocks.mockReceiveMessage).toHaveBeenCalledWith(expect.objectContaining({ VisibilityTimeout: 30 }));
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockReceiveMessage.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('QueueDoesNotExist')),
      });
      const result = await sandbox.receiveSQSMessages('url');
      expect(result).toBe(false);
    });
  });

  describe('deleteSQSMessage', () => {
    test('deletes a message by receipt handle', async () => {
      await sandbox.deleteSQSMessage('url', 'receipt-handle-1');
      expect(sandbox._mocks.mockDeleteMessage).toHaveBeenCalledWith({
        QueueUrl: 'url',
        ReceiptHandle: 'receipt-handle-1',
      });
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockDeleteMessage.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('ReceiptHandleIsInvalid')),
      });
      const result = await sandbox.deleteSQSMessage('url', 'bad');
      expect(result).toBe(false);
    });
  });
});
