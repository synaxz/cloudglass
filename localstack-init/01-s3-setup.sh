#!/bin/bash

# S3 Sample Data Setup for LocalStack
echo "🪣 Setting up S3 sample data..."

# Set AWS credentials for LocalStack
export AWS_ACCESS_KEY_ID=000000000000
export AWS_SECRET_ACCESS_KEY=000000000000
export AWS_DEFAULT_REGION=us-east-1

# Create sample S3 buckets
echo "Creating sample S3 buckets..."

# Web assets bucket
awslocal s3 mb s3://cloudglass-web-assets
awslocal s3api put-bucket-tagging --bucket cloudglass-web-assets --tagging 'TagSet=[{Key=Environment,Value=Production},{Key=Project,Value=CloudGlass}]'

# Application logs bucket
awslocal s3 mb s3://cloudglass-app-logs
awslocal s3api put-bucket-tagging --bucket cloudglass-app-logs --tagging 'TagSet=[{Key=Environment,Value=Production},{Key=Purpose,Value=Logs}]'

# User uploads bucket
awslocal s3 mb s3://cloudglass-user-uploads
awslocal s3api put-bucket-tagging --bucket cloudglass-user-uploads --tagging 'TagSet=[{Key=Environment,Value=Production},{Key=Purpose,Value=UserData}]'

# Development bucket
awslocal s3 mb s3://cloudglass-dev-storage
awslocal s3api put-bucket-tagging --bucket cloudglass-dev-storage --tagging 'TagSet=[{Key=Environment,Value=Development},{Key=Project,Value=CloudGlass}]'

# Create sample objects in web-assets bucket
echo "Adding sample objects to web-assets bucket..."

# Create sample files
echo '<!DOCTYPE html>
<html>
<head>
    <title>CloudGlass Sample</title>
</head>
<body>
    <h1>Welcome to CloudGlass</h1>
    <p>This is a sample HTML file in S3.</p>
</body>
</html>' > /tmp/index.html

echo '{
  "name": "cloudglass-sample",
  "version": "1.0.0",
  "description": "Sample configuration file",
  "settings": {
    "theme": "dark",
    "language": "en"
  }
}' > /tmp/config.json

echo 'console.log("CloudGlass Sample JavaScript");
function greet() {
    return "Hello from CloudGlass!";
}' > /tmp/app.js

# Upload files to S3
awslocal s3 cp /tmp/index.html s3://cloudglass-web-assets/index.html
awslocal s3 cp /tmp/config.json s3://cloudglass-web-assets/config.json
awslocal s3 cp /tmp/app.js s3://cloudglass-web-assets/js/app.js

# Create folder structure
awslocal s3 cp /tmp/index.html s3://cloudglass-web-assets/docs/readme.html
awslocal s3 cp /tmp/config.json s3://cloudglass-web-assets/api/v1/config.json

# Create sample objects in app-logs bucket
echo "Adding sample log files..."

echo '2024-01-15 10:30:15 INFO Application started successfully
2024-01-15 10:30:16 INFO Database connection established
2024-01-15 10:30:17 INFO User authentication service initialized
2024-01-15 10:30:18 INFO API server listening on port 3000' > /tmp/app.log

echo '2024-01-15 10:35:22 ERROR Database connection timeout
2024-01-15 10:35:23 WARN Retrying database connection...
2024-01-15 10:35:25 INFO Database connection restored' > /tmp/error.log

awslocal s3 cp /tmp/app.log s3://cloudglass-app-logs/2024/01/15/app.log
awslocal s3 cp /tmp/error.log s3://cloudglass-app-logs/2024/01/15/error.log

# Create sample objects in user-uploads bucket
echo "Adding sample user uploads..."

echo 'This is a sample document uploaded by a user.' > /tmp/document.txt
echo 'Sample image data (base64 encoded)' > /tmp/image.jpg

awslocal s3 cp /tmp/document.txt s3://cloudglass-user-uploads/user123/documents/sample.txt
awslocal s3 cp /tmp/image.jpg s3://cloudglass-user-uploads/user123/images/profile.jpg

# Clean up temporary files
rm -f /tmp/index.html /tmp/config.json /tmp/app.js /tmp/app.log /tmp/error.log /tmp/document.txt /tmp/image.jpg

echo "✅ S3 sample data setup complete!"
echo "   Created buckets: cloudglass-web-assets, cloudglass-app-logs, cloudglass-user-uploads, cloudglass-dev-storage"
