import { NextRequest } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { createS3Client, validateAWSConfig, AWSConfigData } from '@/lib/aws-config'
import { createErrorResponse, handleAPIError } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{
    bucket: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { bucket } = await params
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    
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
      Bucket: bucket,
      Key: key,
    })
    
    const response = await s3Client.send(command)
    
    if (!response.Body) {
      return createErrorResponse('Object not found or empty', 404)
    }

    // Convert the stream to a buffer
    const chunks: Uint8Array[] = []
    const reader = response.Body.transformToWebStream().getReader()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    
    const buffer = Buffer.concat(chunks)
    
    // Set appropriate headers for file download
    const headers = new Headers()
    headers.set('Content-Type', response.ContentType || 'application/octet-stream')
    headers.set('Content-Length', buffer.length.toString())
    headers.set('Content-Disposition', `attachment; filename="${key.split('/').pop()}"`)
    
    if (response.LastModified) {
      headers.set('Last-Modified', response.LastModified.toUTCString())
    }
    
    if (response.ETag) {
      headers.set('ETag', response.ETag)
    }

    return new Response(buffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    return handleAPIError(error)
  }
}
