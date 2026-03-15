const fs = require('fs');
const vm = require('vm');

function loadSNS() {
  const code = fs.readFileSync(`${__dirname}/../src/SNS.js`, 'utf8');

  const mockPublish = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({ MessageId: 'msg-123' }),
  });

  const sandbox = {
    ...global,
    AWS: {
      SNS: jest.fn().mockReturnValue({ publish: mockPublish }),
    },
    Logger: { log: jest.fn() },
    _mockPublish: mockPublish,
  };

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox;
}

describe('SNS', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = loadSNS();
  });

  test('publishes a string message', async () => {
    const result = await sandbox.publishSNS('arn:aws:sns:us-east-1:123:Topic', 'Hello');
    expect(result).toEqual({ MessageId: 'msg-123' });
    expect(sandbox._mockPublish).toHaveBeenCalledWith({
      TopicArn: 'arn:aws:sns:us-east-1:123:Topic',
      Message: 'Hello',
    });
  });

  test('JSON-serializes object messages', async () => {
    await sandbox.publishSNS('arn:topic', { key: 'value' });
    expect(sandbox._mockPublish).toHaveBeenCalledWith(expect.objectContaining({ Message: '{"key":"value"}' }));
  });

  test('passes subject option', async () => {
    await sandbox.publishSNS('arn:topic', 'msg', { subject: 'Test' });
    expect(sandbox._mockPublish).toHaveBeenCalledWith(expect.objectContaining({ Subject: 'Test' }));
  });

  test('passes messageAttributes option', async () => {
    const attrs = { type: { DataType: 'String', StringValue: 'alert' } };
    await sandbox.publishSNS('arn:topic', 'msg', { messageAttributes: attrs });
    expect(sandbox._mockPublish).toHaveBeenCalledWith(expect.objectContaining({ MessageAttributes: attrs }));
  });

  test('throws on error', async () => {
    sandbox._mockPublish.mockReturnValueOnce({
      promise: () => Promise.reject(new Error('NotFoundException')),
    });
    await expect(sandbox.publishSNS('arn:bad', 'msg')).rejects.toThrow('NotFoundException');
  });
});
