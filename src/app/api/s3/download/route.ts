import { NextRequest } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createS3Client, validateAWSConfig, AWSConfigData } from '@/lib/aws-config'
import { createSuccessResponse, createErrorResponse, handleAPIError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
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
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
    
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
    return createSuccessResponse({ downloadUrl: url }, `Download URL generated for "${key}"`)
  } catch (error) {
    return handleAPIError(error)
  }
}
