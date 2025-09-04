import { NextRequest, NextResponse } from 'next/server'
import { IAMClient, ListPoliciesCommand, CreatePolicyCommand, DeletePolicyCommand } from '@aws-sdk/client-iam'
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
    const command = new ListPoliciesCommand({
      Scope: 'Local' // Only return customer managed policies
    })
    const response = await iamClient.send(command)

    return createSuccessResponse(
      response.Policies || [],
      `Successfully retrieved ${response.Policies?.length || 0} IAM policies`
    )
  } catch (error) {
    console.error('Error listing IAM policies:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to list IAM policies',
      500
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { config, policyName, policyDocument } = body

    if (!policyName) {
      return createErrorResponse('Policy name is required', 400)
    }

    if (!policyDocument) {
      return createErrorResponse('Policy document is required', 400)
    }

    const validation = validateAWSConfig(config)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    // Validate JSON format
    try {
      JSON.parse(policyDocument)
    } catch (jsonError) {
      return createErrorResponse('Policy document must be valid JSON', 400)
    }

    const iamClient = createIAMClient(config)
    const command = new CreatePolicyCommand({
      PolicyName: policyName,
      PolicyDocument: policyDocument
    })
    const response = await iamClient.send(command)

    return createSuccessResponse(
      response.Policy,
      `Successfully created IAM policy "${policyName}"`
    )
  } catch (error) {
    console.error('Error creating IAM policy:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to create IAM policy',
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
    const policyName = searchParams.get('policyName')

    if (!policyName) {
      return createErrorResponse('Policy name is required', 400)
    }

    const validation = validateAWSConfig(config)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const iamClient = createIAMClient(config)
    const command = new DeletePolicyCommand({
      PolicyArn: `arn:aws:iam::000000000000:policy/${policyName}`
    })
    await iamClient.send(command)

    return createSuccessResponse(
      null,
      `Successfully deleted IAM policy "${policyName}"`
    )
  } catch (error) {
    console.error('Error deleting IAM policy:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to delete IAM policy',
      500
    )
  }
}
