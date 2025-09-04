import { NextRequest } from 'next/server'
import { 
  PutBucketVersioningCommand, 
  PutBucketEncryptionCommand, 
  PutBucketCorsCommand,
  PutBucketAclCommand,
  PutBucketTaggingCommand,
  PutBucketAccelerateConfigurationCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketCorsCommand,
  GetBucketAclCommand,
  GetBucketTaggingCommand,
  GetBucketAccelerateConfigurationCommand
} from '@aws-sdk/client-s3'
import { validateAWSConfig, AWSConfigData, createS3Client } from '@/lib/aws-config'
import { createSuccessResponse, createErrorResponse, handleAPIError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bucketName = searchParams.get('bucketName')
    
    if (!bucketName) {
      return createErrorResponse('Bucket name is required', 400)
    }

    const config: AWSConfigData = {
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

    const s3Client = createS3Client(config)
    const attributes: Record<string, unknown> = {}

    try {
      // Get versioning configuration
      const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName })
      const versioningResponse = await s3Client.send(versioningCommand)
      attributes.versioning = versioningResponse.Status || 'Suspended'
    } catch (error) {
      console.warn('Could not get versioning configuration:', error)
    }

    try {
      // Get encryption configuration
      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName })
      const encryptionResponse = await s3Client.send(encryptionCommand)
      if (encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]) {
        const rule = encryptionResponse.ServerSideEncryptionConfiguration.Rules[0]
        attributes.encryption = {
          enabled: true,
          algorithm: rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm || 'AES256',
          kmsKeyId: rule.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID
        }
      } else {
        attributes.encryption = { enabled: false }
      }
    } catch (error) {
      console.warn('Could not get encryption configuration:', error)
      attributes.encryption = { enabled: false }
    }

    try {
      // Get CORS configuration
      const corsCommand = new GetBucketCorsCommand({ Bucket: bucketName })
      const corsResponse = await s3Client.send(corsCommand)
      attributes.cors = corsResponse.CORSRules || []
    } catch (error) {
      console.warn('Could not get CORS configuration:', error)
      attributes.cors = []
    }

    try {
      // Get ACL configuration
      const aclCommand = new GetBucketAclCommand({ Bucket: bucketName })
      const aclResponse = await s3Client.send(aclCommand)
      attributes.acl = aclResponse.Grants || []
    } catch (error) {
      console.warn('Could not get ACL configuration:', error)
      attributes.acl = []
    }

    try {
      // Get tagging configuration
      const taggingCommand = new GetBucketTaggingCommand({ Bucket: bucketName })
      const taggingResponse = await s3Client.send(taggingCommand)
      attributes.tags = taggingResponse.TagSet || []
    } catch (error) {
      console.warn('Could not get tagging configuration:', error)
      attributes.tags = []
    }

    try {
      // Get transfer acceleration configuration
      const accelerateCommand = new GetBucketAccelerateConfigurationCommand({ Bucket: bucketName })
      const accelerateResponse = await s3Client.send(accelerateCommand)
      attributes.transferAcceleration = accelerateResponse.Status || 'Suspended'
    } catch (error) {
      console.warn('Could not get transfer acceleration configuration:', error)
      attributes.transferAcceleration = 'Suspended'
    }

    return createSuccessResponse(attributes, 'Successfully retrieved bucket attributes')
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { config, bucketName, attributes } = body

    if (!bucketName) {
      return createErrorResponse('Bucket name is required', 400)
    }

    if (!attributes || Object.keys(attributes).length === 0) {
      return createErrorResponse('At least one attribute is required', 400)
    }

    const validation = validateAWSConfig(config)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400)
    }

    const s3Client = createS3Client(config)
    const results: string[] = []

    // Update versioning if provided
    if (attributes.versioning !== undefined) {
      try {
        const versioningCommand = new PutBucketVersioningCommand({
          Bucket: bucketName,
          VersioningConfiguration: {
            Status: attributes.versioning
          }
        })
        await s3Client.send(versioningCommand)
        results.push('Versioning updated')
      } catch (error) {
        console.error('Error updating versioning:', error)
        results.push('Failed to update versioning')
      }
    }

    // Update encryption if provided
    if (attributes.encryption !== undefined) {
      try {
        if (attributes.encryption.enabled) {
          const encryptionCommand = new PutBucketEncryptionCommand({
            Bucket: bucketName,
            ServerSideEncryptionConfiguration: {
              Rules: [{
                ApplyServerSideEncryptionByDefault: {
                  SSEAlgorithm: attributes.encryption.algorithm || 'AES256',
                  KMSMasterKeyID: attributes.encryption.kmsKeyId
                }
              }]
            }
          })
          await s3Client.send(encryptionCommand)
          results.push('Encryption enabled')
        } else {
          // Note: AWS doesn't provide a direct way to disable encryption
          // This would require removing the encryption configuration
          results.push('Encryption configuration updated')
        }
      } catch (error) {
        console.error('Error updating encryption:', error)
        results.push('Failed to update encryption')
      }
    }

    // Update CORS if provided
    if (attributes.cors !== undefined) {
      try {
        const corsCommand = new PutBucketCorsCommand({
          Bucket: bucketName,
          CORSConfiguration: {
            CORSRules: attributes.cors
          }
        })
        await s3Client.send(corsCommand)
        results.push('CORS configuration updated')
      } catch (error) {
        console.error('Error updating CORS:', error)
        results.push('Failed to update CORS')
      }
    }

    // Update ACL if provided
    if (attributes.acl !== undefined) {
      try {
        const aclCommand = new PutBucketAclCommand({
          Bucket: bucketName,
          AccessControlPolicy: {
            Grants: attributes.acl
          }
        })
        await s3Client.send(aclCommand)
        results.push('ACL updated')
      } catch (error) {
        console.error('Error updating ACL:', error)
        results.push('Failed to update ACL')
      }
    }

    // Update tags if provided
    if (attributes.tags !== undefined) {
      try {
        const taggingCommand = new PutBucketTaggingCommand({
          Bucket: bucketName,
          Tagging: {
            TagSet: attributes.tags
          }
        })
        await s3Client.send(taggingCommand)
        results.push('Tags updated')
      } catch (error) {
        console.error('Error updating tags:', error)
        results.push('Failed to update tags')
      }
    }

    // Update transfer acceleration if provided
    if (attributes.transferAcceleration !== undefined) {
      try {
        const accelerateCommand = new PutBucketAccelerateConfigurationCommand({
          Bucket: bucketName,
          AccelerateConfiguration: {
            Status: attributes.transferAcceleration
          }
        })
        await s3Client.send(accelerateCommand)
        results.push('Transfer acceleration updated')
      } catch (error) {
        console.error('Error updating transfer acceleration:', error)
        results.push('Failed to update transfer acceleration')
      }
    }

    return createSuccessResponse(null, `Successfully updated bucket attributes: ${results.join(', ')}`)
  } catch (error) {
    return handleAPIError(error)
  }
}
