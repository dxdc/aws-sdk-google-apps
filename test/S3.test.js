const fs = require('fs');
const vm = require('vm');

function loadS3() {
  const code = fs.readFileSync(`${__dirname}/../src/S3.js`, 'utf8');

  const mockListObjectsV2 = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({ Contents: [{ Key: 'file1.txt' }], KeyCount: 1, IsTruncated: false }),
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
        listObjectsV2: mockListObjectsV2,
        getObject: mockGetObject,
        putObject: mockPutObject,
        deleteObject: mockDeleteObject,
        copyObject: mockCopyObject,
      }),
    },
    Logger: { log: jest.fn() },
    _mocks: { mockListObjectsV2, mockGetObject, mockPutObject, mockDeleteObject, mockCopyObject },
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
    test('lists objects with options', async () => {
      const result = await sandbox.listS3Objects('my-bucket', { prefix: 'images/' });
      expect(result).toEqual({ Contents: [{ Key: 'file1.txt' }], KeyCount: 1, IsTruncated: false });
      expect(sandbox._mocks.mockListObjectsV2).toHaveBeenCalledWith({
        Delimiter: '/',
        Prefix: 'images/',
      });
    });

    test('defaults prefix to empty string and delimiter to /', async () => {
      await sandbox.listS3Objects('my-bucket');
      expect(sandbox._mocks.mockListObjectsV2).toHaveBeenCalledWith({
        Delimiter: '/',
        Prefix: '',
      });
    });

    test('passes continuationToken and maxKeys', async () => {
      await sandbox.listS3Objects('my-bucket', {
        prefix: 'dir/',
        maxKeys: 10,
        continuationToken: 'abc123',
        startAfter: 'dir/start.txt',
      });
      expect(sandbox._mocks.mockListObjectsV2).toHaveBeenCalledWith({
        Delimiter: '/',
        Prefix: 'dir/',
        MaxKeys: 10,
        ContinuationToken: 'abc123',
        StartAfter: 'dir/start.txt',
      });
    });

    test('allows overriding delimiter', async () => {
      await sandbox.listS3Objects('my-bucket', { delimiter: '' });
      expect(sandbox._mocks.mockListObjectsV2).toHaveBeenCalledWith({
        Delimiter: '',
        Prefix: '',
      });
    });

    test('throws on error', async () => {
      sandbox._mocks.mockListObjectsV2.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('Access denied')),
      });
      await expect(sandbox.listS3Objects('my-bucket')).rejects.toThrow('Access denied');
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

    test('throws on error', async () => {
      sandbox._mocks.mockGetObject.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('NoSuchKey')),
      });
      await expect(sandbox.getS3Object('my-bucket', 'missing.txt')).rejects.toThrow('NoSuchKey');
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

    test('throws on error', async () => {
      sandbox._mocks.mockPutObject.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('Forbidden')),
      });
      await expect(sandbox.putS3Object('my-bucket', 'file.txt', 'data')).rejects.toThrow('Forbidden');
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

    test('throws on error', async () => {
      sandbox._mocks.mockDeleteObject.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('Access denied')),
      });
      await expect(sandbox.deleteS3Object('my-bucket', 'file.txt')).rejects.toThrow('Access denied');
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

    test('throws on error', async () => {
      sandbox._mocks.mockCopyObject.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('Copy error')),
      });
      await expect(sandbox.copyS3Object('src', 'key', 'dst', 'key2')).rejects.toThrow('Copy error');
    });
  });
});
