const fs = require('fs');
const vm = require('vm');

function loadS3() {
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
  const mockDeleteObject = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({}),
  });
  const mockCopyObject = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({ CopyObjectResult: {} }),
  });

  const sandbox = {
    ...global,
    AWS: {
      S3: jest.fn().mockReturnValue({
        listObjects: mockListObjects,
        getObject: mockGetObject,
        putObject: mockPutObject,
        deleteObject: mockDeleteObject,
        copyObject: mockCopyObject,
      }),
    },
    Logger: { log: jest.fn() },
    _mocks: { mockListObjects, mockGetObject, mockPutObject, mockDeleteObject, mockCopyObject },
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

    test('passes contentType option', async () => {
      await sandbox.putS3Object('my-bucket', 'file.txt', 'content', { contentType: 'text/plain' });
      expect(sandbox._mocks.mockPutObject).toHaveBeenCalledWith(expect.objectContaining({ ContentType: 'text/plain' }));
    });

    test('passes cacheControl and metadata options', async () => {
      await sandbox.putS3Object('my-bucket', 'file.txt', 'content', {
        cacheControl: 'max-age=3600',
        metadata: { author: 'test' },
      });
      expect(sandbox._mocks.mockPutObject).toHaveBeenCalledWith(
        expect.objectContaining({
          CacheControl: 'max-age=3600',
          Metadata: { author: 'test' },
        }),
      );
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockPutObject.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('Forbidden')),
      });
      const result = await sandbox.putS3Object('my-bucket', 'file.txt', 'data');
      expect(result).toBe(false);
    });
  });

  describe('deleteS3Object', () => {
    test('deletes an object from a bucket', async () => {
      const result = await sandbox.deleteS3Object('my-bucket', 'file.txt');
      expect(result).toEqual({});
      expect(sandbox._mocks.mockDeleteObject).toHaveBeenCalledWith({
        Bucket: 'my-bucket',
        Key: 'file.txt',
      });
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockDeleteObject.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('Access denied')),
      });
      const result = await sandbox.deleteS3Object('my-bucket', 'file.txt');
      expect(result).toBe(false);
    });
  });

  describe('copyS3Object', () => {
    test('copies an object between buckets', async () => {
      const result = await sandbox.copyS3Object('src-bucket', 'file.txt', 'dst-bucket', 'backup/file.txt');
      expect(result).toEqual({ CopyObjectResult: {} });
      expect(sandbox._mocks.mockCopyObject).toHaveBeenCalledWith({
        Bucket: 'dst-bucket',
        Key: 'backup/file.txt',
        CopySource: 'src-bucket/file.txt',
      });
    });

    test('URL-encodes special characters in source key', async () => {
      await sandbox.copyS3Object('src-bucket', 'path/file with spaces.txt', 'dst-bucket', 'dest.txt');
      expect(sandbox._mocks.mockCopyObject).toHaveBeenCalledWith(
        expect.objectContaining({
          CopySource: 'src-bucket/path/file%20with%20spaces.txt',
        }),
      );
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockCopyObject.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('Copy error')),
      });
      const result = await sandbox.copyS3Object('src', 'key', 'dst', 'key2');
      expect(result).toBe(false);
    });
  });

  describe('listS3Objects edge cases', () => {
    test('defaults prefix to empty string when omitted', async () => {
      await sandbox.listS3Objects('my-bucket');
      expect(sandbox._mocks.mockListObjects).toHaveBeenCalledWith({
        Delimiter: '/',
        Prefix: '',
      });
    });
  });
});
