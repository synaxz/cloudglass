import { NextRequest, NextResponse } from 'next/server'
import { IAMClient, ListUsersCommand, CreateUserCommand, DeleteUserCommand } from '@aws-sdk/client-iam'
import { createIAMClient, validateAWSConfig } from '@/lib/aws-config'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response'

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

    const iamClient = createIAMClient(config)
    const command = new ListUsersCommand({})
    const response = await iamClient.send(command)

    return createSuccessResponse(
      response.Users || [],
      `Successfully retrieved ${response.Users?.length || 0} IAM users`
    )
  } catch (error) {
    console.error('Error listing IAM users:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to list IAM users',
      500
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { config, userName } = body

    if (!userName) {
      return createErrorResponse('User name is required', 400)
    }

    const validation = validateAWSConfig(config)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const iamClient = createIAMClient(config)
    const command = new CreateUserCommand({
      UserName: userName
    })
    const response = await iamClient.send(command)

    return createSuccessResponse(
      response.User,
      `Successfully created IAM user "${userName}"`
    )
  } catch (error) {
    console.error('Error creating IAM user:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to create IAM user',
      500
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const config = {
      endpoint: searchParams.get('endpoint') || '',
      region: searchParams.get('region') || '',
      accessKey: searchParams.get('accessKey') || '',
      secretKey: searchParams.get('secretKey') || '',
      forcePathStyle: searchParams.get('forcePathStyle') === 'true'
    }
    const userName = searchParams.get('userName')

    if (!userName) {
      return createErrorResponse('User name is required', 400)
    }

    const validation = validateAWSConfig(config)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const iamClient = createIAMClient(config)
    const command = new DeleteUserCommand({
      UserName: userName
    })
    await iamClient.send(command)

    return createSuccessResponse(
      null,
      `Successfully deleted IAM user "${userName}"`
    )
  } catch (error) {
    console.error('Error deleting IAM user:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to delete IAM user',
      500
    )
  }
}
