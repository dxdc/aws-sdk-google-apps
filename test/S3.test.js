const fs = require('fs');
const vm = require('vm');

function loadS3(overrides = {}) {
  const code = fs.readFileSync(`${__dirname}/../src/S3.js`, 'utf8');

  const mockListObjects = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({ Contents: [{ Key: 'file1.txt' }] }),
  });
  const mockGetObject = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({ Body: 'data', ContentType: 'text/plain' }),
  });
  const mockPutObject = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({ ETag: '"abc123"' }),
  });

  const sandbox = {
    ...global,
    AWS: {
      S3: jest.fn().mockReturnValue({
        listObjects: mockListObjects,
        getObject: mockGetObject,
        putObject: mockPutObject,
      }),
    },
    Logger: { log: jest.fn() },
    _mocks: { mockListObjects, mockGetObject, mockPutObject },
    ...overrides,
  };

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox;
}

describe('S3', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = loadS3();
  });

  describe('listS3Objects', () => {
    test('lists objects in a bucket with prefix', async () => {
      const result = await sandbox.listS3Objects('my-bucket', 'prefix/');
      expect(result).toEqual({ Contents: [{ Key: 'file1.txt' }] });
      expect(sandbox.AWS.S3).toHaveBeenCalledWith(
        expect.objectContaining({
          apiVersion: '2006-03-01',
          params: { Bucket: 'my-bucket' },
        }),
      );
      expect(sandbox._mocks.mockListObjects).toHaveBeenCalledWith({
        Delimiter: '/',
        Prefix: 'prefix/',
      });
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockListObjects.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('Access denied')),
      });

      const result = await sandbox.listS3Objects('my-bucket', '/');
      expect(result).toBe(false);
      expect(sandbox.Logger.log).toHaveBeenCalled();
    });
  });

  describe('getS3Object', () => {
    test('gets an object from a bucket', async () => {
      const result = await sandbox.getS3Object('my-bucket', 'file.txt');
      expect(result).toEqual({ Body: 'data', ContentType: 'text/plain' });
      expect(sandbox._mocks.mockGetObject).toHaveBeenCalledWith({
        Bucket: 'my-bucket',
        Key: 'file.txt',
      });
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockGetObject.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('Not found')),
      });

      const result = await sandbox.getS3Object('my-bucket', 'missing.txt');
      expect(result).toBe(false);
    });
  });

  describe('putS3Object', () => {
    test('puts an object into a bucket', async () => {
      const result = await sandbox.putS3Object('my-bucket', 'file.txt', 'content');
      expect(result).toEqual({ ETag: '"abc123"' });
      expect(sandbox._mocks.mockPutObject).toHaveBeenCalledWith({
        Bucket: 'my-bucket',
        Key: 'file.txt',
        Body: 'content',
      });
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockPutObject.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('Forbidden')),
      });

      const result = await sandbox.putS3Object('my-bucket', 'file.txt', 'data');
      expect(result).toBe(false);
    });
  });
});
