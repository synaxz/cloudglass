import { NextRequest } from 'next/server'
import { ListQueuesCommand, CreateQueueCommand, DeleteQueueCommand, GetQueueAttributesCommand, ListQueueTagsCommand, PurgeQueueCommand } from '@aws-sdk/client-sqs'
import { createSQSClient, validateAWSConfig, AWSConfigData } from '@/lib/aws-config'
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

    const sqsClient = createSQSClient(config)
    const command = new ListQueuesCommand({})
    const response = await sqsClient.send(command)
    
    const queues = []
    
    if (response.QueueUrls) {
      for (const queueUrl of response.QueueUrls) {
        try {
          // Get queue attributes
          const attributesCommand = new GetQueueAttributesCommand({
            QueueUrl: queueUrl,
            AttributeNames: ['All']
          })
          const attributesResponse = await sqsClient.send(attributesCommand)
          
          // Get queue tags
          const tagsCommand = new ListQueueTagsCommand({
            QueueUrl: queueUrl
          })
          const tagsResponse = await sqsClient.send(tagsCommand)
          
          const queueName = queueUrl.split('/').pop() || 'Unknown'
          queues.push({
            QueueUrl: queueUrl,
            QueueName: queueName,
            Attributes: attributesResponse.Attributes,
            Tags: tagsResponse.Tags
          })
        } catch (error) {
          console.error(`Error getting attributes for queue ${queueUrl}:`, error)
          // Add queue with minimal info if we can't get attributes
          const queueName = queueUrl.split('/').pop() || 'Unknown'
          queues.push({
            QueueUrl: queueUrl,
            QueueName: queueName
          })
        }
      }
    }
    
    return createSuccessResponse(queues, `Successfully loaded ${queues.length} queues`)
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { config, queueName, attributes } = body

    if (!queueName?.trim()) {
      return createErrorResponse('Queue name is required', 400)
    }

    const validation = validateAWSConfig(config)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const sqsClient = createSQSClient(config)
    const command = new CreateQueueCommand({
      QueueName: queueName.trim(),
      Attributes: attributes || undefined
    })
    
    await sqsClient.send(command)
    return createSuccessResponse(null, `Successfully created queue "${queueName.trim()}"`)
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queueUrl = searchParams.get('queueUrl')
    
    if (!queueUrl) {
      return createErrorResponse('Queue URL is required', 400)
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

    const sqsClient = createSQSClient(config)
    const command = new DeleteQueueCommand({
      QueueUrl: queueUrl,
    })
    
    await sqsClient.send(command)
    return createSuccessResponse(null, 'Successfully deleted queue')
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queueUrl = searchParams.get('queueUrl')
    const action = searchParams.get('action')
    
    if (!queueUrl) {
      return createErrorResponse('Queue URL is required', 400)
    }
    
    if (action !== 'purge') {
      return createErrorResponse('Invalid action. Only "purge" is supported', 400)
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

    const sqsClient = createSQSClient(config)
    const command = new PurgeQueueCommand({
      QueueUrl: queueUrl,
    })
    
    await sqsClient.send(command)
    return createSuccessResponse(null, 'Successfully purged all messages from the queue')
  } catch (error) {
    return handleAPIError(error)
  }
}
