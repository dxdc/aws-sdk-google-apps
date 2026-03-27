/**
 * Get an item from a DynamoDB table by its primary key.
 *
 * @param {string} tableName - The name of the DynamoDB table.
 * @param {Object} key - The primary key of the item (e.g., { id: { S: '123' } }).
 * @returns {Promise<Object|false>} The DynamoDB getItem response (includes Item), or `false` on error.
 *
 * @example
 * const result = await getDynamoDBItem('Users', { userId: { S: 'user-123' } });
 * if (result !== false) {
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
 * @returns {Promise<Object|false>} The DynamoDB putItem response, or `false` on error.
 *
 * @example
 * await putDynamoDBItem('Users', {
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
 * @returns {Promise<Object|false>} The DynamoDB deleteItem response, or `false` on error.
 *
 * @example
 * await deleteDynamoDBItem('Users', { userId: { S: 'user-123' } });
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
 * @param {Object} [options.expressionNames] - Attribute name substitutions (e.g., { '#s': 'status' }) for reserved words.
 * @param {string} [options.filterExpression] - Filter expression applied after the query (e.g., '#s = :active').
 * @param {string} [options.projectionExpression] - Comma-separated list of attributes to retrieve.
 * @param {Object} [options.exclusiveStartKey] - Pagination key from a previous response's LastEvaluatedKey.
 * @returns {Promise<Object|false>} The DynamoDB query response (includes Items, Count, LastEvaluatedKey), or `false` on error.
 *
 * @example
 * const result = await queryDynamoDB('Orders', 'userId = :uid', {
 *   ':uid': { S: 'user-123' },
 * }, { limit: 10, scanForward: false });
 *
 * @example
 * // With reserved word handling and filter
 * const result = await queryDynamoDB('Orders', 'userId = :uid', {
 *   ':uid': { S: 'user-123' },
 *   ':active': { S: 'active' },
 * }, {
 *   expressionNames: { '#s': 'status' },
 *   filterExpression: '#s = :active',
 * });
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
    if (options.expressionNames) {
      params.ExpressionAttributeNames = options.expressionNames;
    }
    if (options.filterExpression) {
      params.FilterExpression = options.filterExpression;
    }
    if (options.projectionExpression) {
      params.ProjectionExpression = options.projectionExpression;
    }
    if (options.exclusiveStartKey) {
      params.ExclusiveStartKey = options.exclusiveStartKey;
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
