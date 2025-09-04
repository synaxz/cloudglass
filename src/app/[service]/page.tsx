'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { S3Manager } from '@/components/S3Manager'
import { SQSManager } from '@/components/SQSManager'
import { SNSManager } from '@/components/SNSManager'
import { IAMManager } from '@/components/IAMManager'
import { Layout } from '@/components/Layout'

export default function ServicePage() {
  const params = useParams()
  const router = useRouter()
  const [isSettingsVisible, setIsSettingsVisible] = useState(false)
  const service = params.service as string

  const handleSettingsToggle = () => {
    setIsSettingsVisible(!isSettingsVisible)
  }

  const getPageTitle = () => {
    switch (service) {
      case 's3':
        return 'S3 Storage Management'
      case 'sqs':
        return 'SQS Queue Management'
      case 'sns':
        return 'SNS Notification Management'
      case 'iam':
        return 'IAM Identity & Access Management'
      default:
        return 'AWS Service'
    }
  }

  const renderServiceContent = () => {
    switch (service) {
      case 's3':
        return <S3Manager isSettingsVisible={isSettingsVisible} />
      case 'sqs':
        return <SQSManager isSettingsVisible={isSettingsVisible} />
      case 'sns':
        return <SNSManager isSettingsVisible={isSettingsVisible} />
      case 'iam':
        return <IAMManager isSettingsVisible={isSettingsVisible} />
      default:
        // Redirect to home if service is not found
        router.push('/')
        return null
    }
  }

  // Redirect to home if service is not valid
  useEffect(() => {
    const validServices = ['s3', 'sqs', 'sns', 'iam']
    if (service && !validServices.includes(service)) {
      router.push('/')
    }
  }, [service, router])

  return (
    <Layout
      pageTitle={getPageTitle()}
      onSettingsToggle={handleSettingsToggle}
    >
      <div className="p-6">
        {renderServiceContent()}
      </div>
    </Layout>
  )
}
