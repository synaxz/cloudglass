import { NextRequest, NextResponse } from 'next/server'
import { createSNSClient, validateAWSConfig } from '@/lib/aws-config'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response'
import { 
  ListSubscriptionsByTopicCommand,
  SubscribeCommand,
  UnsubscribeCommand,
  GetSubscriptionAttributesCommand,
  SetSubscriptionAttributesCommand
} from '@aws-sdk/client-sns'

export async function GET(request: NextRequest) {
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
    const command = new ListSubscriptionsByTopicCommand({ TopicArn: topicArn })
    const response = await snsClient.send(command)

    const subscriptions = response.Subscriptions?.map(subscription => ({
      subscriptionArn: subscription.SubscriptionArn,
      protocol: subscription.Protocol,
      endpoint: subscription.Endpoint,
      owner: subscription.Owner,
      topicArn: subscription.TopicArn
    })) || []

    return createSuccessResponse({ subscriptions })
  } catch (error) {
    console.error('Error listing SNS subscriptions:', error)
    return createErrorResponse('Failed to list SNS subscriptions', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topicArn, protocol, endpoint, config: awsConfig } = body

    if (!topicArn?.trim()) {
      return createErrorResponse('Topic ARN is required', 400)
    }

    if (!protocol?.trim()) {
      return createErrorResponse('Protocol is required', 400)
    }

    if (!endpoint?.trim()) {
      return createErrorResponse('Endpoint is required', 400)
    }

    const validation = validateAWSConfig(awsConfig)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const snsClient = createSNSClient(awsConfig)
    const command = new SubscribeCommand({
      TopicArn: topicArn,
      Protocol: protocol,
      Endpoint: endpoint
    })
    const response = await snsClient.send(command)

    return createSuccessResponse({ 
      subscriptionArn: response.SubscriptionArn,
      topicArn: topicArn,
      protocol: protocol,
      endpoint: endpoint
    })
  } catch (error) {
    console.error('Error creating SNS subscription:', error)
    return createErrorResponse('Failed to create SNS subscription', 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subscriptionArn = searchParams.get('subscriptionArn')
    const config = {
      endpoint: searchParams.get('endpoint') || '',
      region: searchParams.get('region') || '',
      accessKey: searchParams.get('accessKey') || '',
      secretKey: searchParams.get('secretKey') || '',
      forcePathStyle: searchParams.get('forcePathStyle') === 'true'
    }

    if (!subscriptionArn) {
      return createErrorResponse('Subscription ARN is required', 400)
    }

    const validation = validateAWSConfig(config)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const snsClient = createSNSClient(config)
    const command = new UnsubscribeCommand({ SubscriptionArn: subscriptionArn })
    await snsClient.send(command)

    return createSuccessResponse({ message: 'Subscription deleted successfully' })
  } catch (error) {
    console.error('Error deleting SNS subscription:', error)
    return createErrorResponse('Failed to delete SNS subscription', 500)
  }
}
