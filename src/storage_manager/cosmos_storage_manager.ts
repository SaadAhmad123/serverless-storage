import { CosmosClient } from '@azure/cosmos';
import { IStorageManager } from '.';
import { getTimestamp } from '../utils';

/**
 * Defines the configuration required for initializing a connection to an Azure Cosmos DB instance
 * through the CosmosStorageManager. This interface includes all necessary details such as the endpoint,
 * authentication key, and identifiers for the target database and container within Cosmos DB.
 */
export interface ICosmosStorageManager {
  /**
   * The URL endpoint for the Azure Cosmos DB account. This endpoint is used to establish a connection
   * to the Cosmos DB service and must be a valid URL pointing to the Cosmos DB account you intend to access.
   */
  endpoint: string;

  /**
   * The authentication key or token for the Azure Cosmos DB account. This key provides the necessary
   * permissions to perform operations against the account. It should be kept secure and not exposed
   * in public code repositories.
   */
  key: string;

  /**
   * The unique identifier of the database within the Azure Cosmos DB account where operations
   * will be performed. The database ID refers to a logical container for collections (containers),
   * users, and permissions.
   */
  databaseId: string;

  /**
   * The unique identifier of the container within the specified database. Containers are used to
   * group and manage related items within a database, and this ID specifies the target container
   * for CRUD operations by the CosmosStorageManager.
   */
  containerId: string;

  /**
   * Optional transformation function applied before writing data to DynamoDB.
   * The function takes data and path as input and returns an object with additional attributes.
   * Properties 'data', 'path', and 'updatedAt' are reserved and cannot be overridden.
   */
  appendPreWrite?: (
    data: string,
    path: string,
  ) => Exclude<Record<string, any>, 'data' & 'path' & 'updatedAt'>;
}

/**
 * CosmosStorageManager provides an implementation of the IStorageManager interface for Azure Cosmos DB.
 * It supports basic CRUD operations such as read, write, delete, and check existence of documents
 * within a specified Cosmos DB container.
 */
export default class CosmosStorageManager implements IStorageManager {
  private client: CosmosClient;
  private log: (log: string) => void;

  /**
   * Sets the logger function for logging messages within the S3StorageManager.
   *
   * @param logger - The logger function to set.
   */
  public setLogger(logger: (log: string) => void): CosmosStorageManager {
    this.log = logger;
    return this;
  }

  /**
   * Initializes a new instance of the CosmosStorageManager.
   * @param params - The parameters required to connect to Cosmos DB, including endpoint, key, databaseId, and containerId.
   */
  constructor(private params: ICosmosStorageManager) {
    this.client = new CosmosClient({
      endpoint: params.endpoint,
      key: params.key,
    });
    this.log = (log) => console.log(log);
  }

  /**
   * Writes data to the specified path in Cosmos DB.
   * If the document does not exist, it will be created.
   * @param data - The data to write.
   * @param path - The path (ID) of the document to write the data to.
   * @returns A promise that resolves when the operation is complete.
   */
  async write(data: string, path: string): Promise<void> {
    const container = this.client
      .database(this.params.databaseId)
      .container(this.params.containerId);
    await container.items.upsert({
      ...(this.params.appendPreWrite?.(data, path) || {}),
      id: path,
      path,
      data,
      updatedAt: getTimestamp(),
    });
  }

  /**
   * Reads data from the specified path in Cosmos DB.
   * If the document does not exist, it returns a default value.
   * @param path - The path (ID) of the document to read.
   * @param __default - The default value to return if the document does not exist.
   * @returns A promise that resolves to the document data, or the default value if the document does not exist.
   */
  async read(
    path: string,
    __default: string = '',
  ): Promise<{ [key: string]: any; data: string; path: string }> {
    const container = this.client
      .database(this.params.databaseId)
      .container(this.params.containerId);
    const { resource } = await container.item(path, path).read();
    return {
      ...(resource || {}),
      path: resource?.id || path,
      data: resource?.data || __default,
    };
  }

  /**
   * Deletes the document at the specified path in Cosmos DB.
   * @param path - The path (ID) of the document to delete.
   * @returns A promise that resolves when the operation is complete.
   */
  async delete(path: string): Promise<void> {
    try {
      const container = this.client
        .database(this.params.databaseId)
        .container(this.params.containerId);
      await container.item(path, path).delete();
    } catch (e) {
      const message = (e as Error).message;
      if (
        message.includes(
          'Entity with the specified id does not exist in the system.',
        )
      ) {
        return;
      }
      throw e;
    }
  }

  /**
   * Checks if a document exists at the specified path in Cosmos DB.
   * @param path - The path (ID) of the document to check.
   * @returns A promise that resolves to a boolean indicating whether the document exists.
   */
  async exists(path: string): Promise<boolean> {
    const container = this.client
      .database(this.params.databaseId)
      .container(this.params.containerId);
    const { resource } = await container.item(path, path).read();
    return Boolean(resource);
  }
}
