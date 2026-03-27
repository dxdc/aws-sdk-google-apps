const fs = require('fs');
const vm = require('vm');

function loadLambda() {
  const code = fs.readFileSync(`${__dirname}/../src/Lambda.js`, 'utf8');

  const mockInvoke = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({ StatusCode: 200, Payload: '{"result":"ok"}' }),
  });

  const sandbox = {
    ...global,
    AWS: {
      Lambda: jest.fn().mockReturnValue({ invoke: mockInvoke }),
    },
    Logger: { log: jest.fn() },
    _mockInvoke: mockInvoke,
  };

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox;
}

describe('Lambda', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = loadLambda();
  });

  test('invokes a function with object payload', async () => {
    const result = await sandbox.invokeLambda('myFunc', { key: 'value' });
    expect(result).toEqual({ StatusCode: 200, Payload: '{"result":"ok"}' });
    expect(sandbox._mockInvoke).toHaveBeenCalledWith({
      FunctionName: 'myFunc',
      Payload: '{"key":"value"}',
    });
  });

  test('invokes a function with string payload', async () => {
    await sandbox.invokeLambda('myFunc', '{"raw":"json"}');
    expect(sandbox._mockInvoke).toHaveBeenCalledWith({
      FunctionName: 'myFunc',
      Payload: '{"raw":"json"}',
    });
  });

  test('invokes without payload', async () => {
    await sandbox.invokeLambda('myFunc');
    expect(sandbox._mockInvoke).toHaveBeenCalledWith({
      FunctionName: 'myFunc',
      Payload: undefined,
    });
  });

  test('passes invocationType option', async () => {
    await sandbox.invokeLambda('myFunc', {}, { invocationType: 'Event' });
    expect(sandbox._mockInvoke).toHaveBeenCalledWith(expect.objectContaining({ InvocationType: 'Event' }));
  });

  test('passes qualifier option', async () => {
    await sandbox.invokeLambda('myFunc', {}, { qualifier: 'v2' });
    expect(sandbox._mockInvoke).toHaveBeenCalledWith(expect.objectContaining({ Qualifier: 'v2' }));
  });

  test('returns false on error', async () => {
    sandbox._mockInvoke.mockReturnValueOnce({
      promise: () => Promise.reject(new Error('ResourceNotFoundException')),
    });
    const result = await sandbox.invokeLambda('missing');
    expect(result).toBe(false);
  });
});
