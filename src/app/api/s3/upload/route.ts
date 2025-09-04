import { NextRequest } from 'next/server'
import { Upload } from '@aws-sdk/lib-storage'
import { createS3Client, validateAWSConfig, AWSConfigData } from '@/lib/aws-config'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucketName = formData.get('bucketName') as string
    const key = formData.get('key') as string
    
    if (!file) {
      return new Response(JSON.stringify({ success: false, error: 'File is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    if (!bucketName) {
      return new Response(JSON.stringify({ success: false, error: 'Bucket name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    if (!key) {
      return new Response(JSON.stringify({ success: false, error: 'Object key is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
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
      return new Response(JSON.stringify({ success: false, error: validation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const s3Client = createS3Client(config)
    
    // Convert File to Buffer for AWS SDK compatibility
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    
    // Use AWS SDK's Upload class for progress tracking
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: file.type,
      },
    })

    // Create a readable stream for progress updates
    const stream = new ReadableStream({
      start(controller) {
        upload.on('httpUploadProgress', (progress) => {
          const percentage = Math.round((progress.loaded! / progress.total!) * 100)
          const progressData = JSON.stringify({
            type: 'progress',
            loaded: progress.loaded,
            total: progress.total,
            percentage: percentage
          })
          controller.enqueue(new TextEncoder().encode(`data: ${progressData}\n\n`))
        })

        upload.done()
          .then(() => {
            const successData = JSON.stringify({
              type: 'complete',
              success: true,
              message: `Successfully uploaded "${file.name}" to ${bucketName}`
            })
            controller.enqueue(new TextEncoder().encode(`data: ${successData}\n\n`))
            controller.close()
          })
          .catch((error) => {
            const errorData = JSON.stringify({
              type: 'error',
              success: false,
              error: error.message || 'Upload failed'
            })
            controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`))
            controller.close()
          })
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
