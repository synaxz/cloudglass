import { NextRequest } from 'next/server'
import { SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs'
import { createSQSClient, validateAWSConfig, AWSConfigData } from '@/lib/aws-config'
import { createSuccessResponse, createErrorResponse, handleAPIError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
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
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 1,
      AttributeNames: ['All'],
      MessageAttributeNames: ['All']
    })
    
    const response = await sqsClient.send(command)
    const messages = response.Messages || []
    
    return createSuccessResponse(messages, `Successfully loaded ${messages.length} messages`)
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { config, queueUrl, messageBody } = body

    if (!queueUrl) {
      return createErrorResponse('Queue URL is required', 400)
    }
    
    if (!messageBody?.trim()) {
      return createErrorResponse('Message body is required', 400)
    }

    const validation = validateAWSConfig(config)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const sqsClient = createSQSClient(config)
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: messageBody.trim(),
    })
    
    await sqsClient.send(command)
    return createSuccessResponse(null, 'Successfully sent message to the queue')
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queueUrl = searchParams.get('queueUrl')
    const receiptHandle = searchParams.get('receiptHandle')
    
    if (!queueUrl) {
      return createErrorResponse('Queue URL is required', 400)
    }
    
    if (!receiptHandle) {
      return createErrorResponse('Receipt handle is required', 400)
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
    const command = new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    })
    
    await sqsClient.send(command)
    return createSuccessResponse(null, 'Successfully deleted message from the queue')
  } catch (error) {
    return handleAPIError(error)
  }
}
