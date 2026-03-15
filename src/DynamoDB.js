/**
 * Get an item from a DynamoDB table by its primary key.
 *
 * @param {string} tableName - The name of the DynamoDB table.
 * @param {Object} key - The primary key of the item (e.g., { id: { S: '123' } }).
 * @returns {Promise<Object|false>} The DynamoDB getItem response (includes Item), or false on error.
 *
 * @example
 * const result = await getDynamoDBItem('Users', { userId: { S: 'user-123' } });
 * if (result !== false && result.Item) {
 *   Logger.log(result.Item.name.S);
 * }
 */
function getDynamoDBItem(tableName, key) {
  return new AWS.DynamoDB({ apiVersion: '2012-08-10' })
    .getItem({
      TableName: tableName,
      Key: key,
    })
    .promise()
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}

/**
 * Put (create or replace) an item in a DynamoDB table.
 *
 * @param {string} tableName - The name of the DynamoDB table.
 * @param {Object} item - The item to put (e.g., { id: { S: '123' }, name: { S: 'Alice' } }).
 * @returns {Promise<Object|false>} The DynamoDB putItem response, or false on error.
 *
 * @example
 * const result = await putDynamoDBItem('Users', {
 *   userId: { S: 'user-123' },
 *   name: { S: 'Alice' },
 *   age: { N: '30' },
 * });
 */
function putDynamoDBItem(tableName, item) {
  return new AWS.DynamoDB({ apiVersion: '2012-08-10' })
    .putItem({
      TableName: tableName,
      Item: item,
    })
    .promise()
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}

/**
 * Delete an item from a DynamoDB table by its primary key.
 *
 * @param {string} tableName - The name of the DynamoDB table.
 * @param {Object} key - The primary key of the item to delete.
 * @returns {Promise<Object|false>} The DynamoDB deleteItem response, or false on error.
 *
 * @example
 * const result = await deleteDynamoDBItem('Users', { userId: { S: 'user-123' } });
 */
function deleteDynamoDBItem(tableName, key) {
  return new AWS.DynamoDB({ apiVersion: '2012-08-10' })
    .deleteItem({
      TableName: tableName,
      Key: key,
    })
    .promise()
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}

/**
 * Query a DynamoDB table using a key condition expression.
 *
 * @param {string} tableName - The name of the DynamoDB table.
 * @param {string} keyConditionExpression - The key condition (e.g., 'userId = :uid').
 * @param {Object} expressionValues - Attribute values for the expression (e.g., { ':uid': { S: '123' } }).
 * @param {Object} [options] - Optional query parameters.
 * @param {string} [options.indexName] - Name of a secondary index to query.
 * @param {number} [options.limit] - Maximum number of items to return.
 * @param {boolean} [options.scanForward=true] - Set to false for descending order.
 * @returns {Promise<Object|false>} The DynamoDB query response (includes Items, Count), or false on error.
 *
 * @example
 * const result = await queryDynamoDB('Orders', 'userId = :uid', {
 *   ':uid': { S: 'user-123' },
 * }, { limit: 10, scanForward: false });
 */
function queryDynamoDB(tableName, keyConditionExpression, expressionValues, options) {
  const params = {
    TableName: tableName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionValues,
  };

  if (options) {
    if (options.indexName) {
      params.IndexName = options.indexName;
    }
    if (options.limit) {
      params.Limit = options.limit;
    }
    if (options.scanForward === false) {
      params.ScanIndexForward = false;
    }
  }

  return new AWS.DynamoDB({ apiVersion: '2012-08-10' })
    .query(params)
    .promise()
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}
