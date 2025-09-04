import { AWSConfigData } from './aws-config'

export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class APIClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = '/api'
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('API request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  private buildSearchParams(config: AWSConfigData): URLSearchParams {
    const params = new URLSearchParams()
    params.set('endpoint', config.endpoint)
    params.set('region', config.region)
    params.set('accessKey', config.accessKey)
    params.set('secretKey', config.secretKey)
    if (config.forcePathStyle !== undefined) {
      params.set('forcePathStyle', config.forcePathStyle.toString())
    }
    return params
  }

  private extractQueueName(queueUrl: string): string {
    // Extract queue name from URL like https://sqs.us-east-1.amazonaws.com/123456789012/queue-name
    // or http://localhost:4566/e.test/000000000000/queue-name
    const parts = queueUrl.split('/')
    return parts[parts.length - 1]
  }

  // S3 API methods
  async getBuckets(config: AWSConfigData): Promise<APIResponse<unknown[]>> {
    const params = this.buildSearchParams(config)
    return this.request(`/s3/buckets?${params}`)
  }

  async createBucket(config: AWSConfigData, bucketName: string): Promise<APIResponse> {
    return this.request('/s3/buckets', {
      method: 'POST',
      body: JSON.stringify({ config, bucketName }),
    })
  }

  async deleteBucket(config: AWSConfigData, bucketName: string): Promise<APIResponse> {
    const params = this.buildSearchParams(config)
    params.set('bucketName', bucketName)
    return this.request(`/s3/buckets?${params}`, {
      method: 'DELETE',
    })
  }

  async getObjects(config: AWSConfigData, bucketName: string): Promise<APIResponse<unknown[]>> {
    const params = this.buildSearchParams(config)
    return this.request(`/s3/${bucketName}/objects?${params}`)
  }

  async uploadObject(
    config: AWSConfigData,
    bucketName: string,
    key: string,
    file: File,
    _onProgress?: (progress: number) => void
  ): Promise<APIResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('key', key)
    formData.append('endpoint', config.endpoint)
    formData.append('region', config.region)
    formData.append('accessKey', config.accessKey)
    formData.append('secretKey', config.secretKey)
    if (config.forcePathStyle !== undefined) {
      formData.append('forcePathStyle', config.forcePathStyle.toString())
    }

    try {
      const response = await fetch(`${this.baseUrl}/s3/${bucketName}/objects`, {
        method: 'POST',
        body: formData,
      })
      return await response.json()
    } catch (error) {
      console.error('Upload request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  async uploadObjectWithProgress(
    config: AWSConfigData,
    bucketName: string,
    key: string,
    file: File,
    onProgress?: (progress: number) => void,
    abortController?: AbortController
  ): Promise<APIResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('key', key)
    formData.append('endpoint', config.endpoint)
    formData.append('region', config.region)
    formData.append('accessKey', config.accessKey)
    formData.append('secretKey', config.secretKey)
    if (config.forcePathStyle !== undefined) {
      formData.append('forcePathStyle', config.forcePathStyle.toString())
    }

    try {
      const response = await fetch(`${this.baseUrl}/s3/${bucketName}/upload`, {
        method: 'POST',
        body: formData,
        signal: abortController?.signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.error || 'Upload failed'
        }
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        return {
          success: false,
          error: 'Failed to read response stream'
        }
      }

      return new Promise((resolve) => {
        const readStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read()
              
              if (done) {
                resolve({
                  success: false,
                  error: 'Upload stream ended unexpectedly'
                })
                break
              }

              const chunk = decoder.decode(value)
              const lines = chunk.split('\n')

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6))
                    
                    if (data.type === 'progress' && onProgress) {
                      onProgress(data.percentage)
                    } else if (data.type === 'complete') {
                      resolve({
                        success: true,
                        message: data.message
                      })
                      return
                    } else if (data.type === 'error') {
                      resolve({
                        success: false,
                        error: data.error
                      })
                      return
                    }
                  } catch (parseError) {
                    console.error('Failed to parse SSE data:', parseError)
                  }
                }
              }
            }
          } catch (error) {
            resolve({
              success: false,
              error: error instanceof Error ? error.message : 'Stream reading failed'
            })
          }
        }

        readStream()
      })
    } catch (error) {
      console.error('Upload request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  async deleteObject(config: AWSConfigData, bucketName: string, key: string): Promise<APIResponse> {
    const params = this.buildSearchParams(config)
    params.set('key', key)
    return this.request(`/s3/${bucketName}/objects?${params}`, {
      method: 'DELETE',
    })
  }

  async getDownloadUrl(config: AWSConfigData, bucketName: string, key: string): Promise<APIResponse<{ downloadUrl: string }>> {
    const params = this.buildSearchParams(config)
    params.set('key', key)
    return this.request(`/s3/${bucketName}/download?${params}`)
  }

  async getBucketAttributes(config: AWSConfigData, bucketName: string): Promise<APIResponse<unknown>> {
    const params = this.buildSearchParams(config)
    params.set('bucketName', bucketName)
    return this.request(`/s3/buckets/attributes?${params}`)
  }

  async updateBucketAttributes(config: AWSConfigData, bucketName: string, attributes: Record<string, unknown>): Promise<APIResponse> {
    return this.request('/s3/buckets/attributes', {
      method: 'PUT',
      body: JSON.stringify({ config, bucketName, attributes }),
    })
  }

  // SQS API methods
  async getQueues(config: AWSConfigData): Promise<APIResponse<unknown[]>> {
    const params = this.buildSearchParams(config)
    return this.request(`/sqs/queues?${params}`)
  }

  async createQueue(config: AWSConfigData, queueName: string, attributes?: Record<string, string>): Promise<APIResponse> {
    return this.request('/sqs/queues', {
      method: 'POST',
      body: JSON.stringify({ config, queueName, attributes }),
    })
  }

  async deleteQueue(config: AWSConfigData, queueUrl: string): Promise<APIResponse> {
    const params = this.buildSearchParams(config)
    params.set('queueUrl', queueUrl)
    return this.request(`/sqs/queues?${params}`, {
      method: 'DELETE',
    })
  }

  async purgeQueue(config: AWSConfigData, queueUrl: string): Promise<APIResponse> {
    const params = this.buildSearchParams(config)
    params.set('queueUrl', queueUrl)
    params.set('action', 'purge')
    return this.request(`/sqs/queues?${params}`, {
      method: 'PUT',
    })
  }

  async getMessages(config: AWSConfigData, queueUrl: string): Promise<APIResponse<unknown[]>> {
    const queueName = this.extractQueueName(queueUrl)
    const params = this.buildSearchParams(config)
    return this.request(`/sqs/${queueName}/messages?${params}`)
  }

  async sendMessage(config: AWSConfigData, queueUrl: string, messageBody: string): Promise<APIResponse> {
    const queueName = this.extractQueueName(queueUrl)
    return this.request(`/sqs/${queueName}/messages`, {
      method: 'POST',
      body: JSON.stringify({ config, messageBody }),
    })
  }

  async deleteMessage(config: AWSConfigData, queueUrl: string, receiptHandle: string): Promise<APIResponse> {
    const queueName = this.extractQueueName(queueUrl)
    const params = this.buildSearchParams(config)
    params.set('receiptHandle', receiptHandle)
    return this.request(`/sqs/${queueName}/messages?${params}`, {
      method: 'DELETE',
    })
  }

  async updateQueueAttributes(config: AWSConfigData, queueUrl: string, attributes: Record<string, string>): Promise<APIResponse> {
    return this.request('/sqs/queues/attributes', {
      method: 'PUT',
      body: JSON.stringify({ config, queueUrl, attributes }),
    })
  }

  // IAM API methods
  async getIAMUsers(config: AWSConfigData): Promise<APIResponse<unknown[]>> {
    const params = this.buildSearchParams(config)
    return this.request(`/iam/users?${params}`)
  }

  async createIAMUser(config: AWSConfigData, userName: string): Promise<APIResponse> {
    return this.request('/iam/users', {
      method: 'POST',
      body: JSON.stringify({ config, userName }),
    })
  }

  async deleteIAMUser(config: AWSConfigData, userName: string): Promise<APIResponse> {
    const params = this.buildSearchParams(config)
    params.set('userName', userName)
    return this.request(`/iam/users?${params}`, {
      method: 'DELETE',
    })
  }

  async getIAMRoles(config: AWSConfigData): Promise<APIResponse<unknown[]>> {
    const params = this.buildSearchParams(config)
    return this.request(`/iam/roles?${params}`)
  }

  async createIAMRole(config: AWSConfigData, roleName: string, assumeRolePolicyDocument: string, description?: string): Promise<APIResponse> {
    return this.request('/iam/roles', {
      method: 'POST',
      body: JSON.stringify({ config, roleName, assumeRolePolicyDocument, description }),
    })
  }

  async deleteIAMRole(config: AWSConfigData, roleName: string): Promise<APIResponse> {
    const params = this.buildSearchParams(config)
    params.set('roleName', roleName)
    return this.request(`/iam/roles?${params}`, {
      method: 'DELETE',
    })
  }

  async getIAMPolicies(config: AWSConfigData): Promise<APIResponse<unknown[]>> {
    const params = this.buildSearchParams(config)
    return this.request(`/iam/policies?${params}`)
  }

  async createIAMPolicy(config: AWSConfigData, policyName: string, policyDocument: string): Promise<APIResponse> {
    return this.request('/iam/policies', {
      method: 'POST',
      body: JSON.stringify({ config, policyName, policyDocument }),
    })
  }

  async deleteIAMPolicy(config: AWSConfigData, policyName: string): Promise<APIResponse> {
    const params = this.buildSearchParams(config)
    params.set('policyName', policyName)
    return this.request(`/iam/policies?${params}`, {
      method: 'DELETE',
    })
  }

  // SNS API methods
  async getSNSTopics(config: AWSConfigData): Promise<APIResponse<{ topics: unknown[] }>> {
    const params = this.buildSearchParams(config)
    return this.request(`/sns/topics?${params}`)
  }

  async createSNSTopic(config: AWSConfigData, topicName: string): Promise<APIResponse> {
    return this.request('/sns/topics', {
      method: 'POST',
      body: JSON.stringify({ config, name: topicName }),
    })
  }

  async deleteSNSTopic(config: AWSConfigData, topicArn: string): Promise<APIResponse> {
    const params = this.buildSearchParams(config)
    params.set('topicArn', topicArn)
    return this.request(`/sns/topics?${params}`, {
      method: 'DELETE',
    })
  }

  async getSNSSubscriptions(config: AWSConfigData, topicArn: string): Promise<APIResponse<{ subscriptions: unknown[] }>> {
    const params = this.buildSearchParams(config)
    params.set('topicArn', topicArn)
    return this.request(`/sns/subscriptions?${params}`)
  }

  async createSNSSubscription(config: AWSConfigData, topicArn: string, protocol: string, endpoint: string): Promise<APIResponse> {
    return this.request('/sns/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ config, topicArn, protocol, endpoint }),
    })
  }

  async deleteSNSSubscription(config: AWSConfigData, subscriptionArn: string): Promise<APIResponse> {
    const params = this.buildSearchParams(config)
    params.set('subscriptionArn', subscriptionArn)
    return this.request(`/sns/subscriptions?${params}`, {
      method: 'DELETE',
    })
  }

  async publishSNSMessage(
    config: AWSConfigData, 
    topicArn: string, 
    message: string, 
    subject?: string, 
    messageAttributes?: Record<string, unknown>
  ): Promise<APIResponse> {
    return this.request('/sns/messages', {
      method: 'POST',
      body: JSON.stringify({ 
        config, 
        topicArn, 
        message, 
        subject, 
        messageAttributes 
      }),
    })
  }

  // SNS Topic Attributes API methods
  async getSNSTopicAttributes(config: AWSConfigData, topicArn: string): Promise<APIResponse<{ attributes: unknown, tags: unknown[] }>> {
    const params = this.buildSearchParams(config)
    params.set('topicArn', topicArn)
    return this.request(`/sns/topics/attributes?${params}`)
  }

  async updateSNSTopicAttributes(config: AWSConfigData, topicArn: string, attributes: Record<string, unknown>, tags?: Array<{ Key: string, Value: string }>): Promise<APIResponse> {
    return this.request('/sns/topics/attributes', {
      method: 'PUT',
      body: JSON.stringify({ config, topicArn, attributes, tags }),
    })
  }

  // SNS Subscription Attributes API methods
  async getSNSSubscriptionAttributes(config: AWSConfigData, subscriptionArn: string): Promise<APIResponse<{ attributes: unknown }>> {
    const params = this.buildSearchParams(config)
    params.set('subscriptionArn', subscriptionArn)
    return this.request(`/sns/subscriptions/attributes?${params}`)
  }

  async updateSNSSubscriptionAttributes(config: AWSConfigData, subscriptionArn: string, attributes: Record<string, unknown>): Promise<APIResponse> {
    return this.request('/sns/subscriptions/attributes', {
      method: 'PUT',
      body: JSON.stringify({ config, subscriptionArn, attributes }),
    })
  }

  // SNS Platform Applications API methods
  async getSNSPlatformApplications(config: AWSConfigData): Promise<APIResponse<{ platformApplications: unknown[] }>> {
    const params = this.buildSearchParams(config)
    return this.request(`/sns/platform-applications?${params}`)
  }

  async createSNSPlatformApplication(
    config: AWSConfigData, 
    name: string, 
    platform: string, 
    platformCredential: string, 
    platformPrincipal?: string
  ): Promise<APIResponse> {
    return this.request('/sns/platform-applications', {
      method: 'POST',
      body: JSON.stringify({ config, name, platform, platformCredential, platformPrincipal }),
    })
  }

  async deleteSNSPlatformApplication(config: AWSConfigData, platformApplicationArn: string): Promise<APIResponse> {
    const params = this.buildSearchParams(config)
    params.set('platformApplicationArn', platformApplicationArn)
    return this.request(`/sns/platform-applications?${params}`, {
      method: 'DELETE',
    })
  }

  // SNS Platform Endpoints API methods
  async getSNSPlatformEndpoints(config: AWSConfigData, platformApplicationArn: string): Promise<APIResponse<{ endpoints: unknown[] }>> {
    const params = this.buildSearchParams(config)
    params.set('platformApplicationArn', platformApplicationArn)
    return this.request(`/sns/platform-endpoints?${params}`)
  }

  async createSNSPlatformEndpoint(
    config: AWSConfigData, 
    platformApplicationArn: string, 
    token: string, 
    customUserData?: string
  ): Promise<APIResponse> {
    return this.request('/sns/platform-endpoints', {
      method: 'POST',
      body: JSON.stringify({ config, platformApplicationArn, token, customUserData }),
    })
  }

  async deleteSNSPlatformEndpoint(config: AWSConfigData, endpointArn: string): Promise<APIResponse> {
    const params = this.buildSearchParams(config)
    params.set('endpointArn', endpointArn)
    return this.request(`/sns/platform-endpoints?${params}`, {
      method: 'DELETE',
    })
  }
}

export const apiClient = new APIClient()
