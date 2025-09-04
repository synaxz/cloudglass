'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, MessageSquare, RefreshCw, Copy, ExternalLink, Settings } from 'lucide-react'
import { AWSConfig } from '@/components/AWSConfig'
import { useAWSConfig } from '@/contexts/AWSConfigContext'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/contexts/ToastContext'

interface Queue {
  QueueUrl: string
  QueueArn?: string
  QueueName: string
  Attributes?: Record<string, string>
  Tags?: Record<string, string>
}

interface Message {
  MessageId?: string
  Body?: string
  ReceiptHandle?: string
  Attributes?: Record<string, string>
  MessageAttributes?: Record<string, unknown>
  SentTimestamp?: string
}

interface SQSManagerProps {
  isSettingsVisible: boolean
}

export function SQSManager({ isSettingsVisible }: SQSManagerProps) {
  const { showSuccess, showError } = useToast()
  
  // Use global AWS configuration context
  const { config, updateConfig, saveConfig } = useAWSConfig()
  
  const [queues, setQueues] = useState<Queue[]>([])
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newQueueName, setNewQueueName] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPurgeDialog, setShowPurgeDialog] = useState(false)
  const [queueToDelete, setQueueToDelete] = useState<string>('')
  const [queueToPurge, setQueueToPurge] = useState<string>('')
  const [newMessage, setNewMessage] = useState('')
  const [showSendMessageDialog, setShowSendMessageDialog] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [queueSettings, setQueueSettings] = useState({
    visibilityTimeout: '30',
    messageRetentionPeriod: '345600',
    maximumMessageSize: '262144',
    delaySeconds: '0',
    receiveMessageWaitTimeSeconds: '0'
  })
  const [queueConfig, setQueueConfig] = useState({
    visibilityTimeout: '30',
    messageRetentionPeriod: '345600',
    maximumMessageSize: '262144',
    delaySeconds: '0',
    receiveMessageWaitTimeSeconds: '0',
    redrivePolicy: '',
    kmsMasterKeyId: '',
    kmsDataKeyReusePeriodSeconds: '300',
    contentBasedDeduplication: 'false',
    fifoThroughputLimit: 'perQueue',
    deduplicationScope: 'queue'
  })

  // Pagination states
  const [currentQueuePage, setCurrentQueuePage] = useState(1)
  const [currentMessagePage, setCurrentMessagePage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // Search states
  const [queueSearchTerm, setQueueSearchTerm] = useState('')
  const [messageSearchTerm, setMessageSearchTerm] = useState('')

  // Removed direct SQS client usage - now using API client

  const loadQueues = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.getQueues(config)
      if (response.success && response.data) {
        const queues = response.data as Queue[]
        setQueues(queues)
        // Only show success message if there are queues
        if (queues.length > 0) {
          showSuccess('Queues Loaded', response.message || `Successfully loaded ${queues.length} queues`)
        }
      } else {
        showError('Error Loading Queues', response.error || 'Failed to load queues')
      }
    } catch (error) {
      console.error('Error loading queues:', error)
      showError('Error Loading Queues', 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [config, showError, showSuccess])

  useEffect(() => {
    loadQueues()
  }, [loadQueues])

  const handleCreateQueue = async () => {
    if (!newQueueName.trim()) return

    try {
      const attributes: Record<string, string> = {}
      
      // Add queue attributes if they differ from defaults
      if (queueSettings.visibilityTimeout !== '30') {
        attributes.VisibilityTimeout = queueSettings.visibilityTimeout
      }
      if (queueSettings.messageRetentionPeriod !== '345600') {
        attributes.MessageRetentionPeriod = queueSettings.messageRetentionPeriod
      }
      if (queueSettings.maximumMessageSize !== '262144') {
        attributes.MaximumMessageSize = queueSettings.maximumMessageSize
      }
      if (queueSettings.delaySeconds !== '0') {
        attributes.DelaySeconds = queueSettings.delaySeconds
      }
      if (queueSettings.receiveMessageWaitTimeSeconds !== '0') {
        attributes.ReceiveMessageWaitTimeSeconds = queueSettings.receiveMessageWaitTimeSeconds
      }

      const response = await apiClient.createQueue(config, newQueueName.trim(), Object.keys(attributes).length > 0 ? attributes : undefined)
      if (response.success) {
        setNewQueueName('')
        setShowCreateDialog(false)
        showSuccess('Queue Created', response.message || `Successfully created queue "${newQueueName.trim()}"`)
        loadQueues()
      } else {
        showError('Error Creating Queue', response.error || 'Failed to create queue')
      }
    } catch (error) {
      console.error('Error creating queue:', error)
      showError('Error Creating Queue', 'An unexpected error occurred')
    }
  }

  const handleDeleteQueue = async () => {
    if (!queueToDelete) return

    try {
      const response = await apiClient.deleteQueue(config, queueToDelete)
      if (response.success) {
        if (selectedQueue?.QueueUrl === queueToDelete) {
          setSelectedQueue(null)
          setMessages([])
        }
        
        setQueueToDelete('')
        setShowDeleteDialog(false)
        showSuccess('Queue Deleted', response.message || 'Successfully deleted queue')
        loadQueues()
      } else {
        showError('Error Deleting Queue', response.error || 'Failed to delete queue')
      }
    } catch (error) {
      console.error('Error deleting queue:', error)
      showError('Error Deleting Queue', 'An unexpected error occurred')
    }
  }

  const handlePurgeQueue = async () => {
    if (!queueToPurge) return

    try {
      const response = await apiClient.purgeQueue(config, queueToPurge)
      if (response.success) {
        if (selectedQueue?.QueueUrl === queueToPurge) {
          setMessages([])
        }
        
        setQueueToPurge('')
        setShowPurgeDialog(false)
        showSuccess('Queue Purged', response.message || 'Successfully purged all messages from the queue')
      } else {
        showError('Error Purging Queue', response.error || 'Failed to purge queue')
      }
    } catch (error) {
      console.error('Error purging queue:', error)
      showError('Error Purging Queue', 'An unexpected error occurred')
    }
  }

  const handleQueueSelect = (queue: Queue) => {
    setSelectedQueue(queue)
    setMessages([]) // Clear messages when selecting a new queue
    setCurrentMessagePage(1) // Reset message pagination when selecting new queue
  }

  // Search filtering functions
  const filterQueues = (queues: Queue[], searchTerm: string) => {
    if (!searchTerm.trim()) return queues
    return queues.filter(queue => 
      queue.QueueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      queue.QueueUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (queue.QueueArn && queue.QueueArn.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }

  const filterMessages = (messages: Message[], searchTerm: string) => {
    if (!searchTerm.trim()) return messages
    return messages.filter(message => 
      (message.MessageId && message.MessageId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (message.Body && message.Body.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }

  // Filter data based on search terms
  const filteredQueues = filterQueues(queues, queueSearchTerm)
  const filteredMessages = filterMessages(messages, messageSearchTerm)

  // Pagination calculations
  const totalQueuePages = Math.ceil(filteredQueues.length / itemsPerPage)
  const paginatedQueues = filteredQueues.slice(
    (currentQueuePage - 1) * itemsPerPage,
    currentQueuePage * itemsPerPage
  )

  const totalMessagePages = Math.ceil(filteredMessages.length / itemsPerPage)
  const paginatedMessages = filteredMessages.slice(
    (currentMessagePage - 1) * itemsPerPage,
    currentMessagePage * itemsPerPage
  )

  const handleOpenConfigDialog = () => {
    if (!selectedQueue?.Attributes) return
    
    // Load current queue attributes into the config form
    const attributes = selectedQueue.Attributes
    setQueueConfig({
      visibilityTimeout: attributes.VisibilityTimeout || '30',
      messageRetentionPeriod: attributes.MessageRetentionPeriod || '345600',
      maximumMessageSize: attributes.MaximumMessageSize || '262144',
      delaySeconds: attributes.DelaySeconds || '0',
      receiveMessageWaitTimeSeconds: attributes.ReceiveMessageWaitTimeSeconds || '0',
      redrivePolicy: attributes.RedrivePolicy || '',
      kmsMasterKeyId: attributes.KmsMasterKeyId || '',
      kmsDataKeyReusePeriodSeconds: attributes.KmsDataKeyReusePeriodSeconds || '300',
      contentBasedDeduplication: attributes.ContentBasedDeduplication || 'false',
      fifoThroughputLimit: attributes.FifoThroughputLimit || 'perQueue',
      deduplicationScope: attributes.DeduplicationScope || 'queue'
    })
    setShowConfigDialog(true)
  }

  const handleUpdateQueueConfig = async () => {
    if (!selectedQueue) return

    try {
      // Convert form data to attributes object, only including non-default values
      const attributes: Record<string, string> = {}
      
      if (queueConfig.visibilityTimeout !== '30') {
        attributes.VisibilityTimeout = queueConfig.visibilityTimeout
      }
      if (queueConfig.messageRetentionPeriod !== '345600') {
        attributes.MessageRetentionPeriod = queueConfig.messageRetentionPeriod
      }
      if (queueConfig.maximumMessageSize !== '262144') {
        attributes.MaximumMessageSize = queueConfig.maximumMessageSize
      }
      if (queueConfig.delaySeconds !== '0') {
        attributes.DelaySeconds = queueConfig.delaySeconds
      }
      if (queueConfig.receiveMessageWaitTimeSeconds !== '0') {
        attributes.ReceiveMessageWaitTimeSeconds = queueConfig.receiveMessageWaitTimeSeconds
      }
      if (queueConfig.redrivePolicy) {
        attributes.RedrivePolicy = queueConfig.redrivePolicy
      }
      if (queueConfig.kmsMasterKeyId) {
        attributes.KmsMasterKeyId = queueConfig.kmsMasterKeyId
      }
      if (queueConfig.kmsDataKeyReusePeriodSeconds !== '300') {
        attributes.KmsDataKeyReusePeriodSeconds = queueConfig.kmsDataKeyReusePeriodSeconds
      }
      if (queueConfig.contentBasedDeduplication !== 'false') {
        attributes.ContentBasedDeduplication = queueConfig.contentBasedDeduplication
      }
      if (queueConfig.fifoThroughputLimit !== 'perQueue') {
        attributes.FifoThroughputLimit = queueConfig.fifoThroughputLimit
      }
      if (queueConfig.deduplicationScope !== 'queue') {
        attributes.DeduplicationScope = queueConfig.deduplicationScope
      }

      const response = await apiClient.updateQueueAttributes(config, selectedQueue.QueueUrl, attributes)
      if (response.success) {
        setShowConfigDialog(false)
        showSuccess('Queue Updated', response.message || 'Successfully updated queue configuration')
        // Reload queues to get updated attributes
        loadQueues()
      } else {
        showError('Error Updating Queue', response.error || 'Failed to update queue configuration')
      }
    } catch (error) {
      console.error('Error updating queue config:', error)
      showError('Error Updating Queue', 'An unexpected error occurred')
    }
  }

  const loadMessages = async (queueUrl: string) => {
    try {
      const response = await apiClient.getMessages(config, queueUrl)
      if (response.success && response.data) {
        const messages = response.data as Message[]
        setMessages(messages)
        // Only show success message if there are messages
        if (messages.length > 0) {
          showSuccess('Messages Loaded', response.message || `Successfully loaded ${messages.length} messages`)
        }
      } else {
        showError('Error Loading Messages', response.error || 'Failed to load messages')
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      showError('Error Loading Messages', 'An unexpected error occurred')
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedQueue) return

    try {
      const response = await apiClient.sendMessage(config, selectedQueue.QueueUrl, newMessage.trim())
      if (response.success) {
        setNewMessage('')
        setShowSendMessageDialog(false)
        showSuccess('Message Sent', response.message || 'Successfully sent message to the queue')
        await loadMessages(selectedQueue.QueueUrl)
      } else {
        showError('Error Sending Message', response.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      showError('Error Sending Message', 'An unexpected error occurred')
    }
  }

  const handleDeleteMessage = async (receiptHandle: string) => {
    if (!selectedQueue) return

    try {
      const response = await apiClient.deleteMessage(config, selectedQueue.QueueUrl, receiptHandle)
      if (response.success) {
        showSuccess('Message Deleted', response.message || 'Successfully deleted message from the queue')
        await loadMessages(selectedQueue.QueueUrl)
      } else {
        showError('Error Deleting Message', response.error || 'Failed to delete message')
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      showError('Error Deleting Message', 'An unexpected error occurred')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(parseInt(timestamp)).toLocaleString()
  }

  const getQueueType = (attributes: Record<string, string> | undefined) => {
    if (!attributes) return 'Standard'
    return attributes.FifoQueue === 'true' ? 'FIFO' : 'Standard'
  }

  const getQueueStatus = (attributes: Record<string, string> | undefined) => {
    if (!attributes) return 'Unknown'
    return attributes.QueueArn ? 'Active' : 'Creating'
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

      {/* Queues Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Available Queues</CardTitle>
              <CardDescription>Select a queue to view its contents and manage messages</CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Queue
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Queue</DialogTitle>
                  <DialogDescription>
                    Configure your new SQS queue with custom settings
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="newQueueName">Queue Name</Label>
                    <Input
                      id="newQueueName"
                      value={newQueueName}
                      onChange={(e) => setNewQueueName(e.target.value)}
                      placeholder="my-queue"
                    />
                  </div>
                  
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                      <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
                    </TabsList>
                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="visibilityTimeout">Visibility Timeout (seconds)</Label>
                          <Input
                            id="visibilityTimeout"
                            value={queueSettings.visibilityTimeout}
                            onChange={(e) => setQueueSettings(prev => ({ ...prev, visibilityTimeout: e.target.value }))}
                            type="number"
                            min="0"
                            max="43200"
                          />
                          <p className="text-xs text-gray-500">Time a message is invisible after being received</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="messageRetentionPeriod">Message Retention (seconds)</Label>
                          <Input
                            id="messageRetentionPeriod"
                            value={queueSettings.messageRetentionPeriod}
                            onChange={(e) => setQueueSettings(prev => ({ ...prev, messageRetentionPeriod: e.target.value }))}
                            type="number"
                            min="60"
                            max="1209600"
                          />
                          <p className="text-xs text-gray-500">How long messages are kept in the queue</p>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="advanced" className="space-y-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="maximumMessageSize">Maximum Message Size (bytes)</Label>
                          <Input
                            id="maximumMessageSize"
                            value={queueSettings.maximumMessageSize}
                            onChange={(e) => setQueueSettings(prev => ({ ...prev, maximumMessageSize: e.target.value }))}
                            type="number"
                            min="1024"
                            max="262144"
                          />
                          <p className="text-xs text-gray-500">Maximum size of a message (1024-262144 bytes)</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="delaySeconds">Delay Seconds</Label>
                          <Input
                            id="delaySeconds"
                            value={queueSettings.delaySeconds}
                            onChange={(e) => setQueueSettings(prev => ({ ...prev, delaySeconds: e.target.value }))}
                            type="number"
                            min="0"
                            max="900"
                          />
                          <p className="text-xs text-gray-500">Delay before messages become visible (0-900 seconds)</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="receiveMessageWaitTimeSeconds">Receive Message Wait Time (seconds)</Label>
                          <Input
                            id="receiveMessageWaitTimeSeconds"
                            value={queueSettings.receiveMessageWaitTimeSeconds}
                            onChange={(e) => setQueueSettings(prev => ({ ...prev, receiveMessageWaitTimeSeconds: e.target.value }))}
                            type="number"
                            min="0"
                            max="20"
                          />
                          <p className="text-xs text-gray-500">Long polling wait time (0-20 seconds)</p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateQueue} disabled={!newQueueName.trim()}>
                      Create Queue
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
              placeholder="Search queues by name, URL, or ARN..."
              value={queueSearchTerm}
              onChange={(e) => {
                setQueueSearchTerm(e.target.value)
                setCurrentQueuePage(1) // Reset to first page when searching
              }}
              className="max-w-md"
            />
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">Loading queues...</div>
          ) : filteredQueues.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {queueSearchTerm ? 'No queues found matching your search' : 'No queues found'}
            </div>
          ) : (
            <>
              <div className="grid gap-3">
                {paginatedQueues.map((queue) => (
                <div
                  key={queue.QueueUrl}
                  className={`p-4 border rounded-lg transition-colors ${
                    selectedQueue?.QueueUrl === queue.QueueUrl
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => handleQueueSelect(queue)}
                    >
                      <MessageSquare className={`h-5 w-5 ${
                        selectedQueue?.QueueUrl === queue.QueueUrl 
                          ? 'text-green-600 dark:text-green-300' 
                          : 'text-green-500 dark:text-green-400'
                      }`} />
                      <div>
                        <h3 className={`font-medium ${
                          selectedQueue?.QueueUrl === queue.QueueUrl 
                            ? 'text-blue-700 dark:text-blue-100' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>{queue.QueueName}</h3>
                        <div className={`flex items-center gap-2 text-sm ${
                          selectedQueue?.QueueUrl === queue.QueueUrl 
                            ? 'text-blue-600 dark:text-blue-200' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          <span>Type: {getQueueType(queue.Attributes)}</span>
                          <span>•</span>
                          <span>Status: {getQueueStatus(queue.Attributes)}</span>
                          {queue.Attributes?.ApproximateNumberOfMessages && (
                            <>
                              <span>•</span>
                              <span>Messages: {queue.Attributes.ApproximateNumberOfMessages}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedQueue?.QueueUrl === queue.QueueUrl && (
                        <Badge variant="secondary">Selected</Badge>
                      )}
                      
                      {/* Purge Queue Button */}
                      <Dialog open={showPurgeDialog && queueToPurge === queue.QueueUrl} onOpenChange={(open) => {
                        if (open) {
                          setQueueToPurge(queue.QueueUrl)
                          setShowPurgeDialog(true)
                        } else {
                          setShowPurgeDialog(false)
                          setQueueToPurge('')
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              setQueueToPurge(queue.QueueUrl)
                              setShowPurgeDialog(true)
                            }}
                          >
                            <RefreshCw className="h-4 w-4" />
                            Purge
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Purge Queue</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to purge the queue &quot;{queue.QueueName}&quot;? 
                              This will delete all messages in the queue and cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowPurgeDialog(false)}>
                              Cancel
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={handlePurgeQueue}
                            >
                              Purge Queue
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Delete Queue Button */}
                      <Dialog open={showDeleteDialog && queueToDelete === queue.QueueUrl} onOpenChange={(open) => {
                        if (open) {
                          setQueueToDelete(queue.QueueUrl)
                          setShowDeleteDialog(true)
                        } else {
                          setShowDeleteDialog(false)
                          setQueueToDelete('')
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              setQueueToDelete(queue.QueueUrl)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Queue</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete the queue &quot;{queue.QueueName}&quot;? 
                              This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                              Cancel
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={handleDeleteQueue}
                            >
                              Delete Queue
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
              </div>
              
              {/* Queue Pagination */}
              {totalQueuePages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {((currentQueuePage - 1) * itemsPerPage) + 1} to {Math.min(currentQueuePage * itemsPerPage, filteredQueues.length)} of {filteredQueues.length} queues
                    {queueSearchTerm && ` (filtered from ${queues.length} total)`}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentQueuePage(prev => Math.max(prev - 1, 1))}
                      disabled={currentQueuePage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page {currentQueuePage} of {totalQueuePages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentQueuePage(prev => Math.min(prev + 1, totalQueuePages))}
                      disabled={currentQueuePage === totalQueuePages}
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

      {/* Queue Details Section - Only show when a queue is selected */}
      {selectedQueue && (
        <div className="space-y-4">
          {/* Queue Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Queue: {selectedQueue.QueueName}</CardTitle>
                  <CardDescription>Queue details and configuration</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleOpenConfigDialog}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Configure
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(selectedQueue.QueueUrl)}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy URL
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedQueue.QueueUrl, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open URL
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Queue URL</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={selectedQueue.QueueUrl} readOnly className="font-mono text-sm" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(selectedQueue.QueueUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {selectedQueue.Attributes && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Queue Type</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{getQueueType(selectedQueue.Attributes)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{getQueueStatus(selectedQueue.Attributes)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Visibility Timeout</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {selectedQueue.Attributes.VisibilityTimeout || '30'} seconds
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Message Retention</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {selectedQueue.Attributes.MessageRetentionPeriod || '345600'} seconds
                      </p>
                    </div>
                    {selectedQueue.Attributes.ApproximateNumberOfMessages && (
                      <div>
                        <Label className="text-sm font-medium">Approximate Messages</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {selectedQueue.Attributes.ApproximateNumberOfMessages}
                        </p>
                      </div>
                    )}
                    {selectedQueue.Attributes.ApproximateNumberOfMessagesNotVisible && (
                      <div>
                        <Label className="text-sm font-medium">In Flight Messages</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {selectedQueue.Attributes.ApproximateNumberOfMessagesNotVisible}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Messages Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Messages</CardTitle>
                  <CardDescription>View and manage messages in the queue</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => loadMessages(selectedQueue.QueueUrl)}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Receive Message
                  </Button>
                  <Dialog open={showSendMessageDialog} onOpenChange={setShowSendMessageDialog}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Send Message
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send Message</DialogTitle>
                        <DialogDescription>
                          Send a new message to the queue
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="newMessage">Message Body</Label>
                          <textarea
                            id="newMessage"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Enter your message here..."
                            className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setShowSendMessageDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                            Send Message
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
                  placeholder="Search messages by ID or body content..."
                  value={messageSearchTerm}
                  onChange={(e) => {
                    setMessageSearchTerm(e.target.value)
                    setCurrentMessagePage(1) // Reset to first page when searching
                  }}
                  className="max-w-md"
                />
              </div>
              
              {filteredMessages.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p>{messageSearchTerm ? 'No messages found matching your search' : 'No messages in the queue'}</p>
                  <p className="text-sm">Messages will appear here when they are received</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedMessages.map((message) => (
                     <div key={message.MessageId || 'unknown'} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                       <div className="flex items-start justify-between">
                         <div className="flex-1">
                           <div className="flex items-center gap-2 mb-2">
                             <Badge variant="outline">{message.MessageId || 'Unknown ID'}</Badge>
                             {message.SentTimestamp && (
                               <span className="text-xs text-gray-500 dark:text-gray-400">
                                 Sent: {formatTimestamp(message.SentTimestamp)}
                               </span>
                             )}
                           </div>
                           <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 font-mono text-sm text-gray-900 dark:text-gray-100">
                             {message.Body || 'No body'}
                           </div>
                         </div>
                         <div className="flex gap-2 ml-4">
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => message.ReceiptHandle && handleDeleteMessage(message.ReceiptHandle)}
                             className="text-red-600 hover:text-red-700"
                             disabled={!message.ReceiptHandle}
                           >
                             <Trash2 className="h-4 w-4" />
                             Delete
                           </Button>
                         </div>
                       </div>
                     </div>
                   ))}
                  </div>
                  
                  {/* Message Pagination */}
                  {totalMessagePages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {((currentMessagePage - 1) * itemsPerPage) + 1} to {Math.min(currentMessagePage * itemsPerPage, filteredMessages.length)} of {filteredMessages.length} messages
                        {messageSearchTerm && ` (filtered from ${messages.length} total)`}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentMessagePage(prev => Math.max(prev - 1, 1))}
                          disabled={currentMessagePage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Page {currentMessagePage} of {totalMessagePages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentMessagePage(prev => Math.min(prev + 1, totalMessagePages))}
                          disabled={currentMessagePage === totalMessagePages}
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
        </div>
      )}

      {/* Queue Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Queue: {selectedQueue?.QueueName}</DialogTitle>
            <DialogDescription>
              Update the configuration settings for this SQS queue
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
                <TabsTrigger value="fifo">FIFO Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="config-visibilityTimeout">Visibility Timeout (seconds)</Label>
                    <Input
                      id="config-visibilityTimeout"
                      value={queueConfig.visibilityTimeout}
                      onChange={(e) => setQueueConfig(prev => ({ ...prev, visibilityTimeout: e.target.value }))}
                      type="number"
                      min="0"
                      max="43200"
                    />
                    <p className="text-xs text-gray-500">Time a message is invisible after being received (0-43200 seconds)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="config-messageRetentionPeriod">Message Retention (seconds)</Label>
                    <Input
                      id="config-messageRetentionPeriod"
                      value={queueConfig.messageRetentionPeriod}
                      onChange={(e) => setQueueConfig(prev => ({ ...prev, messageRetentionPeriod: e.target.value }))}
                      type="number"
                      min="60"
                      max="1209600"
                    />
                    <p className="text-xs text-gray-500">How long messages are kept in the queue (60-1209600 seconds)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="config-maximumMessageSize">Maximum Message Size (bytes)</Label>
                    <Input
                      id="config-maximumMessageSize"
                      value={queueConfig.maximumMessageSize}
                      onChange={(e) => setQueueConfig(prev => ({ ...prev, maximumMessageSize: e.target.value }))}
                      type="number"
                      min="1024"
                      max="262144"
                    />
                    <p className="text-xs text-gray-500">Maximum size of a message (1024-262144 bytes)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="config-delaySeconds">Delivery Delay (seconds)</Label>
                    <Input
                      id="config-delaySeconds"
                      value={queueConfig.delaySeconds}
                      onChange={(e) => setQueueConfig(prev => ({ ...prev, delaySeconds: e.target.value }))}
                      type="number"
                      min="0"
                      max="900"
                    />
                    <p className="text-xs text-gray-500">Delay before messages become visible (0-900 seconds)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="config-receiveMessageWaitTimeSeconds">Receive Message Wait Time (seconds)</Label>
                    <Input
                      id="config-receiveMessageWaitTimeSeconds"
                      value={queueConfig.receiveMessageWaitTimeSeconds}
                      onChange={(e) => setQueueConfig(prev => ({ ...prev, receiveMessageWaitTimeSeconds: e.target.value }))}
                      type="number"
                      min="0"
                      max="20"
                    />
                    <p className="text-xs text-gray-500">Long polling wait time (0-20 seconds)</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="config-redrivePolicy">Redrive Policy (Dead Letter Queue)</Label>
                    <textarea
                      id="config-redrivePolicy"
                      value={queueConfig.redrivePolicy}
                      onChange={(e) => setQueueConfig(prev => ({ ...prev, redrivePolicy: e.target.value }))}
                      placeholder='{"deadLetterTargetArn":"arn:aws:sqs:region:account:queue-name","maxReceiveCount":3}'
                      className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">JSON policy for dead letter queue configuration</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="config-kmsMasterKeyId">KMS Master Key ID</Label>
                      <Input
                        id="config-kmsMasterKeyId"
                        value={queueConfig.kmsMasterKeyId}
                        onChange={(e) => setQueueConfig(prev => ({ ...prev, kmsMasterKeyId: e.target.value }))}
                        placeholder="alias/aws/sqs"
                      />
                      <p className="text-xs text-gray-500">KMS key for server-side encryption</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="config-kmsDataKeyReusePeriodSeconds">KMS Data Key Reuse Period (seconds)</Label>
                      <Input
                        id="config-kmsDataKeyReusePeriodSeconds"
                        value={queueConfig.kmsDataKeyReusePeriodSeconds}
                        onChange={(e) => setQueueConfig(prev => ({ ...prev, kmsDataKeyReusePeriodSeconds: e.target.value }))}
                        type="number"
                        min="60"
                        max="86400"
                      />
                      <p className="text-xs text-gray-500">How long KMS data keys are reused (60-86400 seconds)</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="fifo" className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="config-contentBasedDeduplication">Content-Based Deduplication</Label>
                    <select
                      id="config-contentBasedDeduplication"
                      value={queueConfig.contentBasedDeduplication}
                      onChange={(e) => setQueueConfig(prev => ({ ...prev, contentBasedDeduplication: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="false">Disabled</option>
                      <option value="true">Enabled</option>
                    </select>
                    <p className="text-xs text-gray-500">Automatically deduplicate messages based on content (FIFO queues only)</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="config-fifoThroughputLimit">FIFO Throughput Limit</Label>
                      <select
                        id="config-fifoThroughputLimit"
                        value={queueConfig.fifoThroughputLimit}
                        onChange={(e) => setQueueConfig(prev => ({ ...prev, fifoThroughputLimit: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="perQueue">Per Queue</option>
                        <option value="perMessageGroupId">Per Message Group ID</option>
                      </select>
                      <p className="text-xs text-gray-500">Throughput quota scope (FIFO queues only)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="config-deduplicationScope">Deduplication Scope</Label>
                      <select
                        id="config-deduplicationScope"
                        value={queueConfig.deduplicationScope}
                        onChange={(e) => setQueueConfig(prev => ({ ...prev, deduplicationScope: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="queue">Queue Level</option>
                        <option value="messageGroup">Message Group Level</option>
                      </select>
                      <p className="text-xs text-gray-500">Deduplication scope (FIFO queues only)</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateQueueConfig}>
                Update Configuration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
