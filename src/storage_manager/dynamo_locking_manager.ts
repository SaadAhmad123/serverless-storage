import * as AWS from 'aws-sdk';
import { ILockingManager } from '.';

/**
 * Get the current timestamp in seconds since the Unix epoch.
 * @returns {number} The current timestamp in seconds.
 */
function getTimestamp(): number {
  const now = new Date();
  return Math.floor(now.getTime() / 1000);
}

/**
 * A locking manager that utilizes AWS DynamoDB for distributed locking.
 * This class provides mechanisms to acquire, release, and check locks on resource paths
 * stored in a specified DynamoDB table. It's suitable for managing access to shared
 * resources in a distributed environment.
 * 
 * @remarks
 * - The DynamoDB table must be configured with a primary key named `id` (type String),
 *   which stores the resource paths.
 * - Optionally, a Time to Live (TTL) attribute `expireAt` can be configured to
 *   automatically expire locks, preventing indefinite lock persistence.
 */
export default class DynamoLockingManager implements ILockingManager {
  private dynamoDb: AWS.DynamoDB.DocumentClient;

  /**
   * Creates an instance of DynamoLockingManager.
   * @param tableName - The DynamoDB table name for locking.
   * @param awsAccessKey - (Optional) AWS access key ID for authentication.
   * @param awsSecretKey - (Optional) AWS secret access key for authentication.
   * @param awsRegion - (Optional) AWS region for the DynamoDB table.
   * @param timeToLiveDurationInSeconds - (Optional) Duration in seconds for lock expiry, defaults to 900 (15 minutes).
   */
  constructor(
    private tableName: string,
    private awsAccessKey?: string,
    private awsSecretKey?: string,
    private awsRegion?: string,
    private timeToLiveDurationInSeconds: number = 900,
  ) {
    if (!tableName) {
      throw new Error(`[DynamoLockingManager] The table name cannot be empty`);
    }
    AWS.config.update({
      accessKeyId: this.awsAccessKey,
      secretAccessKey: this.awsSecretKey,
      region: this.awsRegion,
    });
    this.dynamoDb = new AWS.DynamoDB.DocumentClient();
  }

  /**
   * Attempts to acquire a lock on the specified resource path.
   * @param path - The resource path for which the lock is requested.
   * @returns {Promise<Boolean>} True if lock is acquired, false if it fails.
   */
  async lock(path: string): Promise<Boolean> {
    const createdAt = getTimestamp();
    const params = {
      TableName: this.tableName,
      Item: {
        id: path,
        createdAt,
        expireAt: createdAt + this.timeToLiveDurationInSeconds,
      },
      ConditionExpression: 'attribute_not_exists(id)',
    };
    try {
      await this.dynamoDb.put(params).promise();
      return true;
    } catch (error) {
      const e = JSON.stringify({
        tableName: this.tableName,
        name: (error as AWS.AWSError).name,
        message: (error as AWS.AWSError).message,
        statusCode: (error as AWS.AWSError).statusCode,
        code: (error as AWS.AWSError).code,
      });
      console.error(`[Error][DynamoLockingManager.lock] ${e}`);
      return false;
    }
  }

  /**
   * Releases a lock on the specified resource path.
   * @param path - The resource path for which the lock is to be released.
   * @returns {Promise<boolean>} True if lock is released, false if it fails.
   */
  async unlock(path: string): Promise<boolean> {
    const params = {
      TableName: this.tableName,
      Key: {
        id: path,
      },
      ConditionExpression: 'attribute_exists(id)',
    };

    try {
      await this.dynamoDb.delete(params).promise();
      return true;
    } catch (error) {
      const e = JSON.stringify({
        tableName: this.tableName,
        name: (error as AWS.AWSError).name,
        message: (error as AWS.AWSError).message,
        statusCode: (error as AWS.AWSError).statusCode,
        code: (error as AWS.AWSError).code,
      });
      console.error(`[Error][DynamoLockingManager.unlock] ${e}`);
      return false;
    }
  }

  /**
   * Checks if the specified resource path is currently locked.
   * @param path - The resource path to check for a lock.
   * @returns {Promise<Boolean>} True if the lock exists, false otherwise.
   */
  async isLocked(path: string): Promise<Boolean> {
    const params = {
      TableName: this.tableName,
      Key: {
        id: path,
      },
    };

    try {
      const response = await this.dynamoDb.get(params).promise();
      // The lock exists if the item is found in the DynamoDB table
      return !!response.Item;
    } catch (error) {
      const e = JSON.stringify({
        tableName: this.tableName,
        name: (error as AWS.AWSError).name,
        message: (error as AWS.AWSError).message,
        statusCode: (error as AWS.AWSError).statusCode,
        code: (error as AWS.AWSError).code,
      });
      console.error(`[Error][DynamoLockingManager.isLocked] ${e}`);
      return false;
    }
  }
}
