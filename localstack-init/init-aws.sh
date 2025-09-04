#!/bin/bash

# CloudGlass LocalStack Initialization Script
# This script sets up sample data for all AWS services
# Using LocalStack's built-in initialization hooks

echo "🚀 CloudGlass LocalStack Initialization"
echo "========================================"

# Set AWS credentials for LocalStack
export AWS_ACCESS_KEY_ID=000000000000
export AWS_SECRET_ACCESS_KEY=000000000000
export AWS_DEFAULT_REGION=us-east-1

# Make all scripts executable
chmod +x /etc/localstack/init/ready.d/*.sh

# Run initialization scripts in order
echo ""
echo "📦 Setting up sample data for all AWS services..."
echo ""

# S3 Setup
echo "🪣 Setting up S3 sample data..."
/etc/localstack/init/ready.d/01-s3-setup.sh

echo ""
echo "📬 Setting up SQS sample data..."
/etc/localstack/init/ready.d/02-sqs-setup.sh

echo ""
echo "📢 Setting up SNS sample data..."
/etc/localstack/init/ready.d/03-sns-setup.sh

echo ""
echo "🔐 Setting up IAM sample data..."
/etc/localstack/init/ready.d/04-iam-setup.sh

echo ""
echo "🎉 CloudGlass LocalStack initialization complete!"
echo ""
echo "📊 Summary of created resources:"
echo "   S3 Buckets: 4 (cloudglass-web-assets, cloudglass-app-logs, cloudglass-user-uploads, cloudglass-dev-storage)"
echo "   SQS Queues: 5 (user-notifications, email-processing, order-processing.fifo, dead-letter-queue, background-tasks)"
echo "   SNS Topics: 5 (system-alerts, user-notifications, marketing, security-events, app-events)"
echo "   IAM Users: 4 (admin, developer, readonly, service)"
echo "   IAM Groups: 3 (Admins, Developers, ReadOnly)"
echo "   IAM Policies: 4 (Admin, Developer, ReadOnly, S3)"
echo "   IAM Roles: 2 (Lambda, EC2)"
echo ""
echo "🌐 Access CloudGlass at: http://localhost:3000"
echo "🔍 LocalStack health: http://localhost:4566/_localstack/health"
