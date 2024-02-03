import { config } from 'dotenv';
import { DynamoDbManager } from './dyanmo_db_manager.spec.lib';
import DynamoStorageManager from '../src/storage_manager/dynamo_storage_manager';
config();

const { AWS_ACCESS_KEY, AWS_SECRET_KEY, TEST_DYNAMO_DB_NAME, AWS_REGION } =
  process.env;

const tableName = TEST_DYNAMO_DB_NAME ? `${TEST_DYNAMO_DB_NAME}_dsm` : '';

const dynamoManager = new DynamoDbManager(
  tableName,
  AWS_ACCESS_KEY,
  AWS_SECRET_KEY,
  AWS_REGION,
);

describe('DynamoStorageManager', () => {
  const storageManager = new DynamoStorageManager({
    tableName,
    awsAccessKey: AWS_ACCESS_KEY,
    awsSecretKey: AWS_SECRET_KEY,
    awsRegion: AWS_REGION,
    appendPreWrite: (_data, _path) => ({
      someProps: 'saad',
    }),
  });
  const pathName = '123123.json';

  beforeAll(async () => {
    if (await dynamoManager.doesTableExist()) return;
    await dynamoManager.createTable('path');
    if (!(await dynamoManager.waitForReady(20000))) {
      throw new Error(
        `DynamoDB table=${TEST_DYNAMO_DB_NAME} not ready to be used`,
      );
    }
  }, 40000);

  afterAll(async () => {
    if (!(await dynamoManager.doesTableExist())) return;
    await dynamoManager.deleteTable();
  }, 10000);

  it('should write data to the given path', async () => {
    const toWrite = 'saad-ahmad';
    await storageManager.write(toWrite, pathName);
    const result = await storageManager.exists(pathName);
    expect(result).toBe(true);
  });

  it('should write and maintain the data, path as well as the items from appendPreWrite', async () => {
    const toWrite = 'saad-ahmad';
    await storageManager.write(toWrite, pathName);
    const { path, data, someProps } = await storageManager.read(pathName);
    expect(path).toBe(pathName);
    expect(data).toBe(toWrite);
    expect(someProps).toBe('saad');
  });

  it('should delete the data', async () => {
    const toWrite = 'saad-ahmad';
    await storageManager.write(toWrite, pathName);
    let exists = await storageManager.exists(pathName);
    expect(exists).toBe(true);
    await storageManager.delete(pathName);
    exists = await storageManager.exists(pathName);
    expect(exists).toBe(false);
  });
});
