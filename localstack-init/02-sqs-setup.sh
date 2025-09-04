#!/bin/bash

# SQS Sample Data Setup for LocalStack
echo "📬 Setting up SQS sample data..."

# Set AWS credentials for LocalStack
export AWS_ACCESS_KEY_ID=000000000000
export AWS_SECRET_ACCESS_KEY=000000000000
export AWS_DEFAULT_REGION=us-east-1

# Create sample SQS queues
echo "Creating sample SQS queues..."

# User notifications queue
awslocal sqs create-queue --queue-name user-notifications
awslocal sqs set-queue-attributes --queue-url http://localhost:4566/000000000000/user-notifications --attributes VisibilityTimeoutSeconds=30,MessageRetentionPeriod=1209600

# Email processing queue
awslocal sqs create-queue --queue-name email-processing
awslocal sqs set-queue-attributes --queue-url http://localhost:4566/000000000000/email-processing --attributes VisibilityTimeoutSeconds=60,MessageRetentionPeriod=1209600

# Order processing queue (FIFO)
awslocal sqs create-queue --queue-name order-processing.fifo --attributes FifoQueue=true,ContentBasedDeduplication=true

# Dead letter queue
awslocal sqs create-queue --queue-name dead-letter-queue

# Background tasks queue
awslocal sqs create-queue --queue-name background-tasks
awslocal sqs set-queue-attributes --queue-url http://localhost:4566/000000000000/background-tasks --attributes VisibilityTimeoutSeconds=300,MessageRetentionPeriod=1209600

# Create dead letter queue configuration for email-processing
awslocal sqs set-queue-attributes --queue-url http://localhost:4566/000000000000/email-processing --attributes '{"RedrivePolicy":"{\"deadLetterTargetArn\":\"arn:aws:sqs:us-east-1:000000000000:dead-letter-queue\",\"maxReceiveCount\":3}"}'

echo "Adding sample messages to queues..."

# Send sample messages to user-notifications queue
awslocal sqs send-message --queue-url http://localhost:4566/000000000000/user-notifications --message-body '{"type":"welcome","userId":"123","message":"Welcome to CloudGlass!","timestamp":"2024-01-15T10:30:00Z"}'

awslocal sqs send-message --queue-url http://localhost:4566/000000000000/user-notifications --message-body '{"type":"notification","userId":"456","message":"Your AWS service is ready","timestamp":"2024-01-15T10:35:00Z"}'

awslocal sqs send-message --queue-url http://localhost:4566/000000000000/user-notifications --message-body '{"type":"alert","userId":"789","message":"High CPU usage detected","timestamp":"2024-01-15T10:40:00Z"}'

# Send sample messages to email-processing queue
awslocal sqs send-message --queue-url http://localhost:4566/000000000000/email-processing --message-body '{"to":"user@example.com","subject":"Welcome to CloudGlass","template":"welcome","data":{"name":"John Doe"}}'

awslocal sqs send-message --queue-url http://localhost:4566/000000000000/email-processing --message-body '{"to":"admin@example.com","subject":"System Alert","template":"alert","data":{"service":"S3","status":"error"}}'

# Send sample messages to order-processing queue (FIFO)
awslocal sqs send-message --queue-url http://localhost:4566/000000000000/order-processing.fifo --message-body '{"orderId":"ORD-001","customerId":"CUST-123","amount":99.99,"status":"pending"}' --message-group-id="orders" --message-deduplication-id="ORD-001-001"

awslocal sqs send-message --queue-url http://localhost:4566/000000000000/order-processing.fifo --message-body '{"orderId":"ORD-002","customerId":"CUST-456","amount":149.99,"status":"processing"}' --message-group-id="orders" --message-deduplication-id="ORD-002-001"

# Send sample messages to background-tasks queue
awslocal sqs send-message --queue-url http://localhost:4566/000000000000/background-tasks --message-body '{"taskId":"TASK-001","type":"data-export","parameters":{"userId":"123","format":"csv"}}'

awslocal sqs send-message --queue-url http://localhost:4566/000000000000/background-tasks --message-body '{"taskId":"TASK-002","type":"report-generation","parameters":{"reportType":"monthly","date":"2024-01"}}'

awslocal sqs send-message --queue-url http://localhost:4566/000000000000/background-tasks --message-body '{"taskId":"TASK-003","type":"backup","parameters":{"bucket":"cloudglass-backups","retention":"30d"}}'

echo "✅ SQS sample data setup complete!"
echo "   Created queues: user-notifications, email-processing, order-processing.fifo, dead-letter-queue, background-tasks"
echo "   Added sample messages to demonstrate queue functionality"
