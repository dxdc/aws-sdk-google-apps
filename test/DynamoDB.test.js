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
    promise: () => Promise.resolve({ Items: [{ userId: { S: 'user-123' } }], Count: 1 }),
  });
  const mockScan = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({ Items: [{ userId: { S: 'user-123' } }], Count: 1, ScannedCount: 1 }),
  });
  const mockUpdateItem = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({ Attributes: { name: { S: 'Bob' } } }),
  });

  const sandbox = {
    ...global,
    AWS: {
      DynamoDB: jest.fn().mockReturnValue({
        getItem: mockGetItem,
        putItem: mockPutItem,
        deleteItem: mockDeleteItem,
        query: mockQuery,
        scan: mockScan,
        updateItem: mockUpdateItem,
      }),
    },
    Logger: { log: jest.fn() },
    _mocks: { mockGetItem, mockPutItem, mockDeleteItem, mockQuery, mockScan, mockUpdateItem },
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
    test('gets an item by key', async () => {
      const result = await sandbox.getDynamoDBItem('Users', { userId: { S: 'user-123' } });
      expect(result.Item.name.S).toBe('Alice');
      expect(sandbox._mocks.mockGetItem).toHaveBeenCalledWith({
        TableName: 'Users',
        Key: { userId: { S: 'user-123' } },
      });
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockGetItem.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('ResourceNotFoundException')),
      });
      const result = await sandbox.getDynamoDBItem('Missing', { id: { S: '1' } });
      expect(result).toBe(false);
    });
  });

  describe('putDynamoDBItem', () => {
    test('puts an item', async () => {
      const item = { userId: { S: 'user-123' }, name: { S: 'Alice' } };
      await sandbox.putDynamoDBItem('Users', item);
      expect(sandbox._mocks.mockPutItem).toHaveBeenCalledWith({
        TableName: 'Users',
        Item: item,
      });
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockPutItem.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('ValidationException')),
      });
      const result = await sandbox.putDynamoDBItem('T', {});
      expect(result).toBe(false);
    });
  });

  describe('deleteDynamoDBItem', () => {
    test('deletes an item by key', async () => {
      await sandbox.deleteDynamoDBItem('Users', { userId: { S: 'user-123' } });
      expect(sandbox._mocks.mockDeleteItem).toHaveBeenCalledWith({
        TableName: 'Users',
        Key: { userId: { S: 'user-123' } },
      });
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockDeleteItem.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('ConditionalCheckFailedException')),
      });
      const result = await sandbox.deleteDynamoDBItem('T', { id: { S: '1' } });
      expect(result).toBe(false);
    });
  });

  describe('queryDynamoDB', () => {
    test('queries with basic params', async () => {
      const result = await sandbox.queryDynamoDB('Users', 'userId = :uid', { ':uid': { S: 'user-123' } });
      expect(result.Count).toBe(1);
      expect(sandbox._mocks.mockQuery).toHaveBeenCalledWith({
        TableName: 'Users',
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': { S: 'user-123' } },
      });
    });

    test('passes indexName, limit, scanForward options', async () => {
      await sandbox.queryDynamoDB(
        'Users',
        'userId = :uid',
        { ':uid': { S: '123' } },
        {
          indexName: 'GSI1',
          limit: 10,
          scanForward: false,
        },
      );
      expect(sandbox._mocks.mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          IndexName: 'GSI1',
          Limit: 10,
          ScanIndexForward: false,
        }),
      );
    });

    test('passes expressionNames and filterExpression', async () => {
      await sandbox.queryDynamoDB(
        'Users',
        'userId = :uid',
        { ':uid': { S: '123' }, ':active': { S: 'active' } },
        {
          expressionNames: { '#s': 'status' },
          filterExpression: '#s = :active',
        },
      );
      expect(sandbox._mocks.mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          ExpressionAttributeNames: { '#s': 'status' },
          FilterExpression: '#s = :active',
        }),
      );
    });

    test('passes projectionExpression and exclusiveStartKey', async () => {
      await sandbox.queryDynamoDB(
        'Users',
        'userId = :uid',
        { ':uid': { S: '123' } },
        {
          projectionExpression: 'userId, #n',
          exclusiveStartKey: { userId: { S: 'last-key' } },
        },
      );
      expect(sandbox._mocks.mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          ProjectionExpression: 'userId, #n',
          ExclusiveStartKey: { userId: { S: 'last-key' } },
        }),
      );
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockQuery.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('ValidationException')),
      });
      const result = await sandbox.queryDynamoDB('T', 'k = :v', { ':v': { S: '1' } });
      expect(result).toBe(false);
    });
  });

  describe('scanDynamoDB', () => {
    test('scans a table with no options', async () => {
      const result = await sandbox.scanDynamoDB('Users');
      expect(result.Count).toBe(1);
      expect(sandbox._mocks.mockScan).toHaveBeenCalledWith({ TableName: 'Users' });
    });

    test('passes filter, expressionNames, and limit', async () => {
      await sandbox.scanDynamoDB('Users', {
        filterExpression: '#s = :active',
        expressionNames: { '#s': 'status' },
        expressionValues: { ':active': { S: 'active' } },
        limit: 100,
      });
      expect(sandbox._mocks.mockScan).toHaveBeenCalledWith(
        expect.objectContaining({
          FilterExpression: '#s = :active',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: { ':active': { S: 'active' } },
          Limit: 100,
        }),
      );
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockScan.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('ResourceNotFoundException')),
      });
      const result = await sandbox.scanDynamoDB('Missing');
      expect(result).toBe(false);
    });
  });

  describe('updateDynamoDBItem', () => {
    test('updates specific attributes', async () => {
      const result = await sandbox.updateDynamoDBItem(
        'Users',
        { userId: { S: 'user-123' } },
        'SET #n = :name',
        { ':name': { S: 'Bob' } },
        { expressionNames: { '#n': 'name' }, returnValues: 'ALL_NEW' },
      );
      expect(result).toEqual({ Attributes: { name: { S: 'Bob' } } });
      expect(sandbox._mocks.mockUpdateItem).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'Users',
          Key: { userId: { S: 'user-123' } },
          UpdateExpression: 'SET #n = :name',
          ExpressionAttributeValues: { ':name': { S: 'Bob' } },
          ExpressionAttributeNames: { '#n': 'name' },
          ReturnValues: 'ALL_NEW',
        }),
      );
    });

    test('passes conditionExpression', async () => {
      await sandbox.updateDynamoDBItem(
        'Users',
        { userId: { S: 'user-123' } },
        'SET age = :age',
        { ':age': { N: '31' }, ':expected': { N: '30' } },
        { conditionExpression: 'age = :expected' },
      );
      expect(sandbox._mocks.mockUpdateItem).toHaveBeenCalledWith(expect.objectContaining({ ConditionExpression: 'age = :expected' }));
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockUpdateItem.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('ConditionalCheckFailedException')),
      });
      const result = await sandbox.updateDynamoDBItem('T', { id: { S: '1' } }, 'SET x = :v', { ':v': { S: 'a' } });
      expect(result).toBe(false);
    });
  });
});
