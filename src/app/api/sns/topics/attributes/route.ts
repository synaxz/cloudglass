import { NextRequest, NextResponse } from 'next/server'
import { createSNSClient, validateAWSConfig } from '@/lib/aws-config'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response'
import { 
  GetTopicAttributesCommand,
  SetTopicAttributesCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand
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
    
    // Get topic attributes
    const attributesCommand = new GetTopicAttributesCommand({ TopicArn: topicArn })
    const attributesResponse = await snsClient.send(attributesCommand)

    // Get topic tags
    const tagsCommand = new ListTagsForResourceCommand({ ResourceArn: topicArn })
    const tagsResponse = await snsClient.send(tagsCommand)

    const attributes = attributesResponse.Attributes || {}
    const tags = tagsResponse.Tags?.map(tag => ({
      Key: tag.Key,
      Value: tag.Value
    })) || []

    return createSuccessResponse({ 
      attributes: {
        TopicArn: attributes.TopicArn,
        DisplayName: attributes.DisplayName,
        Policy: attributes.Policy,
        DeliveryPolicy: attributes.DeliveryPolicy,
        EffectiveDeliveryPolicy: attributes.EffectiveDeliveryPolicy,
        KmsMasterKeyId: attributes.KmsMasterKeyId,
        SignatureVersion: attributes.SignatureVersion,
        TracingConfig: attributes.TracingConfig,
        DataProtectionPolicy: attributes.DataProtectionPolicy,
        FifoTopic: attributes.FifoTopic,
        ContentBasedDeduplication: attributes.ContentBasedDeduplication
      },
      tags
    })
  } catch (error) {
    console.error('Error getting SNS topic attributes:', error)
    return createErrorResponse('Failed to get SNS topic attributes', 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      topicArn, 
      attributes, 
      tags,
      config: awsConfig 
    } = body

    if (!topicArn) {
      return createErrorResponse('Topic ARN is required', 400)
    }

    const validation = validateAWSConfig(awsConfig)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const snsClient = createSNSClient(awsConfig)

    // Update topic attributes
    if (attributes && Object.keys(attributes).length > 0) {
      for (const [attributeName, attributeValue] of Object.entries(attributes)) {
        if (attributeValue !== undefined && attributeValue !== null && attributeValue !== '') {
          const setAttributesCommand = new SetTopicAttributesCommand({
            TopicArn: topicArn,
            AttributeName: attributeName,
            AttributeValue: String(attributeValue)
          })
          await snsClient.send(setAttributesCommand)
        }
      }
    }

    // Update tags
    if (tags && Array.isArray(tags)) {
      // First, get existing tags to determine what to remove
      const listTagsCommand = new ListTagsForResourceCommand({ ResourceArn: topicArn })
      const existingTagsResponse = await snsClient.send(listTagsCommand)
      const existingTags = existingTagsResponse.Tags || []

      // Determine tags to remove
      const existingTagKeys = new Set(existingTags.map(tag => tag.Key))
      const newTagKeys = new Set(tags.map(tag => tag.Key))
      const tagsToRemove = Array.from(existingTagKeys).filter(key => !newTagKeys.has(key))

      // Remove tags that are no longer present
      if (tagsToRemove.length > 0) {
        const untagCommand = new UntagResourceCommand({
          ResourceArn: topicArn,
          TagKeys: tagsToRemove
        })
        await snsClient.send(untagCommand)
      }

      // Add or update tags
      if (tags.length > 0) {
        const tagCommand = new TagResourceCommand({
          ResourceArn: topicArn,
          Tags: tags.map(tag => ({
            Key: tag.Key,
            Value: tag.Value
          }))
        })
        await snsClient.send(tagCommand)
      }
    }

    return createSuccessResponse({ message: 'Topic attributes updated successfully' })
  } catch (error) {
    console.error('Error updating SNS topic attributes:', error)
    return createErrorResponse('Failed to update SNS topic attributes', 500)
  }
}
