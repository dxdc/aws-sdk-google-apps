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

/**
 * Scan a DynamoDB table (reads every item, use sparingly).
 *
 * Scanning is expensive and slow on large tables. Prefer `queryDynamoDB` when possible.
 *
 * @param {string} tableName - The name of the DynamoDB table.
 * @param {Object} [options] - Optional scan parameters.
 * @param {string} [options.filterExpression] - Filter expression (e.g., '#s = :active').
 * @param {Object} [options.expressionValues] - Attribute values for the filter expression.
 * @param {Object} [options.expressionNames] - Attribute name substitutions for reserved words.
 * @param {string} [options.projectionExpression] - Comma-separated list of attributes to retrieve.
 * @param {number} [options.limit] - Maximum number of items to evaluate (not necessarily return).
 * @param {Object} [options.exclusiveStartKey] - Pagination key from a previous response's LastEvaluatedKey.
 * @returns {Promise<Object|false>} The DynamoDB scan response (includes Items, Count, LastEvaluatedKey), or `false` on error.
 *
 * @example
 * // Scan all items
 * const result = await scanDynamoDB('Users');
 *
 * @example
 * // Scan with filter
 * const result = await scanDynamoDB('Users', {
 *   filterExpression: '#s = :active',
 *   expressionNames: { '#s': 'status' },
 *   expressionValues: { ':active': { S: 'active' } },
 * });
 */
function scanDynamoDB(tableName, options) {
  const params = {
    TableName: tableName,
  };

  if (options) {
    if (options.filterExpression) {
      params.FilterExpression = options.filterExpression;
    }
    if (options.expressionValues) {
      params.ExpressionAttributeValues = options.expressionValues;
    }
    if (options.expressionNames) {
      params.ExpressionAttributeNames = options.expressionNames;
    }
    if (options.projectionExpression) {
      params.ProjectionExpression = options.projectionExpression;
    }
    if (options.limit) {
      params.Limit = options.limit;
    }
    if (options.exclusiveStartKey) {
      params.ExclusiveStartKey = options.exclusiveStartKey;
    }
  }

  return new AWS.DynamoDB({ apiVersion: '2012-08-10' })
    .scan(params)
    .promise()
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}

/**
 * Update specific attributes of an item in a DynamoDB table.
 *
 * Unlike `putDynamoDBItem` which replaces the entire item, this updates only the specified attributes.
 *
 * @param {string} tableName - The name of the DynamoDB table.
 * @param {Object} key - The primary key of the item to update.
 * @param {string} updateExpression - The update expression (e.g., 'SET #n = :name, age = :age').
 * @param {Object} expressionValues - Attribute values for the expression.
 * @param {Object} [options] - Optional parameters.
 * @param {Object} [options.expressionNames] - Attribute name substitutions for reserved words.
 * @param {string} [options.conditionExpression] - Condition that must be true for the update to succeed.
 * @param {string} [options.returnValues='NONE'] - What to return: 'NONE', 'ALL_OLD', 'UPDATED_OLD', 'ALL_NEW', 'UPDATED_NEW'.
 * @returns {Promise<Object|false>} The DynamoDB updateItem response, or `false` on error.
 *
 * @example
 * const result = await updateDynamoDBItem(
 *   'Users',
 *   { userId: { S: 'user-123' } },
 *   'SET #n = :name, age = :age',
 *   { ':name': { S: 'Bob' }, ':age': { N: '31' } },
 *   { expressionNames: { '#n': 'name' }, returnValues: 'ALL_NEW' },
 * );
 */
function updateDynamoDBItem(tableName, key, updateExpression, expressionValues, options) {
  const params = {
    TableName: tableName,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionValues,
  };

  if (options) {
    if (options.expressionNames) {
      params.ExpressionAttributeNames = options.expressionNames;
    }
    if (options.conditionExpression) {
      params.ConditionExpression = options.conditionExpression;
    }
    if (options.returnValues) {
      params.ReturnValues = options.returnValues;
    }
  }

  return new AWS.DynamoDB({ apiVersion: '2012-08-10' })
    .updateItem(params)
    .promise()
    .catch((err) => {
      Logger.log(err, err.stack);
      return false;
    });
}
