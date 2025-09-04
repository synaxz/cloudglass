import { NextResponse } from 'next/server'

export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export function createSuccessResponse<T>(data: T, message?: string): NextResponse<APIResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message
  })
}

export function createErrorResponse(error: string, status: number = 400): NextResponse<APIResponse> {
  return NextResponse.json({
    success: false,
    error
  }, { status })
}

export function createValidationErrorResponse(errors: string[]): NextResponse<APIResponse> {
  return NextResponse.json({
    success: false,
    error: 'Validation failed',
    data: { errors }
  }, { status: 400 })
}

export function handleAPIError(error: unknown): NextResponse<APIResponse> {
  console.error('API Error:', error)
  
  if (error instanceof Error) {
    // Handle specific AWS errors
    if (error.name === 'NoSuchBucket') {
      return createErrorResponse('Bucket not found', 404)
    }
    if (error.name === 'NoSuchKey') {
      return createErrorResponse('Object not found', 404)
    }
    if (error.name === 'AccessDenied') {
      return createErrorResponse('Access denied', 403)
    }
    if (error.name === 'InvalidAccessKeyId') {
      return createErrorResponse('Invalid access key', 401)
    }
    if (error.name === 'SignatureDoesNotMatch') {
      return createErrorResponse('Invalid credentials', 401)
    }
    if (error.name === 'NetworkingError') {
      return createErrorResponse('Network error - check your endpoint', 500)
    }
    
    return createErrorResponse(error.message, 500)
  }
  
  return createErrorResponse('An unexpected error occurred', 500)
}
