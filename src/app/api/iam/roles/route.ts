import { NextRequest, NextResponse } from 'next/server'
import { IAMClient, ListRolesCommand, CreateRoleCommand, DeleteRoleCommand } from '@aws-sdk/client-iam'
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
    const command = new ListRolesCommand({})
    const response = await iamClient.send(command)

    return createSuccessResponse(
      response.Roles || [],
      `Successfully retrieved ${response.Roles?.length || 0} IAM roles`
    )
  } catch (error) {
    console.error('Error listing IAM roles:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to list IAM roles',
      500
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { config, roleName, assumeRolePolicyDocument, description } = body

    if (!roleName) {
      return createErrorResponse('Role name is required', 400)
    }

    if (!assumeRolePolicyDocument) {
      return createErrorResponse('Assume role policy document is required', 400)
    }

    const validation = validateAWSConfig(config)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const iamClient = createIAMClient(config)
    const command = new CreateRoleCommand({
      RoleName: roleName,
      AssumeRolePolicyDocument: assumeRolePolicyDocument,
      Description: description
    })
    const response = await iamClient.send(command)

    return createSuccessResponse(
      response.Role,
      `Successfully created IAM role "${roleName}"`
    )
  } catch (error) {
    console.error('Error creating IAM role:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to create IAM role',
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
    const roleName = searchParams.get('roleName')

    if (!roleName) {
      return createErrorResponse('Role name is required', 400)
    }

    const validation = validateAWSConfig(config)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const iamClient = createIAMClient(config)
    const command = new DeleteRoleCommand({
      RoleName: roleName
    })
    await iamClient.send(command)

    return createSuccessResponse(
      null,
      `Successfully deleted IAM role "${roleName}"`
    )
  } catch (error) {
    console.error('Error deleting IAM role:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to delete IAM role',
      500
    )
  }
}
