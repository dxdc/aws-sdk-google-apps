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

  test('invokes a lambda function with object payload', async () => {
    const result = await sandbox.invokeLambda('myFunction', { key: 'value' });
    expect(result).toEqual({ StatusCode: 200, Payload: '{"result":"ok"}' });
    expect(sandbox._mockInvoke).toHaveBeenCalledWith({
      FunctionName: 'myFunction',
      Payload: '{"key":"value"}',
    });
  });

  test('invokes a lambda function with string payload', async () => {
    await sandbox.invokeLambda('myFunction', 'raw-string');
    expect(sandbox._mockInvoke).toHaveBeenCalledWith({
      FunctionName: 'myFunction',
      Payload: 'raw-string',
    });
  });

  test('invokes a lambda function without payload', async () => {
    await sandbox.invokeLambda('myFunction');
    expect(sandbox._mockInvoke).toHaveBeenCalledWith({
      FunctionName: 'myFunction',
      Payload: undefined,
    });
  });

  test('returns false on error', async () => {
    sandbox._mockInvoke.mockReturnValueOnce({
      promise: () => Promise.reject(new Error('Lambda error')),
    });

    const result = await sandbox.invokeLambda('badFunction');
    expect(result).toBe(false);
    expect(sandbox.Logger.log).toHaveBeenCalled();
  });
});
