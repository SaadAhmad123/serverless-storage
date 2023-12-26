# A Unified Interface for Cloud-Based Storage and Lock Management

`unified-serverless-storage` is a versatile TypeScript library designed to simplify interactions with cloud-based storage systems like AWS, GCP, and Azure. Its primary goal is to provide a standardized interface for reading, writing, and deleting data, along with robust lock management to ensure data integrity during concurrent operations. This library is especially useful for developers working with serverless architectures who need to interface with various cloud storage providers.

## Installation
You can install it via NPM or YARN
```bash
npm install unified-serverless-storage
```

```bash
yarn add unified-serverless-storage
```

## Key Features

### Standardized Interfaces
- `IStorageManager`: The foundational interface for all storage managers. It outlines the necessary methods for any storage management operation.
- `ILockingManager`: Defines the basic structure for implementing locking mechanisms to prevent concurrent access issues.
- `ILockableStorageManager`: Combines storage and locking functionalities to provide a cohesive management interface.

### Extensible Design
- **Support for Additional Managers**:
   The library's architecture is deliberately flexible, allowing for easy integration of new storage and lock managers as they become necessary. This design choice ensures that developers can swiftly adapt the library to accommodate evolving storage needs and technologies.
- **Cross-Cloud Service Compatibility**:
   A key strength of `unified-serverless-storage` is its ability to maintain compatibility across various cloud platforms. This ensures that the library can serve as a universal interface for cloud storage operations, simplifying the development process for applications that span multiple cloud environments.

### Implemented Classes
- `LocalFileStorageManager`: Manages storage operations on the local file system, providing a reliable and easy-to-use interface for local storage handling.
- `S3StorageManager`: A specialized storage manager designed to interact seamlessly with AWS S3 buckets, offering robust and scalable cloud storage solutions.
- `DynamoLockingManager`: Implements lock management using AWS DynamoDB, ensuring safe and efficient handling of locks in distributed systems.
- `LockableStorageManager`: An all-encompassing manager that integrates storage and locking functionalities, providing a unified interface for managing lockable storage resources.

### Usage Example
```typescript
const localStore = new LocalFileStorageManager("./root_storage_dir_of_choice");
const s3Store = new S3StorageManager(/* AWS S3 configuration */);
const dynamoLocking = new DynamoLockingManager(/* DynamoDB configuration */);

const localLockableManager = new LockableStorageManager({
    storageManager: localStore,
    lockingManager: dynamoLocking
});

const s3LockableManager = new LockableStorageManager({
    storageManager: s3Store,
    lockingManager: dynamoLocking
});
```

### Utility Functions
- `AcquireLockError`: A custom error type that is thrown when acquiring a lock fails, providing detailed error information and troubleshooting guidance.
- `waitForTime`: A utility function that pauses execution for a specified amount of time, useful in implementing delays or timeouts in storage operations.
- `acquireLock`: A critical utility that attempts to acquire a lock on a resource, ensuring that only one operation can proceed at a time, thus preventing race conditions and data corruption.

### Future Enhancements
- Plans to integrate more storage solutions like Azure and Google Cloud.
- Open to contributions and feedback for further development.

## Terraform

### S3 bucket storage
```hcl
resource "aws_s3_bucket" "my_bucket" {
  bucket = "my-unique-bucket-name" # Change to your unique bucket name
}

resource "aws_iam_policy" "my_bucket" {
  name        = "my-bucket-policy"
  description = "Policy for read/write access to the S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ],
        Effect = "Allow",
        Resource = [
          "${aws_s3_bucket.my_bucket.arn}/*" # Granting access to all objects in the bucket
        ]
      },
      {
        Action = [
          "s3:ListBucket"
        ],
        Effect = "Allow",
        Resource = [
          aws_s3_bucket.my_bucket.arn
        ]
      }
    ]
  })
}
```

### DynamoDB locking manager
```hcl
resource "aws_dynamodb_table" "locking_table" {
  name           = "lockingTable"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  attribute {
    name = "id"
    type = "S"  # 'S' denotes a string type
  }
  ttl {
    attribute_name = "expireAt"
    enabled        = true
  }
  tags = {
    Name        = "LockingTable"
    Environment = "Production"
  }
}

resource "aws_iam_policy" "dynamodb_locking_policy" {
  name        = "DynamoDBLockingPolicy"
  description = "IAM policy for accessing DynamoDB Locking Table"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:DescribeTable"
        ],
        Resource = aws_dynamodb_table.locking_table.arn
      }
    ]
  })
}
```


## Contributing and Feedback
We encourage contributions to expand the library's capabilities, such as adding new storage backends, enhancing locking strategies, and refining documentation. If you have questions, suggestions, or feedback, feel free to open an issue in the GitHub repository.

## License
`unified-serverless-storage` is available under the MIT License. For more details, refer to the [LICENSE.md](/LICENSE.md) file in the project repository.
