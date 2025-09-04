import { NextRequest, NextResponse } from 'next/server'
import { createSNSClient, validateAWSConfig } from '@/lib/aws-config'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response'
import { 
  ListEndpointsByPlatformApplicationCommand,
  CreatePlatformEndpointCommand,
  DeleteEndpointCommand,
  GetEndpointAttributesCommand,
  SetEndpointAttributesCommand
} from '@aws-sdk/client-sns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platformApplicationArn = searchParams.get('platformApplicationArn')
    const config = {
      endpoint: searchParams.get('endpoint') || '',
      region: searchParams.get('region') || '',
      accessKey: searchParams.get('accessKey') || '',
      secretKey: searchParams.get('secretKey') || '',
      forcePathStyle: searchParams.get('forcePathStyle') === 'true'
    }

    if (!platformApplicationArn) {
      return createErrorResponse('Platform application ARN is required', 400)
    }

    const validation = validateAWSConfig(config)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const snsClient = createSNSClient(config)
    const command = new ListEndpointsByPlatformApplicationCommand({ 
      PlatformApplicationArn: platformApplicationArn 
    })
    const response = await snsClient.send(command)

    const endpoints = response.Endpoints?.map(endpoint => ({
      EndpointArn: endpoint.EndpointArn,
      Attributes: endpoint.Attributes
    })) || []

    return createSuccessResponse({ endpoints })
  } catch (error) {
    console.error('Error listing SNS platform endpoints:', error)
    return createErrorResponse('Failed to list SNS platform endpoints', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      platformApplicationArn,
      token,
      customUserData,
      config: awsConfig 
    } = body

    if (!platformApplicationArn?.trim()) {
      return createErrorResponse('Platform application ARN is required', 400)
    }

    if (!token?.trim()) {
      return createErrorResponse('Token is required', 400)
    }

    const validation = validateAWSConfig(awsConfig)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const snsClient = createSNSClient(awsConfig)
    
    const createParams: any = {
      PlatformApplicationArn: platformApplicationArn,
      Token: token
    }

    if (customUserData) {
      createParams.CustomUserData = customUserData
    }

    const command = new CreatePlatformEndpointCommand(createParams)
    const response = await snsClient.send(command)

    return createSuccessResponse({ 
      EndpointArn: response.EndpointArn,
      platformApplicationArn: platformApplicationArn,
      token: token
    })
  } catch (error) {
    console.error('Error creating SNS platform endpoint:', error)
    return createErrorResponse('Failed to create SNS platform endpoint', 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpointArn = searchParams.get('endpointArn')
    const config = {
      endpoint: searchParams.get('endpoint') || '',
      region: searchParams.get('region') || '',
      accessKey: searchParams.get('accessKey') || '',
      secretKey: searchParams.get('secretKey') || '',
      forcePathStyle: searchParams.get('forcePathStyle') === 'true'
    }

    if (!endpointArn) {
      return createErrorResponse('Endpoint ARN is required', 400)
    }

    const validation = validateAWSConfig(config)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const snsClient = createSNSClient(config)
    const command = new DeleteEndpointCommand({ EndpointArn: endpointArn })
    await snsClient.send(command)

    return createSuccessResponse({ message: 'Platform endpoint deleted successfully' })
  } catch (error) {
    console.error('Error deleting SNS platform endpoint:', error)
    return createErrorResponse('Failed to delete SNS platform endpoint', 500)
  }
}
