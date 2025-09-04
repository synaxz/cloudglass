import { S3Client } from '@aws-sdk/client-s3'
import { SQSClient } from '@aws-sdk/client-sqs'
import { SNSClient } from '@aws-sdk/client-sns'
import { IAMClient } from '@aws-sdk/client-iam'

export interface AWSConfigData {
  endpoint: string
  region: string
  accessKey: string
  secretKey: string
  forcePathStyle?: boolean
}

export function createS3Client(config: AWSConfigData): S3Client {
  const clientConfig: Record<string, unknown> = {
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    forcePathStyle: config.forcePathStyle,
  }

  // Disable SSL verification for LocalStack endpoints
  if (config.endpoint.includes('localstack') || config.endpoint.includes('localhost')) {
    clientConfig.requestHandler = {
      httpsAgent: {
        rejectUnauthorized: false
      }
    }
  }

  return new S3Client(clientConfig)
}

export function createSQSClient(config: AWSConfigData): SQSClient {
  const clientConfig: Record<string, unknown> = {
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
  }

  // Disable SSL verification for LocalStack endpoints
  if (config.endpoint.includes('localstack') || config.endpoint.includes('localhost')) {
    clientConfig.requestHandler = {
      httpsAgent: {
        rejectUnauthorized: false
      }
    }
  }

  return new SQSClient(clientConfig)
}

export function createSNSClient(config: AWSConfigData): SNSClient {
  const clientConfig: Record<string, unknown> = {
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
  }

  // Disable SSL verification for LocalStack endpoints
  if (config.endpoint.includes('localstack') || config.endpoint.includes('localhost')) {
    clientConfig.requestHandler = {
      httpsAgent: {
        rejectUnauthorized: false
      }
    }
  }

  return new SNSClient(clientConfig)
}

export function createIAMClient(config: AWSConfigData): IAMClient {
  const clientConfig: Record<string, unknown> = {
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
  }

  // Disable SSL verification for LocalStack endpoints
  if (config.endpoint.includes('localstack') || config.endpoint.includes('localhost')) {
    clientConfig.requestHandler = {
      httpsAgent: {
        rejectUnauthorized: false
      }
    }
  }

  return new IAMClient(clientConfig)
}

export function validateAWSConfig(config: AWSConfigData): { isValid: boolean; error?: string } {
  if (!config.endpoint?.trim()) {
    return { isValid: false, error: 'Endpoint is required' }
  }
  
  if (!config.region?.trim()) {
    return { isValid: false, error: 'Region is required' }
  }
  
  if (!config.accessKey?.trim()) {
    return { isValid: false, error: 'Access Key is required' }
  }
  
  if (!config.secretKey?.trim()) {
    return { isValid: false, error: 'Secret Key is required' }
  }

  // Validate endpoint format
  try {
    new URL(config.endpoint)
  } catch {
    return { isValid: false, error: 'Invalid endpoint URL format' }
  }

  return { isValid: true }
}
