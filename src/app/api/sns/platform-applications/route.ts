import { NextRequest, NextResponse } from 'next/server'
import { createSNSClient, validateAWSConfig } from '@/lib/aws-config'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response'
import { 
  ListPlatformApplicationsCommand,
  CreatePlatformApplicationCommand,
  DeletePlatformApplicationCommand,
  GetPlatformApplicationAttributesCommand,
  SetPlatformApplicationAttributesCommand
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
    const command = new ListPlatformApplicationsCommand({})
    const response = await snsClient.send(command)

    const platformApplications = response.PlatformApplications?.map(app => ({
      PlatformApplicationArn: app.PlatformApplicationArn,
      Platform: app.Platform,
      PlatformCredential: app.PlatformCredential ? '***' : undefined,
      PlatformPrincipal: app.PlatformPrincipal ? '***' : undefined
    })) || []

    return createSuccessResponse({ platformApplications })
  } catch (error) {
    console.error('Error listing SNS platform applications:', error)
    return createErrorResponse('Failed to list SNS platform applications', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      platform, 
      platformCredential, 
      platformPrincipal,
      config: awsConfig 
    } = body

    if (!name?.trim()) {
      return createErrorResponse('Platform application name is required', 400)
    }

    if (!platform?.trim()) {
      return createErrorResponse('Platform is required', 400)
    }

    if (!platformCredential?.trim()) {
      return createErrorResponse('Platform credential is required', 400)
    }

    const validation = validateAWSConfig(awsConfig)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const snsClient = createSNSClient(awsConfig)
    
    const createParams: any = {
      Name: name,
      Platform: platform,
      PlatformCredential: platformCredential
    }

    if (platformPrincipal) {
      createParams.PlatformPrincipal = platformPrincipal
    }

    const command = new CreatePlatformApplicationCommand(createParams)
    const response = await snsClient.send(command)

    return createSuccessResponse({ 
      PlatformApplicationArn: response.PlatformApplicationArn,
      name: name,
      platform: platform
    })
  } catch (error) {
    console.error('Error creating SNS platform application:', error)
    return createErrorResponse('Failed to create SNS platform application', 500)
  }
}

export async function DELETE(request: NextRequest) {
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
    const command = new DeletePlatformApplicationCommand({ 
      PlatformApplicationArn: platformApplicationArn 
    })
    await snsClient.send(command)

    return createSuccessResponse({ message: 'Platform application deleted successfully' })
  } catch (error) {
    console.error('Error deleting SNS platform application:', error)
    return createErrorResponse('Failed to delete SNS platform application', 500)
  }
}
