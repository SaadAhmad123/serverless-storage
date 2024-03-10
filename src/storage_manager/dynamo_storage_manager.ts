import * as AWS from 'aws-sdk';
import { IStorageManager } from '.';
import { getTimestamp } from '../utils';

/**
 * Configuration options for DynamoStorageManager.
 */
export type IDynamoStorageManager = {
  /**
   * The name of the DynamoDB table to use for storage.
   */
  tableName: string;
  /**
   * Optional AWS IAM access key ID for DynamoDB authentication.
   */
  awsAccessKey?: string;
  /**
   * Optional AWS IAM secret access key for DynamoDB authentication.
   */
  awsSecretKey?: string;
  /**
   * Optional AWS region for DynamoDB. If not provided, the default region is used.
   */
  awsRegion?: string;
  /**
   * Optional transformation function applied before writing data to DynamoDB.
   * The function takes data and path as input and returns an object with additional attributes.
   * Properties 'data', 'path', and 'updatedAt' are reserved and cannot be overridden.
   */
  appendPreWrite?: (
    data: string,
    path: string,
  ) => Exclude<Record<string, any>, 'data' & 'path' & 'updatedAt'>;
};

/**
 * Implementation of IStorageManager for DynamoDB storage.
 *
 * This class handles storage operations such as writing, reading, deleting,
 * and checking the existence of items in a DynamoDB table.
 *
 * @example - Sample Typescript usage
 * ```typescript
 * // Initialize DynamoStorageManager with configuration
 * const dynamoStorageManager = new DynamoStorageManager({
 *   tableName: 'MyDynamoTable',
 *   awsAccessKey: 'your-access-key',
 *   awsSecretKey: 'your-secret-key',
 *   awsRegion: 'your-region',
 *   appendPreWrite: (data, path) => ({
 *     customAttribute: 'some-value',
 *     originalData: data,
 *     originalPath: path,
 *   }),
 * });
 *
 * // Set a logger function
 * dynamoStorageManager.setLogger((log) => console.log(log));
 *
 * // Write data to DynamoDB
 * await dynamoStorageManager.write('Hello, DynamoDB!', 'example/path');
 *
 * // Read data from DynamoDB
 * const readResult = await dynamoStorageManager.read('example/path', 'Default Value');
 * console.log('Read Result:', readResult);
 *
 * // Delete item from DynamoDB
 * await dynamoStorageManager.delete('example/path');
 *
 * // Check if item exists in DynamoDB
 * const exists = await dynamoStorageManager.exists('example/path');
 * console.log('Item Exists:', exists);
 * ```
 *
 * @example - Sample terraform to create the table
 * ```hcl
 * resource "aws_dynamodb_table" "storage_table" {
 *   name           = "storageTable"
 *   billing_mode   = "PAY_PER_REQUEST"
 *   hash_key       = "path"
 *   attribute {
 *     name = "path"
 *     type = "S"  # 'S' denotes a string type
 *   }
 *   tags = {
 *     Name        = "StorageTable"
 *     Environment = "Production"
 *   }
 * }
 *
 * resource "aws_iam_policy" "storage_table_policy" {
 *   name        = "DynamoDBPolicy"
 *   description = "IAM policy for accessing DynamoDB Storage Table"
 *
 *   policy = jsonencode({
 *     Version = "2012-10-17",
 *     Statement = [
 *       {
 *         Effect = "Allow",
 *         Action = [
 *           "dynamodb:GetItem",
 *           "dynamodb:PutItem",
 *           "dynamodb:DeleteItem",
 *           "dynamodb:Query",
 *           "dynamodb:Scan",
 *           "dynamodb:DescribeTable"
 *         ],
 *         Resource = aws_dynamodb_table.storage_table.arn
 *       }
 *     ]
 *   })
 * }
 * ```
 */
export default class DynamoStorageManager implements IStorageManager {
  private dynamoDb: AWS.DynamoDB.DocumentClient;
  private log: (log: string) => void;

  /**
   * Sets the logger function for logging messages within the S3StorageManager.
   *
   * @param logger - The logger function to set.
   */
  public setLogger(logger: (log: string) => void): DynamoStorageManager {
    this.log = logger;
    return this;
  }

  /**
   * Constructs a DynamoStorageManager for interacting with DynamoDB storage.
   *
   * Utilizes AWS DynamoDB for storage operations. Optionally accepts AWS IAM credentials
   * and region. If credentials are not provided, the default AWS credential provider
   * chain is used.
   *
   * @param params - Configuration options for DynamoStorageManager.
   */
  constructor(private params: IDynamoStorageManager) {
    if (!params.tableName) {
      throw new Error(`[DynamoStorageManager] The table name cannot be empty`);
    }
    AWS.config.update({
      accessKeyId: params.awsAccessKey,
      secretAccessKey: params.awsSecretKey,
      region: params.awsRegion,
    });
    this.dynamoDb = new AWS.DynamoDB.DocumentClient();
    this.log = (log) => console.log(log);
  }

  /**
   * Writes data to the specified path in the DynamoDB table.
   *
   * @param data - The string data to be written.
   * @param path - The path where data will be written.
   * @returns A promise resolved once the write operation is complete.
   */
  async write(data: string, path: string): Promise<void> {
    const params: AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: this.params.tableName,
      Item: {
        ...(this.params.appendPreWrite?.(data, path) || {}),
        path,
        data,
        updatedAt: getTimestamp(),
      },
    };
    await this.dynamoDb.put(params).promise();
  }

  /**
   * Reads data from the specified path in the DynamoDB table.
   *
   * Returns the default value if the item is not found or an error occurs.
   * Logs a message if the item is not found.
   *
   * @param path - The path from where to read data.
   * @param __default - The default value to return if the item is not found or an error occurs.
   * @returns A promise resolving to the data read or the default value.
   */
  async read(
    path: string,
    __default: string = '',
  ): Promise<{ [key: string]: any; data: string; path: string }> {
    const params: AWS.DynamoDB.DocumentClient.GetItemInput = {
      TableName: this.params.tableName,
      Key: {
        path,
      },
    };
    const result = await this.dynamoDb.get(params).promise();
    return {
      ...(result?.Item || {}),
      path: result?.Item?.path || path,
      data: result?.Item?.data || __default,
    };
  }

  /**
   * Deletes an item at the specified path in the DynamoDB table.
   *
   * Logs a message upon successful deletion.
   *
   * @param path - The path from where the item will be deleted.
   * @returns A promise resolved once the deletion is complete.
   */
  async delete(path: string): Promise<void> {
    const params: AWS.DynamoDB.DocumentClient.DeleteItemInput = {
      TableName: this.params.tableName,
      Key: {
        path,
      },
    };
    await this.dynamoDb.delete(params).promise();
  }

  /**
   * Checks if an item exists at the specified path in the DynamoDB table.
   *
   * @param path - The path of the item to check for existence.
   * @returns A promise resolved to true if the item exists, false otherwise.
   */
  async exists(path: string): Promise<boolean> {
    const params: AWS.DynamoDB.DocumentClient.GetItemInput = {
      TableName: this.params.tableName,
      Key: {
        path,
      },
    };
    const result = await this.dynamoDb.get(params).promise();
    return Boolean(result.Item);
  }
}
