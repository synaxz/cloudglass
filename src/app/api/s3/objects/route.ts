import { NextRequest } from 'next/server'
import { ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { createS3Client, validateAWSConfig, AWSConfigData } from '@/lib/aws-config'
import { createSuccessResponse, createErrorResponse, handleAPIError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
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
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
    })
    
    const response = await s3Client.send(command)
    const objects = (response.Contents || [])
      .filter(obj => obj.Key)
      .map(obj => ({
        Key: obj.Key!,
        Size: obj.Size || 0,
        LastModified: obj.LastModified || new Date(),
        StorageClass: obj.StorageClass
      }))

    return createSuccessResponse(objects, `Successfully loaded ${objects.length} objects from ${bucketName}`)
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucketName = formData.get('bucketName') as string
    const key = formData.get('key') as string
    
    if (!file) {
      return createErrorResponse('File is required', 400)
    }
    
    if (!bucketName) {
      return createErrorResponse('Bucket name is required', 400)
    }
    
    if (!key) {
      return createErrorResponse('Object key is required', 400)
    }

    const config: AWSConfigData = {
      endpoint: formData.get('endpoint') as string || '',
      region: formData.get('region') as string || '',
      accessKey: formData.get('accessKey') as string || '',
      secretKey: formData.get('secretKey') as string || '',
      forcePathStyle: formData.get('forcePathStyle') === 'true'
    }

    const validation = validateAWSConfig(config)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const s3Client = createS3Client(config)
    
    // Convert File to Buffer for AWS SDK compatibility
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: file.type,
    })
    
    await s3Client.send(command)
    return createSuccessResponse(null, `Successfully uploaded "${file.name}" to ${bucketName}`)
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bucketName = searchParams.get('bucketName')
    const key = searchParams.get('key')
    
    if (!bucketName) {
      return createErrorResponse('Bucket name is required', 400)
    }
    
    if (!key) {
      return createErrorResponse('Object key is required', 400)
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
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
    
    await s3Client.send(command)
    return createSuccessResponse(null, `Successfully deleted "${key}"`)
  } catch (error) {
    return handleAPIError(error)
  }
}
