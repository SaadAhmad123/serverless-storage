import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { IStorageManager } from '.';

/**
 * Interface representing the configuration required for initializing
 * AzureBlobStorageManager.
 */
export interface IAzureBlobStorageManager {
  /**
   * The connection string to the Azure Storage account. This string includes
   * the authentication information required for your application to access data
   * in Azure Blob Storage. It can be found in the Azure portal under the
   * "Access keys" section of your storage account.
   */
  storageAccountConnectionString: string;

  /**
   * The name of the container within the Azure Blob Storage where blobs (files) will
   * be stored, read, and deleted. Containers act like folders in Azure Blob Storage
   * and provide a way to organize sets of blobs.
   */
  storageContainerName: string;
}

/**
 * Implements the IStorageManager interface for Azure Blob Storage,
 * providing methods to write, read, delete, and check the existence of
 * blobs within a container.
 */
export default class AzureBlobStorageManager implements IStorageManager {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;

  /**
   * Constructs a new instance of CosmosBlobStorage with specified Azure Blob Storage settings.
   * @param params The ICosmosBlobStorage interface containing the storage account connection
   * string and the name of the container.
   */
  constructor(params: IAzureBlobStorageManager) {
    this.blobServiceClient = BlobServiceClient.fromConnectionString(
      params.storageAccountConnectionString,
    );
    this.containerClient = this.blobServiceClient.getContainerClient(
      params.storageContainerName,
    );
  }

  /**
   * Asynchronously uploads data as a blob to the specified path within the container.
   * @param data The string data to upload.
   * @param path The path (name) under which to store the blob in the container.
   * @returns A promise that resolves when the upload is complete.
   */
  async write(data: string, path: string): Promise<void> {
    const blobClient = this.containerClient.getBlockBlobClient(path);
    await blobClient.upload(data, data.length);
  }

  /**
   * Asynchronously reads the content of a blob from the specified path.
   * If the blob does not exist, it returns a default value.
   * @param path The path (name) of the blob to read.
   * @param __default The default value to return if the blob does not exist.
   * @returns A promise that resolves to an object containing the blob data and path.
   */
  async read(
    path: string,
    __default: string = '',
  ): Promise<{ [key: string]: any; data: string; path: string }> {
    try {
      const blobClient = this.containerClient.getBlobClient(path);
      const downloadBlockBlobResponse = await blobClient.download(0);
      if (!downloadBlockBlobResponse?.readableStreamBody) {
        return { data: __default, path };
      }
      const data = await this.streamToString(
        downloadBlockBlobResponse.readableStreamBody,
      );
      return { data, path };
    } catch (e) {
      if ((e as Error).message.includes('The specified blob does not exist')) {
        return { data: __default, path };
      }
      throw e;
    }
  }

  /**
   * Asynchronously deletes a blob at the specified path.
   * If the blob does not exist, it quietly completes without error.
   * @param path The path (name) of the blob to delete.
   * @returns A promise that resolves when the blob is deleted.
   */
  async delete(path: string): Promise<void> {
    try {
      const blobClient = this.containerClient.getBlobClient(path);
      await blobClient.delete();
    } catch (e) {
      if ((e as Error).message.includes('The specified blob does not exist')) {
        return;
      }
      throw e;
    }
  }

  /**
   * Checks if a blob exists at the specified path.
   * @param path The path (name) of the blob to check.
   * @returns A promise that resolves to true if the blob exists, otherwise false.
   */
  async exists(path: string): Promise<boolean> {
    const blobClient = this.containerClient.getBlobClient(path);
    const exists = await blobClient.exists();
    return exists;
  }

  /**
   * Helper Function:
   * This is to convert a readable stream to a string.
   * @param readableStream The readable stream to convert.
   * @returns A promise that resolves to the string representation of the stream content.
   */
  private async streamToString(
    readableStream: NodeJS.ReadableStream,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let data = '';
      readableStream.on('data', (chunk) => {
        data += chunk.toString();
      });
      readableStream.on('end', () => {
        resolve(data);
      });
      readableStream.on('error', reject);
    });
  }
}
