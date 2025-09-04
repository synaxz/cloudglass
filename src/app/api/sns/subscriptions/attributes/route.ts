import { NextRequest, NextResponse } from 'next/server'
import { createSNSClient, validateAWSConfig } from '@/lib/aws-config'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response'
import { 
  GetSubscriptionAttributesCommand,
  SetSubscriptionAttributesCommand
} from '@aws-sdk/client-sns'

export async function GET(request: NextRequest) {
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
    const command = new GetSubscriptionAttributesCommand({ 
      SubscriptionArn: subscriptionArn 
    })
    const response = await snsClient.send(command)

    const attributes = response.Attributes || {}

    return createSuccessResponse({ 
      attributes: {
        SubscriptionArn: attributes.SubscriptionArn,
        TopicArn: attributes.TopicArn,
        Protocol: attributes.Protocol,
        Endpoint: attributes.Endpoint,
        Owner: attributes.Owner,
        RawMessageDelivery: attributes.RawMessageDelivery,
        FilterPolicy: attributes.FilterPolicy,
        FilterPolicyScope: attributes.FilterPolicyScope,
        DeliveryPolicy: attributes.DeliveryPolicy,
        EffectiveDeliveryPolicy: attributes.EffectiveDeliveryPolicy,
        RedrivePolicy: attributes.RedrivePolicy,
        ConfirmationWasAuthenticated: attributes.ConfirmationWasAuthenticated,
        PendingConfirmation: attributes.PendingConfirmation
      }
    })
  } catch (error) {
    console.error('Error getting SNS subscription attributes:', error)
    return createErrorResponse('Failed to get SNS subscription attributes', 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      subscriptionArn, 
      attributes,
      config: awsConfig 
    } = body

    if (!subscriptionArn) {
      return createErrorResponse('Subscription ARN is required', 400)
    }

    const validation = validateAWSConfig(awsConfig)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const snsClient = createSNSClient(awsConfig)

    // Update subscription attributes
    if (attributes && Object.keys(attributes).length > 0) {
      for (const [attributeName, attributeValue] of Object.entries(attributes)) {
        if (attributeValue !== undefined && attributeValue !== null && attributeValue !== '') {
          const setAttributesCommand = new SetSubscriptionAttributesCommand({
            SubscriptionArn: subscriptionArn,
            AttributeName: attributeName,
            AttributeValue: String(attributeValue)
          })
          await snsClient.send(setAttributesCommand)
        }
      }
    }

    return createSuccessResponse({ message: 'Subscription attributes updated successfully' })
  } catch (error) {
    console.error('Error updating SNS subscription attributes:', error)
    return createErrorResponse('Failed to update SNS subscription attributes', 500)
  }
}
