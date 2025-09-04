#!/bin/bash

# IAM Sample Data Setup for LocalStack
echo "🔐 Setting up IAM sample data..."

# Set AWS credentials for LocalStack
export AWS_ACCESS_KEY_ID=000000000000
export AWS_SECRET_ACCESS_KEY=000000000000
export AWS_DEFAULT_REGION=us-east-1

# Create sample IAM users
echo "Creating sample IAM users..."

# Admin user
awslocal iam create-user --user-name cloudglass-admin
awslocal iam create-login-profile --user-name cloudglass-admin --password CloudGlass2024! --password-reset-required

# Developer user
awslocal iam create-user --user-name cloudglass-developer
awslocal iam create-login-profile --user-name cloudglass-developer --password DevPass2024! --password-reset-required

# Read-only user
awslocal iam create-user --user-name cloudglass-readonly
awslocal iam create-login-profile --user-name cloudglass-readonly --password ReadOnly2024! --password-reset-required

# Service account user
awslocal iam create-user --user-name cloudglass-service

echo "Creating sample IAM groups..."

# Admin group
awslocal iam create-group --group-name CloudGlassAdmins

# Developer group
awslocal iam create-group --group-name CloudGlassDevelopers

# Read-only group
awslocal iam create-group --group-name CloudGlassReadOnly

# Add users to groups
awslocal iam add-user-to-group --user-name cloudglass-admin --group-name CloudGlassAdmins
awslocal iam add-user-to-group --user-name cloudglass-developer --group-name CloudGlassDevelopers
awslocal iam add-user-to-group --user-name cloudglass-readonly --group-name CloudGlassReadOnly

echo "Creating sample IAM policies..."

# Admin policy
cat > /tmp/cloudglass-admin-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "*",
            "Resource": "*"
        }
    ]
}
EOF

awslocal iam create-policy --policy-name CloudGlassAdminPolicy --policy-document file:///tmp/cloudglass-admin-policy.json

# Developer policy
cat > /tmp/cloudglass-developer-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:*",
                "sqs:*",
                "sns:*",
                "iam:GetUser",
                "iam:ListUsers",
                "iam:ListGroups",
                "iam:ListPolicies"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Deny",
            "Action": [
                "iam:DeleteUser",
                "iam:DeleteGroup",
                "iam:DeletePolicy"
            ],
            "Resource": "*"
        }
    ]
}
EOF

awslocal iam create-policy --policy-name CloudGlassDeveloperPolicy --policy-document file:///tmp/cloudglass-developer-policy.json

# Read-only policy
cat > /tmp/cloudglass-readonly-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket",
                "sqs:GetQueueAttributes",
                "sqs:ListQueues",
                "sqs:ReceiveMessage",
                "sns:ListTopics",
                "sns:GetTopicAttributes",
                "sns:ListSubscriptions",
                "iam:GetUser",
                "iam:ListUsers",
                "iam:ListGroups",
                "iam:ListPolicies"
            ],
            "Resource": "*"
        }
    ]
}
EOF

awslocal iam create-policy --policy-name CloudGlassReadOnlyPolicy --policy-document file:///tmp/cloudglass-readonly-policy.json

# S3 specific policy
cat > /tmp/cloudglass-s3-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::cloudglass-*",
                "arn:aws:s3:::cloudglass-*/*"
            ]
        }
    ]
}
EOF

awslocal iam create-policy --policy-name CloudGlassS3Policy --policy-document file:///tmp/cloudglass-s3-policy.json

# Attach policies to groups
ADMIN_POLICY_ARN=$(awslocal iam list-policies --query 'Policies[?PolicyName==`CloudGlassAdminPolicy`].Arn' --output text)
DEVELOPER_POLICY_ARN=$(awslocal iam list-policies --query 'Policies[?PolicyName==`CloudGlassDeveloperPolicy`].Arn' --output text)
READONLY_POLICY_ARN=$(awslocal iam list-policies --query 'Policies[?PolicyName==`CloudGlassReadOnlyPolicy`].Arn' --output text)
S3_POLICY_ARN=$(awslocal iam list-policies --query 'Policies[?PolicyName==`CloudGlassS3Policy`].Arn' --output text)

awslocal iam attach-group-policy --group-name CloudGlassAdmins --policy-arn $ADMIN_POLICY_ARN
awslocal iam attach-group-policy --group-name CloudGlassDevelopers --policy-arn $DEVELOPER_POLICY_ARN
awslocal iam attach-group-policy --group-name CloudGlassDevelopers --policy-arn $S3_POLICY_ARN
awslocal iam attach-group-policy --group-name CloudGlassReadOnly --policy-arn $READONLY_POLICY_ARN

echo "Creating sample IAM roles..."

# Lambda execution role
cat > /tmp/lambda-trust-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

awslocal iam create-role --role-name CloudGlassLambdaRole --assume-role-policy-document file:///tmp/lambda-trust-policy.json

# EC2 instance role
cat > /tmp/ec2-trust-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

awslocal iam create-role --role-name CloudGlassEC2Role --assume-role-policy-document file:///tmp/ec2-trust-policy.json

# Attach policies to roles
awslocal iam attach-role-policy --role-name CloudGlassLambdaRole --policy-arn $S3_POLICY_ARN
awslocal iam attach-role-policy --role-name CloudGlassEC2Role --policy-arn $READONLY_POLICY_ARN

echo "Creating access keys for service account..."

# Create access key for service account
awslocal iam create-access-key --user-name cloudglass-service

echo "Creating instance profile for EC2 role..."

# Create instance profile
awslocal iam create-instance-profile --instance-profile-name CloudGlassEC2InstanceProfile
awslocal iam add-role-to-instance-profile --instance-profile-name CloudGlassEC2InstanceProfile --role-name CloudGlassEC2Role

# Clean up temporary files
rm -f /tmp/cloudglass-admin-policy.json /tmp/cloudglass-developer-policy.json /tmp/cloudglass-readonly-policy.json /tmp/cloudglass-s3-policy.json /tmp/lambda-trust-policy.json /tmp/ec2-trust-policy.json

echo "✅ IAM sample data setup complete!"
echo "   Created users: cloudglass-admin, cloudglass-developer, cloudglass-readonly, cloudglass-service"
echo "   Created groups: CloudGlassAdmins, CloudGlassDevelopers, CloudGlassReadOnly"
echo "   Created policies: CloudGlassAdminPolicy, CloudGlassDeveloperPolicy, CloudGlassReadOnlyPolicy, CloudGlassS3Policy"
echo "   Created roles: CloudGlassLambdaRole, CloudGlassEC2Role"
echo "   Created instance profile: CloudGlassEC2InstanceProfile"
