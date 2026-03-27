const fs = require('fs');
const vm = require('vm');

function loadSTS() {
  const code = fs.readFileSync(`${__dirname}/../src/STS.js`, 'utf8');

  const mockAssumeRole = jest.fn().mockReturnValue({
    promise: () =>
      Promise.resolve({
        Credentials: {
          AccessKeyId: 'ASIA_TEMP_KEY',
          SecretAccessKey: 'TEMP_SECRET',
          SessionToken: 'TEMP_TOKEN',
          Expiration: '2026-01-01T00:00:00Z',
        },
      }),
  });
  const mockGetCallerIdentity = jest.fn().mockReturnValue({
    promise: () =>
      Promise.resolve({
        Account: '123456789012',
        Arn: 'arn:aws:iam::123456789012:user/testuser',
        UserId: 'AIDASAMPLEUSERID',
      }),
  });

  const sandbox = {
    ...global,
    AWS: {
      STS: jest.fn().mockReturnValue({
        assumeRole: mockAssumeRole,
        getCallerIdentity: mockGetCallerIdentity,
      }),
    },
    Logger: { log: jest.fn() },
    _mocks: { mockAssumeRole, mockGetCallerIdentity },
  };

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox;
}

describe('STS', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = loadSTS();
  });

  describe('assumeRole', () => {
    test('assumes a role with basic params', async () => {
      const result = await sandbox.assumeRole('arn:aws:iam::123:role/MyRole', 'my-session');
      expect(result.Credentials.AccessKeyId).toBe('ASIA_TEMP_KEY');
      expect(sandbox._mocks.mockAssumeRole).toHaveBeenCalledWith({
        RoleArn: 'arn:aws:iam::123:role/MyRole',
        RoleSessionName: 'my-session',
      });
    });

    test('passes durationSeconds and externalId options', async () => {
      await sandbox.assumeRole('arn:role', 'session', {
        durationSeconds: 900,
        externalId: 'ext-123',
      });
      expect(sandbox._mocks.mockAssumeRole).toHaveBeenCalledWith(
        expect.objectContaining({
          DurationSeconds: 900,
          ExternalId: 'ext-123',
        }),
      );
    });

    test('passes inline policy', async () => {
      const policy = JSON.stringify({ Version: '2012-10-17', Statement: [] });
      await sandbox.assumeRole('arn:role', 'session', { policy });
      expect(sandbox._mocks.mockAssumeRole).toHaveBeenCalledWith(expect.objectContaining({ Policy: policy }));
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockAssumeRole.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('AccessDenied')),
      });
      const result = await sandbox.assumeRole('arn:bad', 'session');
      expect(result).toBe(false);
    });
  });

  describe('getCallerIdentity', () => {
    test('returns caller identity', async () => {
      const result = await sandbox.getCallerIdentity();
      expect(result.Account).toBe('123456789012');
      expect(result.Arn).toContain('testuser');
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockGetCallerIdentity.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('ExpiredToken')),
      });
      const result = await sandbox.getCallerIdentity();
      expect(result).toBe(false);
    });
  });
});
