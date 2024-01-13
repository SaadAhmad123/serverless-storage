import { S3 } from 'aws-sdk';
import { IStorageManager } from './index';

/**
 * Implementation of IStorageManager for Amazon S3 storage.
 *
 * This class handles storage operations such as writing, reading, deleting,
 * and checking the existence of objects in an Amazon S3 bucket.
 */
export default class S3StorageManager implements IStorageManager {
  private s3: S3;

  /**
   * Constructs an S3StorageManager for interacting with Amazon S3 storage.
   *
   * Utilizes AWS S3 for storage operations. Optionally accepts AWS IAM credentials
   * and region. If credentials are not provided, the default AWS credential provider
   * chain is used.
   *
   * Required S3 permissions include s3:GetObject, s3:PutObject, s3:DeleteObject and s3:ListBucket
   *
   * @param bucketName - The name of the S3 bucket to use for storage.
   * @param path - The path of the folder. Format must be path/to/folder/.
   * @param awsAccessKey - Optional AWS IAM access key ID.
   * @param awsSecretKey - Optional AWS IAM secret access key.
   * @param awsRegion - Optional AWS region for the S3 bucket.
   */
  constructor(
    private bucketName: string,
    private path: string = '',
    private awsAccessKey?: string,
    private awsSecretKey?: string,
    private awsRegion?: string,
  ) {
    if (
      this.path &&
      (!/^(\/?[a-zA-Z0-9_-]+)+\/$/.test(this.path) || this.path[0] === '/')
    ) {
      throw new Error(
        `Invalid path format. Please use a valid path like 'path/to/folder/'. Provided is ${this.path}`,
      );
    }
    this.s3 = new S3({
      accessKeyId: this.awsAccessKey,
      secretAccessKey: this.awsSecretKey,
      region: this.awsRegion,
    });
  }

  /**
   * Reads data from a specified key/path in the S3 bucket.
   *
   * Returns the default value if the object is not found or an error occurs.
   * Logs a message if the object is not found.
   *
   * @param path - The S3 key/path from where to read data.
   * @param __default - The default value to return if the object is not found or an error occurs.
   * @returns A promise resolving to the data read or the default value.
   */
  async read(path: string, __default: string = ''): Promise<string> {
    try {
      path = `${this.path}${path}`;
      const response = await this.s3
        .getObject({ Bucket: this.bucketName, Key: path })
        .promise();
      return response.Body?.toString() || __default;
    } catch (error) {
      if ((error as any).code === 'NoSuchKey') {
        console.log(`File ${path} not found in bucket ${this.bucketName}.`);
        return __default;
      } else {
        throw error;
      }
    }
  }

  /**
   * Deletes an object at a specified key/path in the S3 bucket.
   *
   * Logs a message upon successful deletion.
   *
   * @param path - The S3 key/path from where the object will be deleted.
   * @returns A promise resolved once the deletion is complete.
   */
  async delete(path: string): Promise<void> {
    path = `${this.path}${path}`;
    await this.s3
      .deleteObject({ Bucket: this.bucketName, Key: path })
      .promise();
    console.log(
      `File ${path} deleted successfully from bucket ${this.bucketName}.`,
    );
  }

  /**
   * Writes data to a specified key/path in the S3 bucket.
   *
   * Logs a message upon successful write operation.
   *
   * @param data - The string data to be written.
   * @param path - The S3 key/path where data will be written.
   * @returns A promise resolved once the write operation is complete.
   */
  async write(data: string, path: string): Promise<void> {
    path = `${this.path}${path}`;
    await this.s3
      .putObject({ Body: data, Bucket: this.bucketName, Key: path })
      .promise();
    console.log(
      `File ${path} has been written successfully in bucket ${this.bucketName}.`,
    );
  }

  /**
   * Checks if an object exists at a specified key/path in the S3 bucket.
   *
   * @param path - The key/path of the object to check for existence.
   * @returns A promise resolved to true if the object exists, false otherwise.
   */
  async exists(path: string): Promise<boolean> {
    try {
      path = `${this.path}${path}`;
      await this.s3
        .headObject({ Bucket: this.bucketName, Key: path })
        .promise();
      return true;
    } catch (error) {
      if ((error as any).code === 'NotFound') {
        return false;
      } else {
        throw error;
      }
    }
  }
}
