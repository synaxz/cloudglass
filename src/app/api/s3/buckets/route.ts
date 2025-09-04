import { NextRequest } from 'next/server'
import { ListBucketsCommand, CreateBucketCommand, DeleteBucketCommand } from '@aws-sdk/client-s3'
import { createS3Client, validateAWSConfig, AWSConfigData } from '@/lib/aws-config'
import { createSuccessResponse, createErrorResponse, handleAPIError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const config: AWSConfigData = {
      endpoint: searchParams.get('endpoint') || '',
      region: searchParams.get('region') || '',
      accessKey: searchParams.get('accessKey') || '',
      secretKey: searchParams.get('secretKey') || '',
      forcePathStyle: searchParams.get('forcePathStyle') === 'true'
    }

    const validation = validateAWSConfig(config)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const s3Client = createS3Client(config)
    const command = new ListBucketsCommand({})
    const response = await s3Client.send(command)
    
    const buckets = (response.Buckets || [])
      .filter(bucket => bucket.Name)
      .map(bucket => ({
        Name: bucket.Name!,
        CreationDate: bucket.CreationDate || new Date()
      }))

    return createSuccessResponse(buckets, `Successfully loaded ${buckets.length} buckets`)
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { config, bucketName } = body

    if (!bucketName?.trim()) {
      return createErrorResponse('Bucket name is required', 400)
    }

    const validation = validateAWSConfig(config)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const s3Client = createS3Client(config)
    const command = new CreateBucketCommand({
      Bucket: bucketName.trim(),
    })
    
    await s3Client.send(command)
    return createSuccessResponse(null, `Successfully created bucket "${bucketName.trim()}"`)
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bucketName = searchParams.get('bucketName')
    
    if (!bucketName) {
      return createErrorResponse('Bucket name is required', 400)
    }

    const config: AWSConfigData = {
      endpoint: searchParams.get('endpoint') || '',
      region: searchParams.get('region') || '',
      accessKey: searchParams.get('accessKey') || '',
      secretKey: searchParams.get('secretKey') || '',
      forcePathStyle: searchParams.get('forcePathStyle') === 'true'
    }

    const validation = validateAWSConfig(config)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const s3Client = createS3Client(config)
    const command = new DeleteBucketCommand({
      Bucket: bucketName,
    })
    
    await s3Client.send(command)
    return createSuccessResponse(null, `Successfully deleted bucket "${bucketName}"`)
  } catch (error) {
    return handleAPIError(error)
  }
}
