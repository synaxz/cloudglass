import { NextRequest } from 'next/server'
import { SetQueueAttributesCommand } from '@aws-sdk/client-sqs'
import { validateAWSConfig, createSQSClient } from '@/lib/aws-config'
import { createSuccessResponse, createErrorResponse, handleAPIError } from '@/lib/api-response'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { config, queueUrl, attributes } = body

    if (!queueUrl) {
      return createErrorResponse('Queue URL is required', 400)
    }

    if (!attributes || Object.keys(attributes).length === 0) {
      return createErrorResponse('At least one attribute is required', 400)
    }

    const validation = validateAWSConfig(config)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const sqsClient = createSQSClient(config)
    const command = new SetQueueAttributesCommand({
      QueueUrl: queueUrl,
      Attributes: attributes
    })
    
    await sqsClient.send(command)
    return createSuccessResponse(null, 'Successfully updated queue attributes')
  } catch (error) {
    return handleAPIError(error)
  }
}
