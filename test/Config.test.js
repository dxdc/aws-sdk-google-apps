const fs = require('fs');
const vm = require('vm');

function loadConfig() {
  const code = fs.readFileSync(`${__dirname}/../src/Config.js`, 'utf8');

  const updateMock = jest.fn();
  const sandbox = {
    ...global,
    AWS: {
      Config: jest.fn().mockImplementation(function () {
        return { update: updateMock };
      }),
      config: { update: updateMock },
    },
    Logger: { log: jest.fn() },
    _updateMock: updateMock,
  };

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox;
}

describe('Config', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = loadConfig();
  });

  test('initConfig creates new AWS.Config and calls update', () => {
    sandbox.initConfig({
      region: 'us-west-2',
      accessKeyId: 'AKID',
      secretAccessKey: 'SECRET',
    });

    expect(sandbox.AWS.Config).toHaveBeenCalled();
  });

  test('initConfig sets region and credentials', () => {
    sandbox.initConfig({
      region: 'eu-west-1',
      accessKeyId: 'AK',
      secretAccessKey: 'SK',
    });

    expect(sandbox._updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        region: 'eu-west-1',
        sslEnabled: true,
        credentials: {
          accessKeyId: 'AK',
          secretAccessKey: 'SK',
        },
      }),
    );
  });

  test('initConfig includes sessionToken when provided', () => {
    sandbox._updateMock.mockClear();

    sandbox.initConfig({
      region: 'us-east-1',
      accessKeyId: 'AK',
      secretAccessKey: 'SK',
      sessionToken: 'TOKEN123',
    });

    expect(sandbox._updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        credentials: expect.objectContaining({
          sessionToken: 'TOKEN123',
        }),
      }),
    );
  });

  test('initConfig omits sessionToken when not provided', () => {
    sandbox._updateMock.mockClear();

    sandbox.initConfig({
      region: 'us-east-1',
      accessKeyId: 'AK',
      secretAccessKey: 'SK',
    });

    const callArgs = sandbox._updateMock.mock.calls[0][0];
    expect(callArgs.credentials).not.toHaveProperty('sessionToken');
  });

  test('initConfig passes extra options via rest params', () => {
    sandbox._updateMock.mockClear();

    sandbox.initConfig({
      region: 'us-east-1',
      accessKeyId: 'AK',
      secretAccessKey: 'SK',
      maxRetries: 3,
    });

    expect(sandbox._updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        maxRetries: 3,
      }),
    );
  });
});
