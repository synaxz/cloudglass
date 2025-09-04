import { NextRequest, NextResponse } from 'next/server'
import { createSNSClient, validateAWSConfig } from '@/lib/aws-config'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response'
import { PublishCommand } from '@aws-sdk/client-sns'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      topicArn, 
      message, 
      subject, 
      messageAttributes,
      config: awsConfig 
    } = body

    if (!topicArn?.trim()) {
      return createErrorResponse('Topic ARN is required', 400)
    }

    if (!message?.trim()) {
      return createErrorResponse('Message is required', 400)
    }

    const validation = validateAWSConfig(awsConfig)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const snsClient = createSNSClient(awsConfig)
    
    const publishParams: any = {
      TopicArn: topicArn,
      Message: message
    }

    if (subject) {
      publishParams.Subject = subject
    }

    if (messageAttributes) {
      publishParams.MessageAttributes = messageAttributes
    }

    const command = new PublishCommand(publishParams)
    const response = await snsClient.send(command)

    return createSuccessResponse({ 
      messageId: response.MessageId,
      topicArn: topicArn,
      message: message,
      subject: subject
    })
  } catch (error) {
    console.error('Error publishing SNS message:', error)
    return createErrorResponse('Failed to publish SNS message', 500)
  }
}
