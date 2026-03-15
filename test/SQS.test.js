const fs = require('fs');
const vm = require('vm');

function loadSQS() {
  const code = fs.readFileSync(`${__dirname}/../src/SQS.js`, 'utf8');

  const mockSendMessage = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({ MessageId: 'sqs-msg-123' }),
  });
  const mockReceiveMessage = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({ Messages: [{ Body: 'test', ReceiptHandle: 'handle-1' }] }),
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
    test('sends string message', async () => {
      const result = await sandbox.sendSQSMessage('https://sqs.example.com/queue', 'Hello');
      expect(result).toEqual({ MessageId: 'sqs-msg-123' });
      expect(sandbox._mocks.mockSendMessage).toHaveBeenCalledWith({
        QueueUrl: 'https://sqs.example.com/queue',
        MessageBody: 'Hello',
      });
    });

    test('sends object message (auto-serialized)', async () => {
      await sandbox.sendSQSMessage('https://sqs.example.com/queue', { key: 'val' });
      expect(sandbox._mocks.mockSendMessage).toHaveBeenCalledWith({
        QueueUrl: 'https://sqs.example.com/queue',
        MessageBody: '{"key":"val"}',
      });
    });

    test('passes FIFO options', async () => {
      await sandbox.sendSQSMessage('https://sqs.example.com/queue.fifo', 'msg', {
        messageGroupId: 'group-1',
        messageDeduplicationId: 'dedup-1',
        delaySeconds: 10,
      });
      expect(sandbox._mocks.mockSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          MessageGroupId: 'group-1',
          MessageDeduplicationId: 'dedup-1',
          DelaySeconds: 10,
        }),
      );
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockSendMessage.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('SQS error')),
      });
      const result = await sandbox.sendSQSMessage('url', 'msg');
      expect(result).toBe(false);
    });
  });

  describe('receiveSQSMessages', () => {
    test('receives messages with defaults', async () => {
      const result = await sandbox.receiveSQSMessages('https://sqs.example.com/queue');
      expect(result.Messages).toHaveLength(1);
      expect(sandbox._mocks.mockReceiveMessage).toHaveBeenCalledWith({
        QueueUrl: 'https://sqs.example.com/queue',
        MaxNumberOfMessages: 1,
      });
    });

    test('passes options (maxMessages, waitTimeSeconds, visibilityTimeout)', async () => {
      await sandbox.receiveSQSMessages('https://sqs.example.com/queue', {
        maxMessages: 5,
        waitTimeSeconds: 10,
        visibilityTimeout: 30,
      });
      expect(sandbox._mocks.mockReceiveMessage).toHaveBeenCalledWith({
        QueueUrl: 'https://sqs.example.com/queue',
        MaxNumberOfMessages: 5,
        WaitTimeSeconds: 10,
        VisibilityTimeout: 30,
      });
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockReceiveMessage.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('SQS error')),
      });
      const result = await sandbox.receiveSQSMessages('url');
      expect(result).toBe(false);
    });
  });

  describe('deleteSQSMessage', () => {
    test('deletes message by receipt handle', async () => {
      const result = await sandbox.deleteSQSMessage('https://sqs.example.com/queue', 'handle-1');
      expect(result).toEqual({});
      expect(sandbox._mocks.mockDeleteMessage).toHaveBeenCalledWith({
        QueueUrl: 'https://sqs.example.com/queue',
        ReceiptHandle: 'handle-1',
      });
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockDeleteMessage.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('SQS error')),
      });
      const result = await sandbox.deleteSQSMessage('url', 'handle');
      expect(result).toBe(false);
    });
  });
});
