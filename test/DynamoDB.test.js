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
});
