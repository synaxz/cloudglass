import { NextRequest } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { createS3Client, validateAWSConfig, AWSConfigData } from '@/lib/aws-config'
import { createSuccessResponse, createErrorResponse, handleAPIError } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{
    bucket: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { bucket } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File
    const key = formData.get('key') as string
    
    if (!file) {
      return createErrorResponse('File is required', 400)
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
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: file.type,
    })
    
    await s3Client.send(command)
    return createSuccessResponse(null, `Successfully uploaded "${file.name}" to ${bucket}`)
  } catch (error) {
    return handleAPIError(error)
  }
}
