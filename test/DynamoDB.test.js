const fs = require('fs');
const vm = require('vm');

function loadDynamoDB() {
  const code = fs.readFileSync(`${__dirname}/../src/DynamoDB.js`, 'utf8');

  const mockGetItem = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({ Item: { userId: { S: 'user-123' }, name: { S: 'Alice' } } }),
  });
  const mockPutItem = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({}),
  });
  const mockDeleteItem = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({}),
  });
  const mockQuery = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({ Items: [], Count: 0 }),
  });

  const sandbox = {
    ...global,
    AWS: {
      DynamoDB: jest.fn().mockReturnValue({
        getItem: mockGetItem,
        putItem: mockPutItem,
        deleteItem: mockDeleteItem,
        query: mockQuery,
      }),
    },
    Logger: { log: jest.fn() },
    _mocks: { mockGetItem, mockPutItem, mockDeleteItem, mockQuery },
  };

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox;
}

describe('DynamoDB', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = loadDynamoDB();
  });

  describe('getDynamoDBItem', () => {
    test('gets item by key', async () => {
      const result = await sandbox.getDynamoDBItem('TestTable', { userId: { S: 'user-123' } });
      expect(result.Item.name.S).toBe('Alice');
      expect(sandbox._mocks.mockGetItem).toHaveBeenCalledWith({
        TableName: 'TestTable',
        Key: { userId: { S: 'user-123' } },
      });
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockGetItem.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('DDB error')),
      });
      const result = await sandbox.getDynamoDBItem('TestTable', {});
      expect(result).toBe(false);
    });
  });

  describe('putDynamoDBItem', () => {
    test('puts item in table', async () => {
      const item = { userId: { S: 'user-123' }, name: { S: 'Bob' } };
      const result = await sandbox.putDynamoDBItem('TestTable', item);
      expect(result).toEqual({});
      expect(sandbox._mocks.mockPutItem).toHaveBeenCalledWith({
        TableName: 'TestTable',
        Item: item,
      });
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockPutItem.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('DDB error')),
      });
      const result = await sandbox.putDynamoDBItem('TestTable', {});
      expect(result).toBe(false);
    });
  });

  describe('deleteDynamoDBItem', () => {
    test('deletes item by key', async () => {
      const result = await sandbox.deleteDynamoDBItem('TestTable', { userId: { S: 'user-123' } });
      expect(result).toEqual({});
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockDeleteItem.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('DDB error')),
      });
      const result = await sandbox.deleteDynamoDBItem('TestTable', {});
      expect(result).toBe(false);
    });
  });

  describe('queryDynamoDB', () => {
    test('queries with key condition', async () => {
      const result = await sandbox.queryDynamoDB('TestTable', 'userId = :uid', { ':uid': { S: '123' } });
      expect(result).toEqual({ Items: [], Count: 0 });
      expect(sandbox._mocks.mockQuery).toHaveBeenCalledWith({
        TableName: 'TestTable',
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': { S: '123' } },
      });
    });

    test('passes options (indexName, limit, scanForward)', async () => {
      await sandbox.queryDynamoDB(
        'TestTable',
        'pk = :pk',
        { ':pk': { S: 'val' } },
        {
          indexName: 'GSI1',
          limit: 5,
          scanForward: false,
        },
      );
      expect(sandbox._mocks.mockQuery).toHaveBeenCalledWith({
        TableName: 'TestTable',
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': { S: 'val' } },
        IndexName: 'GSI1',
        Limit: 5,
        ScanIndexForward: false,
      });
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockQuery.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('Query error')),
      });
      const result = await sandbox.queryDynamoDB('TestTable', 'pk = :pk', {});
      expect(result).toBe(false);
    });
  });
});
