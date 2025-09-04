'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HomePage } from '@/components/HomePage'
import { Layout } from '@/components/Layout'

export default function Home() {
  const router = useRouter()
  const [isSettingsVisible, setIsSettingsVisible] = useState(false)
  const [searchQuery] = useState('')

  const handleSettingsToggle = () => {
    setIsSettingsVisible(!isSettingsVisible)
  }

  const handleServiceChange = (service: string) => {
    if (service === 'home') {
      router.push('/')
    } else {
      router.push(`/${service}`)
    }
  }



  return (
    <Layout
      pageTitle="Services Dashboard"
      onSettingsToggle={handleSettingsToggle}
    >
      <div className="p-6">
        <HomePage 
          onServiceChange={handleServiceChange} 
          searchQuery={searchQuery}
        />
      </div>
    </Layout>
  )
}
