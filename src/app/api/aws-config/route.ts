import { NextRequest, NextResponse } from 'next/server'
import { AWSConfigData } from '@/components/AWSConfig'

// In-memory storage for demo purposes
// In production, you'd want to use a database like PostgreSQL, MongoDB, or Redis
let awsConfig: AWSConfigData | null = null

const DEFAULT_CONFIG: AWSConfigData = {
  endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
  accessKey: process.env.AWS_ACCESS_KEY_ID || 'test',
  secretKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
  forcePathStyle: true
}

export async function GET() {
  try {
    const config = awsConfig || DEFAULT_CONFIG
    return NextResponse.json({
      success: true,
      data: config,
      message: 'AWS configuration retrieved successfully'
    })
  } catch (error) {
    console.error('Error retrieving AWS config:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve AWS configuration',
      data: null
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the configuration
    const validation = validateAWSConfig(body)
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: validation.error,
        data: null
      }, { status: 400 })
    }

    // Save the configuration
    awsConfig = {
      endpoint: body.endpoint,
      region: body.region,
      accessKey: body.accessKey,
      secretKey: body.secretKey,
      forcePathStyle: body.forcePathStyle || false
    }

    return NextResponse.json({
      success: true,
      data: awsConfig,
      message: 'AWS configuration saved successfully'
    })
  } catch (error) {
    console.error('Error saving AWS config:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to save AWS configuration',
      data: null
    }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    awsConfig = null
    return NextResponse.json({
      success: true,
      data: null,
      message: 'AWS configuration reset to defaults'
    })
  } catch (error) {
    console.error('Error resetting AWS config:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to reset AWS configuration',
      data: null
    }, { status: 500 })
  }
}

function validateAWSConfig(config: unknown): { isValid: boolean; error?: string } {
  const configObj = config as Record<string, unknown>
  
  if (!configObj || typeof configObj !== 'object') {
    return { isValid: false, error: 'Invalid configuration object' }
  }

  if (!configObj.endpoint || typeof configObj.endpoint !== 'string' || !configObj.endpoint.trim()) {
    return { isValid: false, error: 'Endpoint is required' }
  }

  if (!configObj.region || typeof configObj.region !== 'string' || !configObj.region.trim()) {
    return { isValid: false, error: 'Region is required' }
  }

  if (!configObj.accessKey || typeof configObj.accessKey !== 'string' || !configObj.accessKey.trim()) {
    return { isValid: false, error: 'Access Key is required' }
  }

  if (!configObj.secretKey || typeof configObj.secretKey !== 'string' || !configObj.secretKey.trim()) {
    return { isValid: false, error: 'Secret Key is required' }
  }

  // Validate endpoint format
  try {
    new URL(configObj.endpoint as string)
  } catch {
    return { isValid: false, error: 'Invalid endpoint URL format' }
  }

  return { isValid: true }
}
