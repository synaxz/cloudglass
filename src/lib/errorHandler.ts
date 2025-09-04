export interface ErrorInfo {
  title: string
  message: string
  type: 'error' | 'warning'
  category: 'configuration' | 'network' | 'aws' | 'authentication' | 'permission' | 'unknown'
  retryable: boolean
}

export class AWSClientError extends Error {
  public readonly category: ErrorInfo['category']
  public readonly retryable: boolean
  public readonly originalError?: Error

  constructor(
    message: string,
    category: ErrorInfo['category'] = 'unknown',
    retryable: boolean = false,
    originalError?: Error
  ) {
    super(message)
    this.name = 'AWSClientError'
    this.category = category
    this.retryable = retryable
    this.originalError = originalError
  }
}

export function categorizeError(error: unknown): ErrorInfo {
  // Handle our custom AWSClientError
  if (error instanceof AWSClientError) {
    return {
      title: getErrorTitle(error.category),
      message: error.message,
      type: 'error',
      category: error.category,
      retryable: error.retryable
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    // Network/Connection errors
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to AWS service. Please check your network connection and endpoint configuration.',
        type: 'error',
        category: 'network',
        retryable: true
      }
    }

    // Authentication errors
    if (message.includes('unauthorized') || message.includes('access denied') || message.includes('invalid credentials')) {
      return {
        title: 'Authentication Error',
        message: 'Invalid access credentials. Please check your Access Key and Secret Key.',
        type: 'error',
        category: 'authentication',
        retryable: false
      }
    }

    // Permission errors
    if (message.includes('forbidden') || message.includes('permission denied') || message.includes('insufficient permissions')) {
      return {
        title: 'Permission Error',
        message: 'Insufficient permissions to perform this action. Please check your IAM policies.',
        type: 'error',
        category: 'permission',
        retryable: false
      }
    }

    // AWS service errors
    if (message.includes('aws') || message.includes('s3') || message.includes('sqs')) {
      return {
        title: 'AWS Service Error',
        message: error.message,
        type: 'error',
        category: 'aws',
        retryable: true
      }
    }

    // Configuration errors
    if (message.includes('endpoint') || message.includes('region') || message.includes('invalid')) {
      return {
        title: 'Configuration Error',
        message: 'Invalid configuration. Please check your endpoint and region settings.',
        type: 'error',
        category: 'configuration',
        retryable: false
      }
    }

    // Generic error
    return {
      title: 'Error',
      message: error.message,
      type: 'error',
      category: 'unknown',
      retryable: false
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      title: 'Error',
      message: error,
      type: 'error',
      category: 'unknown',
      retryable: false
    }
  }

  // Handle unknown errors
  return {
    title: 'Unknown Error',
    message: 'An unexpected error occurred. Please try again.',
    type: 'error',
    category: 'unknown',
    retryable: true
  }
}

function getErrorTitle(category: ErrorInfo['category']): string {
  switch (category) {
    case 'configuration':
      return 'Configuration Error'
    case 'network':
      return 'Connection Error'
    case 'aws':
      return 'AWS Service Error'
    case 'authentication':
      return 'Authentication Error'
    case 'permission':
      return 'Permission Error'
    case 'unknown':
    default:
      return 'Error'
  }
}

export function createConfigurationError(message: string): AWSClientError {
  return new AWSClientError(message, 'configuration', false)
}

export function createNetworkError(message: string, retryable: boolean = true): AWSClientError {
  return new AWSClientError(message, 'network', retryable)
}

export function createAWSError(message: string, retryable: boolean = true): AWSClientError {
  return new AWSClientError(message, 'aws', retryable)
}

export function createAuthenticationError(message: string): AWSClientError {
  return new AWSClientError(message, 'authentication', false)
}

export function createPermissionError(message: string): AWSClientError {
  return new AWSClientError(message, 'permission', false)
}
