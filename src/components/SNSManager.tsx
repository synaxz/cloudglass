'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { Textarea } from '@/components/ui/textarea'
import { 
  Plus, 
  Trash2, 
  Send, 
  Users, 
  Bell,
  Mail,
  Smartphone,
  Globe,
  Hash,
  RefreshCw,
  Copy,
  ExternalLink,
  MessageSquare
} from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { AWSConfig } from '@/components/AWSConfig'
import { useAWSConfig } from '@/contexts/AWSConfigContext'
import { apiClient } from '@/lib/api-client'

interface Topic {
  topicArn: string
  name: string
}

interface Subscription {
  subscriptionArn: string
  protocol: string
  endpoint: string
  owner: string
  topicArn: string
}

interface TopicAttributes {
  TopicArn?: string
  DisplayName?: string
  Policy?: string
  DeliveryPolicy?: string
  EffectiveDeliveryPolicy?: string
  KmsMasterKeyId?: string
  SignatureVersion?: string
  TracingConfig?: string
  DataProtectionPolicy?: string
  FifoTopic?: string
  ContentBasedDeduplication?: string
  [key: string]: string | undefined
}


interface SNSManagerProps {
  isSettingsVisible: boolean
}

export function SNSManager({ isSettingsVisible }: SNSManagerProps) {
  const { showSuccess, showError } = useToast()
  
  // Use global AWS configuration context
  const { config, updateConfig, saveConfig } = useAWSConfig()
  
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [topicToDelete, setTopicToDelete] = useState<string>('')
  const [newSubscription, setNewSubscription] = useState({
    protocol: 'email',
    endpoint: ''
  })
  const [showCreateSubscriptionDialog, setShowCreateSubscriptionDialog] = useState(false)
  const [showDeleteSubscriptionDialog, setShowDeleteSubscriptionDialog] = useState(false)
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<string>('')
  const [publishMessage, setPublishMessage] = useState({
    subject: '',
    message: '',
    messageAttributes: ''
  })
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  // Pagination states
  const [currentTopicPage, setCurrentTopicPage] = useState(1)
  const [currentSubscriptionPage, setCurrentSubscriptionPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // Search states
  const [topicSearchTerm, setTopicSearchTerm] = useState('')
  const [subscriptionSearchTerm, setSubscriptionSearchTerm] = useState('')

  const loadTopics = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.getSNSTopics(config)
      if (response.success && response.data) {
        const topics = (response.data as { topics: Topic[] }).topics || []
        setTopics(topics)
        // Only show success message if there are topics or if it's the first load
        if (topics.length > 0) {
          showSuccess('Topics Loaded', response.message || `Successfully loaded ${topics.length} topics`)
        }
      } else {
        showError('Error Loading Topics', response.error || 'Failed to load topics')
      }
    } catch (error) {
      console.error('Error loading topics:', error)
      showError('Error Loading Topics', 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [config])

  const loadSubscriptions = useCallback(async (topicArn: string) => {
    if (!topicArn) return
    
    try {
      const response = await apiClient.getSNSSubscriptions(config, topicArn)
      if (response.success && response.data) {
        const subscriptions = (response.data as { subscriptions: Subscription[] }).subscriptions || []
        setSubscriptions(subscriptions)
        // Only show success message if there are subscriptions
        if (subscriptions.length > 0) {
          showSuccess('Subscriptions Loaded', response.message || `Successfully loaded ${subscriptions.length} subscriptions`)
        }
      } else {
        showError('Error Loading Subscriptions', response.error || 'Failed to load subscriptions')
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error)
      showError('Error Loading Subscriptions', 'An unexpected error occurred')
    }
  }, [config])

  useEffect(() => {
    loadTopics()
  }, [config]) // Run when config changes

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic)
    setSubscriptions([]) // Clear subscriptions when selecting a new topic
    setCurrentSubscriptionPage(1) // Reset subscription pagination when selecting new topic
    if (topic.topicArn) {
      loadSubscriptions(topic.topicArn)
    }
  }

  // Search filtering functions
  const filterTopics = (topics: Topic[], searchTerm: string) => {
    if (!searchTerm.trim()) return topics
    return topics.filter(topic => 
      topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.topicArn.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const filterSubscriptions = (subscriptions: Subscription[], searchTerm: string) => {
    if (!searchTerm.trim()) return subscriptions
    return subscriptions.filter(subscription => 
      subscription.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.subscriptionArn.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Filter data based on search terms
  const filteredTopics = filterTopics(topics, topicSearchTerm)
  const filteredSubscriptions = filterSubscriptions(subscriptions, subscriptionSearchTerm)

  // Pagination calculations
  const totalTopicPages = Math.ceil(filteredTopics.length / itemsPerPage)
  const paginatedTopics = filteredTopics.slice(
    (currentTopicPage - 1) * itemsPerPage,
    currentTopicPage * itemsPerPage
  )

  const totalSubscriptionPages = Math.ceil(filteredSubscriptions.length / itemsPerPage)
  const paginatedSubscriptions = filteredSubscriptions.slice(
    (currentSubscriptionPage - 1) * itemsPerPage,
    currentSubscriptionPage * itemsPerPage
  )

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) return

    try {
      const response = await apiClient.createSNSTopic(config, newTopicName.trim())
      if (response.success) {
        setNewTopicName('')
        setShowCreateDialog(false)
        showSuccess('Topic Created', response.message || `Successfully created topic "${newTopicName.trim()}"`)
        loadTopics()
      } else {
        showError('Error Creating Topic', response.error || 'Failed to create topic')
      }
    } catch (error) {
      console.error('Error creating topic:', error)
      showError('Error Creating Topic', 'An unexpected error occurred')
    }
  }

  const handleDeleteTopic = async () => {
    if (!topicToDelete) return

    try {
      const response = await apiClient.deleteSNSTopic(config, topicToDelete)
      if (response.success) {
        if (selectedTopic?.topicArn === topicToDelete) {
          setSelectedTopic(null)
          setSubscriptions([])
        }
        
        setTopicToDelete('')
        setShowDeleteDialog(false)
        showSuccess('Topic Deleted', response.message || `Successfully deleted topic`)
        loadTopics()
      } else {
        showError('Error Deleting Topic', response.error || 'Failed to delete topic')
      }
    } catch (error) {
      console.error('Error deleting topic:', error)
      showError('Error Deleting Topic', 'An unexpected error occurred')
    }
  }

  const handleCreateSubscription = async () => {
    if (!selectedTopic || !newSubscription.protocol || !newSubscription.endpoint) return

    try {
      const response = await apiClient.createSNSSubscription(config, selectedTopic.topicArn, newSubscription.protocol, newSubscription.endpoint)
      if (response.success) {
        setNewSubscription({ protocol: 'email', endpoint: '' })
        setShowCreateSubscriptionDialog(false)
        showSuccess('Subscription Created', response.message || `Successfully created subscription`)
        loadSubscriptions(selectedTopic.topicArn)
      } else {
        showError('Error Creating Subscription', response.error || 'Failed to create subscription')
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      showError('Error Creating Subscription', 'An unexpected error occurred')
    }
  }

  const handleDeleteSubscription = async () => {
    if (!subscriptionToDelete) return

    try {
      const response = await apiClient.deleteSNSSubscription(config, subscriptionToDelete)
      if (response.success) {
        setSubscriptionToDelete('')
        setShowDeleteSubscriptionDialog(false)
        showSuccess('Subscription Deleted', response.message || `Successfully deleted subscription`)
        if (selectedTopic) {
          loadSubscriptions(selectedTopic.topicArn)
        }
      } else {
        showError('Error Deleting Subscription', response.error || 'Failed to delete subscription')
      }
    } catch (error) {
      console.error('Error deleting subscription:', error)
      showError('Error Deleting Subscription', 'An unexpected error occurred')
    }
  }

  const handlePublishMessage = async () => {
    if (!selectedTopic || !publishMessage.message.trim()) return

    setIsPublishing(true)
    try {
      let messageAttributes = {}
      if (publishMessage.messageAttributes.trim()) {
        try {
          messageAttributes = JSON.parse(publishMessage.messageAttributes)
        } catch {
          showError('Invalid Message Attributes', 'Message attributes must be valid JSON')
          return
        }
      }

      const response = await apiClient.publishSNSMessage(
        config, 
        selectedTopic.topicArn, 
        publishMessage.message,
        publishMessage.subject || undefined,
        Object.keys(messageAttributes).length > 0 ? messageAttributes : undefined
      )
      
      if (response.success) {
        setPublishMessage({ subject: '', message: '', messageAttributes: '' })
        setShowPublishDialog(false)
        showSuccess('Message Published', response.message || `Successfully published message`)
      } else {
        showError('Error Publishing Message', response.error || 'Failed to publish message')
      }
    } catch (error) {
      console.error('Error publishing message:', error)
      showError('Error Publishing Message', 'An unexpected error occurred')
    } finally {
      setIsPublishing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }


  const getProtocolIcon = (protocol: string) => {
    switch (protocol.toLowerCase()) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <Smartphone className="h-4 w-4" />
      case 'http':
      case 'https':
        return <Globe className="h-4 w-4" />
      case 'sqs':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <Hash className="h-4 w-4" />
    }
  }

  const getProtocolColor = (protocol: string) => {
    switch (protocol.toLowerCase()) {
      case 'email':
        return 'text-blue-600 dark:text-blue-400'
      case 'sms':
        return 'text-green-600 dark:text-green-400'
      case 'http':
      case 'https':
        return 'text-purple-600 dark:text-purple-400'
      case 'sqs':
        return 'text-orange-600 dark:text-orange-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Settings Panel */}
      <AWSConfig
        isVisible={isSettingsVisible}
        config={config}
        onConfigChange={updateConfig}
        onSave={saveConfig}
        showForcePathStyle={true}
        onValidationError={(error) => showError('Configuration Error', error)}
      />

      {/* Topics Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Available Topics</CardTitle>
              <CardDescription>Select a topic to view its subscriptions and manage messages</CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Topic
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Topic</DialogTitle>
                  <DialogDescription>
                    Create a new SNS topic for sending notifications
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newTopicName">Topic Name</Label>
                    <Input
                      id="newTopicName"
                      value={newTopicName}
                      onChange={(e) => setNewTopicName(e.target.value)}
                      placeholder="my-notification-topic"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTopic} disabled={!newTopicName.trim()}>
                      Create Topic
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Input */}
          <div className="mb-4">
            <Input
              placeholder="Search topics by name or ARN..."
              value={topicSearchTerm}
              onChange={(e) => {
                setTopicSearchTerm(e.target.value)
                setCurrentTopicPage(1) // Reset to first page when searching
              }}
              className="max-w-md"
            />
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">Loading topics...</div>
          ) : filteredTopics.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {topicSearchTerm ? 'No topics found matching your search' : 'No topics found'}
            </div>
          ) : (
            <>
              <div className="grid gap-3">
                {paginatedTopics.map((topic) => (
                <div
                  key={topic.topicArn}
                  className={`p-4 border rounded-lg transition-colors ${
                    selectedTopic?.topicArn === topic.topicArn
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => handleTopicSelect(topic)}
                    >
                      <Bell className={`h-5 w-5 ${
                        selectedTopic?.topicArn === topic.topicArn 
                          ? 'text-green-600 dark:text-green-300' 
                          : 'text-green-500 dark:text-green-400'
                      }`} />
                      <div>
                        <h3 className={`font-medium ${
                          selectedTopic?.topicArn === topic.topicArn 
                            ? 'text-blue-700 dark:text-blue-100' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>{topic.name}</h3>
                        <div className={`flex items-center gap-2 text-sm ${
                          selectedTopic?.topicArn === topic.topicArn 
                            ? 'text-blue-600 dark:text-blue-200' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          <span>Region: {topic.topicArn.split(':')[3]}</span>
                          <span>•</span>
                          <span>Account: {topic.topicArn.split(':')[4]}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedTopic?.topicArn === topic.topicArn && (
                        <Badge variant="secondary">Selected</Badge>
                      )}
                      
                      {/* Delete Topic Button */}
                      <Dialog open={showDeleteDialog && topicToDelete === topic.topicArn} onOpenChange={(open) => {
                        if (open) {
                          setTopicToDelete(topic.topicArn)
                          setShowDeleteDialog(true)
                        } else {
                          setShowDeleteDialog(false)
                          setTopicToDelete('')
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              setTopicToDelete(topic.topicArn)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Topic</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete the topic &quot;{topic.name}&quot;? 
                              This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                              Cancel
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={handleDeleteTopic}
                            >
                              Delete Topic
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
              </div>
              
              {/* Topic Pagination */}
              {totalTopicPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {((currentTopicPage - 1) * itemsPerPage) + 1} to {Math.min(currentTopicPage * itemsPerPage, filteredTopics.length)} of {filteredTopics.length} topics
                    {topicSearchTerm && ` (filtered from ${topics.length} total)`}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentTopicPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentTopicPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page {currentTopicPage} of {totalTopicPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentTopicPage(prev => Math.min(prev + 1, totalTopicPages))}
                      disabled={currentTopicPage === totalTopicPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Topic Details Section - Only show when a topic is selected */}
      {selectedTopic && (
        <div className="space-y-4">
          {/* Topic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Topic: {selectedTopic.name}</CardTitle>
                  <CardDescription>Topic details and subscriptions</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(selectedTopic.topicArn)}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy ARN
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedTopic.topicArn, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open ARN
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Topic ARN</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={selectedTopic.topicArn} readOnly className="font-mono text-sm" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(selectedTopic.topicArn)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Region</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedTopic.topicArn.split(':')[3]}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Account</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedTopic.topicArn.split(':')[4]}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscriptions Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Subscriptions</CardTitle>
                  <CardDescription>Manage subscriptions for this topic</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => loadSubscriptions(selectedTopic.topicArn)}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                  <Dialog open={showCreateSubscriptionDialog} onOpenChange={setShowCreateSubscriptionDialog}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Subscription
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Subscription</DialogTitle>
                        <DialogDescription>
                          Add a new subscription to the selected topic
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="protocol">Protocol</Label>
                          <Select
                            value={newSubscription.protocol}
                            onValueChange={(value) => setNewSubscription(prev => ({ ...prev, protocol: value }))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="sms">SMS</SelectItem>
                              <SelectItem value="http">HTTP</SelectItem>
                              <SelectItem value="https">HTTPS</SelectItem>
                              <SelectItem value="sqs">SQS</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="endpoint">Endpoint</Label>
                          <Input
                            id="endpoint"
                            value={newSubscription.endpoint}
                            onChange={(e) => setNewSubscription(prev => ({ ...prev, endpoint: e.target.value }))}
                            placeholder="user@example.com or https://example.com/webhook"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setShowCreateSubscriptionDialog(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleCreateSubscription}
                            disabled={!newSubscription.protocol || !newSubscription.endpoint.trim()}
                          >
                            Add Subscription
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search Input */}
              <div className="mb-4">
                <Input
                  placeholder="Search subscriptions by protocol, endpoint, or owner..."
                  value={subscriptionSearchTerm}
                  onChange={(e) => {
                    setSubscriptionSearchTerm(e.target.value)
                    setCurrentSubscriptionPage(1) // Reset to first page when searching
                  }}
                  className="max-w-md"
                />
              </div>
              
              {filteredSubscriptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p>{subscriptionSearchTerm ? 'No subscriptions found matching your search' : 'No subscriptions found'}</p>
                  <p className="text-sm">Add subscriptions to receive notifications</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedSubscriptions.map((subscription) => (
                    <div key={subscription.subscriptionArn} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-2 rounded-lg ${getProtocolColor(subscription.protocol)}`}>
                              {getProtocolIcon(subscription.protocol)}
                            </div>
                            <Badge variant="outline">{subscription.protocol.toUpperCase()}</Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Owner: {subscription.owner}
                            </span>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 font-mono text-sm text-gray-900 dark:text-gray-100">
                            {subscription.endpoint}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSubscriptionToDelete(subscription.subscriptionArn)
                              setShowDeleteSubscriptionDialog(true)
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                  
                  {/* Subscription Pagination */}
                  {totalSubscriptionPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {((currentSubscriptionPage - 1) * itemsPerPage) + 1} to {Math.min(currentSubscriptionPage * itemsPerPage, filteredSubscriptions.length)} of {filteredSubscriptions.length} subscriptions
                        {subscriptionSearchTerm && ` (filtered from ${subscriptions.length} total)`}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentSubscriptionPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentSubscriptionPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Page {currentSubscriptionPage} of {totalSubscriptionPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentSubscriptionPage(prev => Math.min(prev + 1, totalSubscriptionPages))}
                          disabled={currentSubscriptionPage === totalSubscriptionPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Publish Message Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Publish Message</CardTitle>
                  <CardDescription>Send a message to all subscribers of this topic</CardDescription>
                </div>
                <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Publish Message
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Publish Message</DialogTitle>
                      <DialogDescription>
                        Send a message to all subscribers of the selected topic
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="subject">Subject (Optional)</Label>
                        <Input
                          id="subject"
                          value={publishMessage.subject}
                          onChange={(e) => setPublishMessage(prev => ({ ...prev, subject: e.target.value }))}
                          placeholder="Message subject"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="message">Message</Label>
                        <textarea
                          id="message"
                          value={publishMessage.message}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPublishMessage(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Enter your message here..."
                          className="mt-1 min-h-[100px] w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="messageAttributes">Message Attributes (JSON, Optional)</Label>
                        <textarea
                          id="messageAttributes"
                          value={publishMessage.messageAttributes}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPublishMessage(prev => ({ ...prev, messageAttributes: e.target.value }))}
                          placeholder='{"key": "value"}'
                          className="mt-1 min-h-[60px] w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handlePublishMessage}
                          disabled={!publishMessage.message.trim() || isPublishing}
                        >
                          {isPublishing ? 'Publishing...' : 'Publish Message'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Delete Subscription Dialog */}
      <Dialog open={showDeleteSubscriptionDialog} onOpenChange={setShowDeleteSubscriptionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this subscription? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteSubscriptionDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteSubscription}
            >
              Delete Subscription
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
