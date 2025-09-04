import { NextRequest, NextResponse } from 'next/server'
import { createSNSClient, validateAWSConfig } from '@/lib/aws-config'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response'
import { 
  ListTopicsCommand, 
  CreateTopicCommand, 
  DeleteTopicCommand,
  GetTopicAttributesCommand,
  SetTopicAttributesCommand,
  PublishCommand
} from '@aws-sdk/client-sns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const config = {
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

    const snsClient = createSNSClient(config)
    const command = new ListTopicsCommand({})
    const response = await snsClient.send(command)

    const topics = response.Topics?.map(topic => ({
      topicArn: topic.TopicArn,
      name: topic.TopicArn?.split(':').pop() || 'Unknown'
    })) || []

    return createSuccessResponse({ topics })
  } catch (error) {
    console.error('Error listing SNS topics:', error)
    return createErrorResponse('Failed to list SNS topics', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, config: awsConfig } = body

    if (!name?.trim()) {
      return createErrorResponse('Topic name is required', 400)
    }

    const validation = validateAWSConfig(awsConfig)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const snsClient = createSNSClient(awsConfig)
    const command = new CreateTopicCommand({ Name: name })
    const response = await snsClient.send(command)

    return createSuccessResponse({ 
      topicArn: response.TopicArn,
      name: name
    })
  } catch (error) {
    console.error('Error creating SNS topic:', error)
    return createErrorResponse('Failed to create SNS topic', 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const topicArn = searchParams.get('topicArn')
    const config = {
      endpoint: searchParams.get('endpoint') || '',
      region: searchParams.get('region') || '',
      accessKey: searchParams.get('accessKey') || '',
      secretKey: searchParams.get('secretKey') || '',
      forcePathStyle: searchParams.get('forcePathStyle') === 'true'
    }

    if (!topicArn) {
      return createErrorResponse('Topic ARN is required', 400)
    }

    const validation = validateAWSConfig(config)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const snsClient = createSNSClient(config)
    const command = new DeleteTopicCommand({ TopicArn: topicArn })
    await snsClient.send(command)

    return createSuccessResponse({ message: 'Topic deleted successfully' })
  } catch (error) {
    console.error('Error deleting SNS topic:', error)
    return createErrorResponse('Failed to delete SNS topic', 500)
  }
}
