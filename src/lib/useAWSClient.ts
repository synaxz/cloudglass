import { useMemo } from 'react'
import { S3Client } from '@aws-sdk/client-s3'
import { SQSClient } from '@aws-sdk/client-sqs'
import { AWSConfigData } from '@/components/AWSConfig'

export function useS3Client(config: AWSConfigData) {
  return useMemo(() => new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    forcePathStyle: config.forcePathStyle,
  }), [config])
}

export function useSQSClient(config: AWSConfigData) {
  return useMemo(() => new SQSClient({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
  }), [config])
}
