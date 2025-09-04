#!/bin/bash

# SNS Sample Data Setup for LocalStack
echo "📢 Setting up SNS sample data..."

# Set AWS credentials for LocalStack
export AWS_ACCESS_KEY_ID=000000000000
export AWS_SECRET_ACCESS_KEY=000000000000
export AWS_DEFAULT_REGION=us-east-1

# Create sample SNS topics
echo "Creating sample SNS topics..."

# System alerts topic
awslocal sns create-topic --name cloudglass-system-alerts

# User notifications topic
awslocal sns create-topic --name cloudglass-user-notifications

# Marketing announcements topic
awslocal sns create-topic --name cloudglass-marketing

# Security events topic
awslocal sns create-topic --name cloudglass-security-events

# Application events topic
awslocal sns create-topic --name cloudglass-app-events

echo "Creating sample subscriptions..."

# Get topic ARNs
SYSTEM_ALERTS_ARN=$(awslocal sns list-topics --query 'Topics[?contains(TopicArn, `cloudglass-system-alerts`)].TopicArn' --output text)
USER_NOTIFICATIONS_ARN=$(awslocal sns list-topics --query 'Topics[?contains(TopicArn, `cloudglass-user-notifications`)].TopicArn' --output text)
MARKETING_ARN=$(awslocal sns list-topics --query 'Topics[?contains(TopicArn, `cloudglass-marketing`)].TopicArn' --output text)
SECURITY_EVENTS_ARN=$(awslocal sns list-topics --query 'Topics[?contains(TopicArn, `cloudglass-security-events`)].TopicArn' --output text)
APP_EVENTS_ARN=$(awslocal sns list-topics --query 'Topics[?contains(TopicArn, `cloudglass-app-events`)].TopicArn' --output text)

# Create subscriptions for system alerts
awslocal sns subscribe --topic-arn $SYSTEM_ALERTS_ARN --protocol email --endpoint admin@cloudglass.com
awslocal sns subscribe --topic-arn $SYSTEM_ALERTS_ARN --protocol sqs --endpoint arn:aws:sqs:us-east-1:000000000000:user-notifications

# Create subscriptions for user notifications
awslocal sns subscribe --topic-arn $USER_NOTIFICATIONS_ARN --protocol email --endpoint user@example.com
awslocal sns subscribe --topic-arn $USER_NOTIFICATIONS_ARN --protocol sms --endpoint +1234567890

# Create subscriptions for marketing
awslocal sns subscribe --topic-arn $MARKETING_ARN --protocol email --endpoint subscriber@example.com
awslocal sns subscribe --topic-arn $MARKETING_ARN --protocol email --endpoint newsletter@example.com

# Create subscriptions for security events
awslocal sns subscribe --topic-arn $SECURITY_EVENTS_ARN --protocol email --endpoint security@cloudglass.com
awslocal sns subscribe --topic-arn $SECURITY_EVENTS_ARN --protocol sqs --endpoint arn:aws:sqs:us-east-1:000000000000:dead-letter-queue

# Create subscriptions for app events
awslocal sns subscribe --topic-arn $APP_EVENTS_ARN --protocol email --endpoint dev@cloudglass.com
awslocal sns subscribe --topic-arn $APP_EVENTS_ARN --protocol sqs --endpoint arn:aws:sqs:us-east-1:000000000000:background-tasks

echo "Publishing sample messages to topics..."

# Publish sample messages to system alerts
awslocal sns publish --topic-arn $SYSTEM_ALERTS_ARN --subject "High CPU Usage Alert" --message "CPU usage on server web-01 has exceeded 80% for the last 5 minutes. Current usage: 85%"

awslocal sns publish --topic-arn $SYSTEM_ALERTS_ARN --subject "Disk Space Warning" --message "Disk space on server db-01 is running low. Current usage: 90% (9GB used of 10GB total)"

# Publish sample messages to user notifications
awslocal sns publish --topic-arn $USER_NOTIFICATIONS_ARN --subject "Welcome to CloudGlass!" --message "Thank you for signing up! Your account has been created successfully. Start exploring AWS services with our intuitive interface."

awslocal sns publish --topic-arn $USER_NOTIFICATIONS_ARN --subject "Service Status Update" --message "All AWS services are operating normally. No issues detected in the last 24 hours."

# Publish sample messages to marketing
awslocal sns publish --topic-arn $MARKETING_ARN --subject "New Features Available!" --message "Check out our latest updates: Dark mode support, improved S3 management, and enhanced security features. Upgrade your CloudGlass experience today!"

# Publish sample messages to security events
awslocal sns publish --topic-arn $SECURITY_EVENTS_ARN --subject "Security Alert: Unusual Login Activity" --message "Multiple failed login attempts detected from IP 192.168.1.100. Please review your account security settings."

awslocal sns publish --topic-arn $SECURITY_EVENTS_ARN --subject "Security Update Required" --message "A critical security update is available for your CloudGlass installation. Please update to version 2.1.0 as soon as possible."

# Publish sample messages to app events
awslocal sns publish --topic-arn $APP_EVENTS_ARN --subject "Application Deployed" --message "CloudGlass application version 2.1.0 has been successfully deployed to production environment."

awslocal sns publish --topic-arn $APP_EVENTS_ARN --subject "Database Migration Completed" --message "Database migration from v1.5 to v2.0 has been completed successfully. All data has been migrated and verified."

echo "✅ SNS sample data setup complete!"
echo "   Created topics: cloudglass-system-alerts, cloudglass-user-notifications, cloudglass-marketing, cloudglass-security-events, cloudglass-app-events"
echo "   Created subscriptions for email, SMS, and SQS endpoints"
echo "   Published sample messages to demonstrate topic functionality"
