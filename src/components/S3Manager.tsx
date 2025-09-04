'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Plus, Upload, Download, Trash2, Folder, File, X, Settings } from 'lucide-react'
import { Tree } from '@/components/ui/tree'
import { useToast } from '@/contexts/ToastContext'
import { AWSConfig } from '@/components/AWSConfig'
import { useAWSConfig } from '@/contexts/AWSConfigContext'
import { apiClient } from '@/lib/api-client'

interface TreeNode {
  id: string
  name: string
  type: 'folder' | 'file'
  children?: TreeNode[]
  size?: number
  lastModified?: Date
  path: string
}

interface Bucket {
  Name: string
  CreationDate: Date | string
}

interface S3Object {
  Key: string
  Size: number
  LastModified: Date | string
  StorageClass?: string
}

interface S3ManagerProps {
  isSettingsVisible: boolean
}

interface CORSRule {
  AllowedOrigins?: string[]
  AllowedMethods?: string[]
  AllowedHeaders?: string[]
  MaxAgeSeconds?: number
}

interface Tag {
  Key?: string
  Value?: string
}

export function S3Manager({ isSettingsVisible }: S3ManagerProps) {
  const { showSuccess, showError } = useToast()
  const showErrorRef = useRef(showError)
  showErrorRef.current = showError
  
  const { config, updateConfig, saveConfig } = useAWSConfig()
  
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [selectedBucket, setSelectedBucket] = useState<string>('')
  const [treeData, setTreeData] = useState<TreeNode[]>([])
  const [isLoadingBuckets, setIsLoadingBuckets] = useState(false)
  const [isLoadingObjects, setIsLoadingObjects] = useState(false)
  const [newBucketName, setNewBucketName] = useState('')

  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploadPath, setUploadPath] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [bucketToDelete, setBucketToDelete] = useState<string>('')
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingFileName, setUploadingFileName] = useState<string>('')
  const [uploadAbortController, setUploadAbortController] = useState<AbortController | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [showSingleDeleteDialog, setShowSingleDeleteDialog] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<TreeNode | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [bucketConfig, setBucketConfig] = useState({
    versioning: 'Suspended',
    encryption: { enabled: false, algorithm: 'AES256', kmsKeyId: '' },
    cors: [] as Record<string, unknown>[],
    acl: [] as Record<string, unknown>[],
    tags: [] as Record<string, unknown>[],
    transferAcceleration: 'Suspended'
  })
  const [isDragOver, setIsDragOver] = useState(false)
  
  // Pagination states
  const [currentBucketPage, setCurrentBucketPage] = useState(1)
  const [currentObjectPage, setCurrentObjectPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // Search states
  const [bucketSearchTerm, setBucketSearchTerm] = useState('')
  const [objectSearchTerm, setObjectSearchTerm] = useState('')

  const loadBuckets = useCallback(async () => {
    setIsLoadingBuckets(true)
    try {
      const response = await apiClient.getBuckets(config)
      if (response.success && response.data) {
        const buckets = response.data as Bucket[]
        setBuckets(buckets)
        // Only show success message if there are buckets
        if (buckets.length > 0) {
          showSuccess('Buckets Loaded', response.message || `Successfully loaded ${buckets.length} buckets`)
        }
      } else {
        showErrorRef.current('Error Loading Buckets', response.error || 'Failed to load buckets')
      }
    } catch (error) {
      console.error('Error loading buckets:', error)
      showErrorRef.current('Error Loading Buckets', 'An unexpected error occurred')
    } finally {
      setIsLoadingBuckets(false)
    }
  }, [config])

  useEffect(() => {
    loadBuckets()
  }, [config])

  const loadObjects = async (bucketName: string) => {
    setIsLoadingObjects(true)
    try {
      const response = await apiClient.getObjects(config, bucketName)
      if (response.success && response.data) {
        // Build tree structure
        const objects = response.data as S3Object[]
        const tree = buildTreeFromObjects(objects)
        setTreeData(tree)
        // Only show success message if there are objects
        if (objects.length > 0) {
          showSuccess('Objects Loaded', response.message || `Successfully loaded ${objects.length} objects from ${bucketName}`)
        }
      } else {
        showErrorRef.current('Error Loading Objects', response.error || 'Failed to load objects')
      }
    } catch (error) {
      console.error('Error loading objects:', error)
      showErrorRef.current('Error Loading Objects', 'An unexpected error occurred')
    } finally {
      setIsLoadingObjects(false)
    }
  }

  const handleBucketSelect = (bucketName: string) => {
    setSelectedBucket(bucketName)
    setCurrentObjectPage(1) // Reset object pagination when selecting new bucket
    if (bucketName) {
      loadObjects(bucketName)
    } else {
      setTreeData([])
    }
  }

  // Search filtering functions
  const filterBuckets = (buckets: Bucket[], searchTerm: string) => {
    if (!searchTerm.trim()) return buckets
    return buckets.filter(bucket => 
      bucket.Name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const filterObjects = (objects: TreeNode[], searchTerm: string) => {
    if (!searchTerm.trim()) return objects
    return objects.filter(obj => 
      obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obj.path.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Filter data based on search terms
  const filteredBuckets = filterBuckets(buckets, bucketSearchTerm)
  const filteredObjects = filterObjects(treeData, objectSearchTerm)

  // Pagination calculations
  const totalBucketPages = Math.ceil(filteredBuckets.length / itemsPerPage)
  const paginatedBuckets = filteredBuckets.slice(
    (currentBucketPage - 1) * itemsPerPage,
    currentBucketPage * itemsPerPage
  )

  const totalObjectPages = Math.ceil(filteredObjects.length / itemsPerPage)
  const paginatedObjects = filteredObjects.slice(
    (currentObjectPage - 1) * itemsPerPage,
    currentObjectPage * itemsPerPage
  )

  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) return

    try {
      const response = await apiClient.createBucket(config, newBucketName.trim())
      if (response.success) {
        setNewBucketName('')
        setShowCreateDialog(false)
        showSuccess('Bucket Created', response.message || `Successfully created bucket "${newBucketName.trim()}"`)
        loadBuckets()
      } else {
        showError('Error Creating Bucket', response.error || 'Failed to create bucket')
      }
    } catch (error) {
      console.error('Error creating bucket:', error)
      showError('Error Creating Bucket', 'An unexpected error occurred')
    }
  }

  const handleDeleteBucket = async () => {
    if (!bucketToDelete) return

    try {
      // First, delete all objects in the bucket
      const objectsResponse = await apiClient.getObjects(config, bucketToDelete)
      if (objectsResponse.success && objectsResponse.data) {
        for (const obj of objectsResponse.data as S3Object[]) {
          await apiClient.deleteObject(config, bucketToDelete, (obj as S3Object).Key)
        }
      }

      // Then delete the bucket
      const response = await apiClient.deleteBucket(config, bucketToDelete)
      if (response.success) {
        if (selectedBucket === bucketToDelete) {
          setSelectedBucket('')
          setTreeData([])
        }
        
        setBucketToDelete('')
        setShowDeleteDialog(false)
        showSuccess('Bucket Deleted', response.message || `Successfully deleted bucket "${bucketToDelete}"`)
        loadBuckets()
      } else {
        showError('Error Deleting Bucket', response.error || 'Failed to delete bucket')
      }
    } catch (error) {
      console.error('Error deleting bucket:', error)
      showError('Error Deleting Bucket', 'An unexpected error occurred')
    }
  }

  const handleFileUpload = async () => {
    if (uploadFiles.length === 0 || !selectedBucket) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      let successCount = 0
      let errorCount = 0

      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i]
        setUploadingFileName(file.name)
        setUploadProgress((i / uploadFiles.length) * 100)

        try {
          const key = uploadPath ? `${uploadPath}/${file.name}` : file.name
          const response = await apiClient.uploadObject(config, selectedBucket, key, file)
          
          if (response.success) {
            successCount++
          } else {
            errorCount++
            console.error(`Failed to upload ${file.name}:`, response.error)
          }
        } catch (error) {
          errorCount++
          console.error(`Error uploading ${file.name}:`, error)
        }
      }

      setUploadProgress(100)
      
      // Show results
      if (successCount > 0) {
        showSuccess('Files Uploaded', `Successfully uploaded ${successCount} file(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`)
        loadObjects(selectedBucket)
      } else {
        showError('Upload Failed', `Failed to upload ${uploadFiles.length} file(s)`)
      }

      // Clear the upload queue
      setUploadFiles([])
      setUploadPath('')
    } catch (error) {
      console.error('Error uploading files:', error)
      showError('Error Uploading Files', 'An unexpected error occurred')
    } finally {
      setIsUploading(false)
      setUploadingFileName('')
      // Reset progress after a short delay to show completion
      setTimeout(() => setUploadProgress(0), 2000)
    }
  }

  const handleCancelUpload = () => {
    if (uploadAbortController) {
      uploadAbortController.abort()
    }
    setIsUploading(false)
    setUploadProgress(0)
    setUploadingFileName('')
    setUploadAbortController(null)
    showError('Upload Cancelled', 'File upload was cancelled by user')
  }

  const handleFileDownload = async (key: string) => {
    if (!selectedBucket) return

    try {
      const response = await apiClient.getDownloadUrl(config, selectedBucket, key)
      if (response.success && response.data) {
        const link = document.createElement('a')
        link.href = (response.data as { downloadUrl: string }).downloadUrl
        link.download = key
        link.click()
        showSuccess('Download Started', response.message || `Download started for "${key}"`)
      } else {
        showError('Error Downloading File', response.error || 'Failed to generate download URL')
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      showError('Error Downloading File', 'An unexpected error occurred')
    }
  }





  const buildTreeFromObjects = (objects: S3Object[]): TreeNode[] => {
    const treeMap = new Map<string, TreeNode>()
    const rootNodes: TreeNode[] = []

    // Sort objects by key to ensure folders come before files
    const sortedObjects = [...objects].sort((a, b) => a.Key.localeCompare(b.Key))

    for (const obj of sortedObjects) {
      const pathParts = obj.Key.split('/')
      let currentPath = ''
      
      // Build the folder structure
      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderName = pathParts[i]
        if (!folderName) continue
        
        const parentPath = currentPath
        currentPath = currentPath ? `${currentPath}/${folderName}` : folderName
        
        if (!treeMap.has(currentPath)) {
          const folderNode: TreeNode = {
            id: currentPath,
            name: folderName,
            type: 'folder',
            path: currentPath,
            children: []
          }
          treeMap.set(currentPath, folderNode)
          
          if (parentPath) {
            const parent = treeMap.get(parentPath)
            if (parent) {
              parent.children!.push(folderNode)
            }
          } else {
            rootNodes.push(folderNode)
          }
        }
      }
      
      // Add the file
      const fileName = pathParts[pathParts.length - 1]
      if (fileName) {
        const fileNode: TreeNode = {
          id: obj.Key,
          name: fileName,
          type: 'file',
          size: obj.Size,
          lastModified: new Date(obj.LastModified),
          path: obj.Key,
          children: []
        }
        
        if (pathParts.length === 1) {
          // File is in root
          rootNodes.push(fileNode)
        } else {
          // File is in a folder
          const parentPath = currentPath
          const parent = treeMap.get(parentPath)
          if (parent) {
            parent.children!.push(fileNode)
          }
        }
      }
    }

    return rootNodes
  }

  const handleTreeNodeClick = (node: TreeNode) => {
    setSelectedNode(node)
  }

  const handleFileAction = (action: 'download', node: TreeNode) => {
    if (node.type === 'file' && action === 'download') {
      handleFileDownload(node.path)
    }
  }

  const handleBulkDownload = async () => {
    if (!selectedBucket || selectedFiles.size === 0) return

    setIsDownloading(true)
    try {
      // Get all file paths first
      const filePaths: string[] = []
      for (const fileId of selectedFiles) {
        const findFileInTree = (nodes: TreeNode[]): string | null => {
          for (const node of nodes) {
            if (node.id === fileId && node.type === 'file') {
              return node.path
            }
            if (node.children) {
              const found = findFileInTree(node.children)
              if (found) return found
            }
          }
          return null
        }
        
        const filePath = findFileInTree(treeData)
        if (filePath) {
          filePaths.push(filePath)
        }
      }

      if (filePaths.length === 0) {
        showError('Error Downloading Files', 'No valid files found to download')
        return
      }

      // Download files sequentially with a small delay to avoid browser blocking
      let successCount = 0
      for (let i = 0; i < filePaths.length; i++) {
        const filePath = filePaths[i]
        try {
          const response = await apiClient.getDownloadUrl(config, selectedBucket, filePath)
          if (response.success && response.data) {
            // Create download link
            const link = document.createElement('a')
            link.href = (response.data as { downloadUrl: string }).downloadUrl
            link.download = filePath.split('/').pop() || filePath
            link.style.display = 'none'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            successCount++
            
            // Small delay between downloads to prevent browser blocking
            if (i < filePaths.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500))
            }
          }
        } catch (error) {
          console.error(`Error downloading ${filePath}:`, error)
        }
      }
      
      if (successCount > 0) {
        showSuccess('Downloads Started', `Started downloading ${successCount} of ${filePaths.length} file(s)`)
      } else {
        showError('Error Downloading Files', 'Failed to download any files')
      }
    } catch (error) {
      console.error('Error downloading files:', error)
      showError('Error Downloading Files', 'An unexpected error occurred')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleConfirmSingleDelete = async () => {
    if (!fileToDelete || !selectedBucket) return

    try {
      const response = await apiClient.deleteObject(config, selectedBucket, fileToDelete.path)
      if (response.success) {
        showSuccess('File Deleted', response.message || `Successfully deleted "${fileToDelete.name}"`)
        loadObjects(selectedBucket)
        setShowSingleDeleteDialog(false)
        setFileToDelete(null)
      } else {
        showError('Error Deleting File', response.error || 'Failed to delete file')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      showError('Error Deleting File', 'An unexpected error occurred')
    }
  }

  const handleFileSelect = (node: TreeNode, isSelected: boolean) => {
    if (node.type === 'file') {
      setSelectedFiles(prev => {
        const newSet = new Set(prev)
        if (isSelected) {
          newSet.add(node.id)
        } else {
          newSet.delete(node.id)
        }
        return newSet
      })
    }
  }

  const handleBulkDelete = async () => {
    if (!selectedBucket || selectedFiles.size === 0) return

    try {
      const deletePromises = Array.from(selectedFiles).map(async (fileId) => {
        // Find the file path from the tree data
        const findFileInTree = (nodes: TreeNode[]): string | null => {
          for (const node of nodes) {
            if (node.id === fileId && node.type === 'file') {
              return node.path
            }
            if (node.children) {
              const found = findFileInTree(node.children)
              if (found) return found
            }
          }
          return null
        }
        
        const filePath = findFileInTree(treeData)
        if (filePath) {
          return apiClient.deleteObject(config, selectedBucket, filePath)
        }
        return null
      })

      const results = await Promise.all(deletePromises.filter(Boolean))
      const successCount = results.filter(r => r?.success).length
      
      if (successCount > 0) {
        showSuccess('Files Deleted', `Successfully deleted ${successCount} file(s)`)
        setSelectedFiles(new Set())
        setShowBulkDeleteDialog(false)
        loadObjects(selectedBucket)
      } else {
        showError('Error Deleting Files', 'Failed to delete selected files')
      }
    } catch (error) {
      console.error('Error deleting files:', error)
      showError('Error Deleting Files', 'An unexpected error occurred')
    }
  }

  const clearSelection = () => {
    setSelectedFiles(new Set())
  }

  const handleOpenConfigDialog = async () => {
    if (!selectedBucket) return
    
    try {
      const response = await apiClient.getBucketAttributes(config, selectedBucket)
      if (response.success && response.data) {
        setBucketConfig(response.data as typeof bucketConfig)
        setShowConfigDialog(true)
      } else {
        showError('Error Loading Configuration', response.error || 'Failed to load bucket configuration')
      }
    } catch (error) {
      console.error('Error loading bucket config:', error)
      showError('Error Loading Configuration', 'An unexpected error occurred')
    }
  }

  const handleUpdateBucketConfig = async () => {
    if (!selectedBucket) return

    try {
      const response = await apiClient.updateBucketAttributes(config, selectedBucket, bucketConfig)
      if (response.success) {
        setShowConfigDialog(false)
        showSuccess('Bucket Updated', response.message || 'Successfully updated bucket configuration')
      } else {
        showError('Error Updating Bucket', response.error || 'Failed to update bucket configuration')
      }
    } catch (error) {
      console.error('Error updating bucket config:', error)
      showError('Error Updating Bucket', 'An unexpected error occurred')
    }
  }

  const addCorsRule = () => {
    setBucketConfig(prev => ({
      ...prev,
      cors: [...prev.cors, {
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET'],
        AllowedOrigins: ['*'],
        ExposeHeaders: [],
        MaxAgeSeconds: 3000
      }]
    }))
  }

  const removeCorsRule = (index: number) => {
    setBucketConfig(prev => ({
      ...prev,
      cors: prev.cors.filter((_, i) => i !== index)
    }))
  }

  const addTag = () => {
    setBucketConfig(prev => ({
      ...prev,
      tags: [...prev.tags, { Key: '', Value: '' }]
    }))
  }

  const removeTag = (index: number) => {
    setBucketConfig(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    // Add files to the upload list
    setUploadFiles(prev => [...prev, ...files])
    showSuccess('Files Added', `Added ${files.length} file(s) to upload queue`)
  }

  return (
    <div className="space-y-6">
      {/* Settings Panel - Controlled by parent component */}
      <AWSConfig
        isVisible={isSettingsVisible}
        config={config}
        onConfigChange={updateConfig}
        onSave={saveConfig}
        showForcePathStyle={true}
        onValidationError={(error) => showError('Configuration Error', error)}
      />

      {/* Buckets Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Available Buckets</CardTitle>
              <CardDescription>Select a bucket to view its contents</CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Bucket
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Bucket</DialogTitle>
                  <DialogDescription>
                    Enter a name for your new S3 bucket. Bucket names must be globally unique.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newBucketName">Bucket Name</Label>
                    <Input
                      id="newBucketName"
                      value={newBucketName}
                      onChange={(e) => setNewBucketName(e.target.value)}
                      placeholder="my-new-bucket"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateBucket} disabled={!newBucketName.trim()}>
                      Create Bucket
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
              placeholder="Search buckets by name..."
              value={bucketSearchTerm}
              onChange={(e) => {
                setBucketSearchTerm(e.target.value)
                setCurrentBucketPage(1) // Reset to first page when searching
              }}
              className="max-w-md"
            />
          </div>
          
          {isLoadingBuckets ? (
            <div className="text-center py-8">Loading buckets...</div>
          ) : filteredBuckets.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {bucketSearchTerm ? 'No buckets found matching your search' : 'No buckets found'}
            </div>
          ) : (
            <>
              <div className="grid gap-3">
                {paginatedBuckets.map((bucket) => (
                <div
                  key={bucket.Name}
                  className={`p-4 border rounded-lg transition-colors ${
                    selectedBucket === bucket.Name
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => handleBucketSelect(bucket.Name)}
                    >
                      <Folder className={`h-5 w-5 ${
                        selectedBucket === bucket.Name 
                          ? 'text-blue-600 dark:text-blue-300' 
                          : 'text-blue-500 dark:text-blue-400'
                      }`} />
                      <div>
                        <h3 className={`font-medium ${
                          selectedBucket === bucket.Name 
                            ? 'text-blue-700 dark:text-blue-100' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>{bucket.Name}</h3>
                        <p className={`text-sm ${
                          selectedBucket === bucket.Name 
                            ? 'text-blue-600 dark:text-blue-200' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          Created: {new Date(bucket.CreationDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedBucket === bucket.Name && (
                        <Badge variant="secondary">Selected</Badge>
                      )}
                      <Dialog open={showDeleteDialog && bucketToDelete === bucket.Name} onOpenChange={(open) => {
                        if (open) {
                          setBucketToDelete(bucket.Name)
                          setShowDeleteDialog(true)
                        } else {
                          setShowDeleteDialog(false)
                          setBucketToDelete('')
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              setBucketToDelete(bucket.Name)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Bucket</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete the bucket &quot;{bucket.Name}&quot;? 
                              This action cannot be undone and will delete all objects in the bucket.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                              Cancel
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={handleDeleteBucket}
                            >
                              Delete Bucket
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
              </div>
              
              {/* Bucket Pagination */}
              {totalBucketPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {((currentBucketPage - 1) * itemsPerPage) + 1} to {Math.min(currentBucketPage * itemsPerPage, filteredBuckets.length)} of {filteredBuckets.length} buckets
                    {bucketSearchTerm && ` (filtered from ${buckets.length} total)`}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentBucketPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentBucketPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page {currentBucketPage} of {totalBucketPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentBucketPage(prev => Math.min(prev + 1, totalBucketPages))}
                      disabled={currentBucketPage === totalBucketPages}
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

      {/* Bucket Contents Section - Only show when a bucket is selected */}
      {selectedBucket && (
        <div className="space-y-4">
          {/* Bucket Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bucket: {selectedBucket}</CardTitle>
                  <CardDescription>Bucket details and configuration</CardDescription>
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Bucket Name: <span className="font-mono text-gray-900 dark:text-gray-100">{selectedBucket}</span></p>
                <p>Region: <span className="font-mono text-gray-900 dark:text-gray-100">{config.region}</span></p>
                <p>Endpoint: <span className="font-mono text-gray-900 dark:text-gray-100">{config.endpoint}</span></p>
              </div>
            </CardContent>
          </Card>

          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Files to {selectedBucket}</CardTitle>
              <CardDescription>Upload files by dragging and dropping or using the file picker</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="uploadPath">Upload Path (optional)</Label>
                  <Input
                    id="uploadPath"
                    value={uploadPath}
                    onChange={(e) => setUploadPath(e.target.value)}
                    placeholder="folder/subfolder (leave empty for root)"
                    disabled={isUploading}
                  />
                </div>
                
                {/* Drag and Drop Zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragOver
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                  <p className={`text-lg font-medium mb-2 ${isDragOver ? 'text-blue-600' : 'text-gray-600'}`}>
                    {isDragOver ? 'Drop files here' : 'Drag and drop files here'}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    or use the file picker below
                  </p>
                  
                  <div className="flex gap-4 justify-center">
                    <Input
                      type="file"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        if (files.length > 0) {
                          setUploadFiles(prev => [...prev, ...files])
                          showSuccess('Files Added', `Added ${files.length} file(s) to upload queue`)
                        }
                      }}
                      className="flex-1 max-w-xs"
                      disabled={isUploading}
                    />
                    {!isUploading ? (
                      <Button
                        onClick={handleFileUpload}
                        disabled={uploadFiles.length === 0}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload {uploadFiles.length > 0 ? `(${uploadFiles.length})` : ''}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleCancelUpload}
                        variant="outline"
                        className="flex items-center gap-2 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* File Queue */}
                {uploadFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Files to Upload ({uploadFiles.length})</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setUploadFiles([])}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear All
                      </Button>
                    </div>
                    <div className="max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1">
                      {uploadFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4 text-gray-500" />
                            <span className="truncate">{file.name}</span>
                            <span className="text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setUploadFiles(prev => prev.filter((_, i) => i !== index))}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Uploading {uploadingFileName}...</span>
                      <span className="text-gray-500">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tree View */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bucket Contents</CardTitle>
                  <CardDescription>
                    Files and folders in {selectedBucket}
                    {selectedFiles.size > 0 && (
                      <span className="ml-2 text-blue-600 font-medium">
                        ({selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected)
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {selectedFiles.size > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={clearSelection}
                      className="text-gray-600"
                    >
                      Clear Selection
                    </Button>
                  )}
                  {(selectedFiles.size > 0 || (selectedNode && selectedNode.type === 'file')) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (selectedFiles.size > 0) {
                          handleBulkDownload()
                        } else if (selectedNode && selectedNode.type === 'file') {
                          handleFileAction('download', selectedNode)
                        }
                      }}
                      disabled={isDownloading || (selectedFiles.size === 0 && (!selectedNode || selectedNode.type !== 'file'))}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      {isDownloading 
                        ? 'Downloading...' 
                        : selectedFiles.size > 0 
                          ? `Download Selected (${selectedFiles.size})` 
                          : 'Download'
                      }
                    </Button>
                  )}
                  {(selectedFiles.size > 0 || (selectedNode && selectedNode.type === 'file')) && (
                    <Dialog open={showBulkDeleteDialog || showSingleDeleteDialog} onOpenChange={(open) => {
                      if (!open) {
                        setShowBulkDeleteDialog(false)
                        setShowSingleDeleteDialog(false)
                        setFileToDelete(null)
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (selectedFiles.size > 0) {
                              setShowBulkDeleteDialog(true)
                            } else if (selectedNode && selectedNode.type === 'file') {
                              setFileToDelete(selectedNode)
                              setShowSingleDeleteDialog(true)
                            }
                          }}
                          disabled={selectedFiles.size === 0 && (!selectedNode || selectedNode.type !== 'file')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {selectedFiles.size > 0 
                            ? `Delete Selected (${selectedFiles.size})` 
                            : 'Delete'
                          }
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {selectedFiles.size > 0 ? 'Delete Selected Files' : 'Delete File'}
                          </DialogTitle>
                          <DialogDescription>
                            {selectedFiles.size > 0 
                              ? `Are you sure you want to delete ${selectedFiles.size} selected file${selectedFiles.size !== 1 ? 's' : ''}? This action cannot be undone.`
                              : `Are you sure you want to delete the file "${selectedNode?.name}"? This action cannot be undone.`
                            }
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => {
                            setShowBulkDeleteDialog(false)
                            setShowSingleDeleteDialog(false)
                            setFileToDelete(null)
                          }}>
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={() => {
                              if (selectedFiles.size > 0) {
                                handleBulkDelete()
                              } else {
                                handleConfirmSingleDelete()
                              }
                            }}
                          >
                            {selectedFiles.size > 0 
                              ? `Delete ${selectedFiles.size} File${selectedFiles.size !== 1 ? 's' : ''}`
                              : 'Delete File'
                            }
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search Input */}
              <div className="mb-4">
                <Input
                  placeholder="Search objects by name or path..."
                  value={objectSearchTerm}
                  onChange={(e) => {
                    setObjectSearchTerm(e.target.value)
                    setCurrentObjectPage(1) // Reset to first page when searching
                  }}
                  className="max-w-md"
                />
              </div>
              
              {isLoadingObjects ? (
                <div className="text-center py-8">Loading objects...</div>
              ) : filteredObjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {objectSearchTerm ? 'No objects found matching your search' : 'No objects found'}
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <strong>File Selection:</strong> Click on files to select them. Use Ctrl/Cmd+click for multiple selection. 
                      Selected files will be highlighted in blue.
                    </div>
                    <div className="border rounded-lg p-4">
                      <Tree 
                        data={paginatedObjects} 
                        onNodeClick={handleTreeNodeClick}
                        onNodeSelect={handleFileSelect}
                        selectedNodes={selectedFiles}
                        className="min-h-[200px]"
                      />
                    </div>
                  </div>
                  
                  {/* Object Pagination */}
                  {totalObjectPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {((currentObjectPage - 1) * itemsPerPage) + 1} to {Math.min(currentObjectPage * itemsPerPage, filteredObjects.length)} of {filteredObjects.length} objects
                        {objectSearchTerm && ` (filtered from ${treeData.length} total)`}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentObjectPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentObjectPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Page {currentObjectPage} of {totalObjectPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentObjectPage(prev => Math.min(prev + 1, totalObjectPages))}
                          disabled={currentObjectPage === totalObjectPages}
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

      {/* Bucket Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Bucket: {selectedBucket}</DialogTitle>
            <DialogDescription>
              Update the configuration settings for this S3 bucket
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="cors">CORS</TabsTrigger>
                <TabsTrigger value="tags">Tags</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="config-versioning">Versioning</Label>
                    <select
                      id="config-versioning"
                      value={bucketConfig.versioning}
                      onChange={(e) => setBucketConfig(prev => ({ ...prev, versioning: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Suspended">Suspended</option>
                      <option value="Enabled">Enabled</option>
                    </select>
                    <p className="text-xs text-gray-500">Enable versioning to keep multiple versions of objects</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="config-transferAcceleration">Transfer Acceleration</Label>
                    <select
                      id="config-transferAcceleration"
                      value={bucketConfig.transferAcceleration}
                      onChange={(e) => setBucketConfig(prev => ({ ...prev, transferAcceleration: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Suspended">Suspended</option>
                      <option value="Enabled">Enabled</option>
                    </select>
                    <p className="text-xs text-gray-500">Speed up content transfers using CloudFront edge locations</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="security" className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="config-encryption-enabled">Server-Side Encryption</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="config-encryption-enabled"
                        checked={bucketConfig.encryption.enabled}
                        onChange={(e) => setBucketConfig(prev => ({ 
                          ...prev, 
                          encryption: { ...prev.encryption, enabled: e.target.checked }
                        }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="config-encryption-enabled" className="text-sm">Enable encryption</Label>
                    </div>
                    <p className="text-xs text-gray-500">Automatically encrypt all objects stored in the bucket</p>
                  </div>
                  
                  {bucketConfig.encryption.enabled && (
                    <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                      <div className="space-y-2">
                        <Label htmlFor="config-encryption-algorithm">Encryption Algorithm</Label>
                        <select
                          id="config-encryption-algorithm"
                          value={bucketConfig.encryption.algorithm}
                          onChange={(e) => setBucketConfig(prev => ({ 
                            ...prev, 
                            encryption: { ...prev.encryption, algorithm: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="AES256">AES256</option>
                          <option value="aws:kms">AWS KMS</option>
                        </select>
                        <p className="text-xs text-gray-500">Choose the encryption algorithm</p>
                      </div>
                      
                      {bucketConfig.encryption.algorithm === 'aws:kms' && (
                        <div className="space-y-2">
                          <Label htmlFor="config-encryption-kmsKeyId">KMS Key ID</Label>
                          <Input
                            id="config-encryption-kmsKeyId"
                            value={bucketConfig.encryption.kmsKeyId}
                            onChange={(e) => setBucketConfig(prev => ({ 
                              ...prev, 
                              encryption: { ...prev.encryption, kmsKeyId: e.target.value }
                            }))}
                            placeholder="alias/aws/s3"
                          />
                          <p className="text-xs text-gray-500">KMS key for encryption (optional, uses default if empty)</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="cors" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>CORS Rules</Label>
                    <Button onClick={addCorsRule} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Rule
                    </Button>
                  </div>
                  
                  {bucketConfig.cors.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No CORS rules configured</p>
                      <p className="text-sm">Click &quot;Add Rule&quot; to create a new CORS rule</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bucketConfig.cors.map((rule, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">CORS Rule {index + 1}</h4>
                            <Button 
                              onClick={() => removeCorsRule(index)} 
                              size="sm" 
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Allowed Origins</Label>
                              <Input
                                value={Array.isArray((rule as CORSRule).AllowedOrigins) ? (rule as CORSRule).AllowedOrigins?.join(', ') || '' : (rule as CORSRule).AllowedOrigins || ''}
                                onChange={(e) => {
                                  const newCors = [...bucketConfig.cors]
                                  newCors[index] = { ...(rule as CORSRule), AllowedOrigins: e.target.value.split(',').map(s => s.trim()) }
                                  setBucketConfig(prev => ({ ...prev, cors: newCors }))
                                }}
                                placeholder="* or https://example.com"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Allowed Methods</Label>
                              <Input
                                value={Array.isArray((rule as CORSRule).AllowedMethods) ? (rule as CORSRule).AllowedMethods?.join(', ') || '' : (rule as CORSRule).AllowedMethods || ''}
                                onChange={(e) => {
                                  const newCors = [...bucketConfig.cors]
                                  newCors[index] = { ...(rule as CORSRule), AllowedMethods: e.target.value.split(',').map(s => s.trim()) }
                                  setBucketConfig(prev => ({ ...prev, cors: newCors }))
                                }}
                                placeholder="GET, POST, PUT, DELETE"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Allowed Headers</Label>
                              <Input
                                value={Array.isArray((rule as CORSRule).AllowedHeaders) ? (rule as CORSRule).AllowedHeaders?.join(', ') || '' : (rule as CORSRule).AllowedHeaders || ''}
                                onChange={(e) => {
                                  const newCors = [...bucketConfig.cors]
                                  newCors[index] = { ...(rule as CORSRule), AllowedHeaders: e.target.value.split(',').map(s => s.trim()) }
                                  setBucketConfig(prev => ({ ...prev, cors: newCors }))
                                }}
                                placeholder="* or Content-Type, Authorization"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Max Age (seconds)</Label>
                              <Input
                                type="number"
                                value={(rule as CORSRule).MaxAgeSeconds || 3000}
                                onChange={(e) => {
                                  const newCors = [...bucketConfig.cors]
                                  newCors[index] = { ...(rule as CORSRule), MaxAgeSeconds: parseInt(e.target.value) || 3000 }
                                  setBucketConfig(prev => ({ ...prev, cors: newCors }))
                                }}
                                min="0"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="tags" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Bucket Tags</Label>
                    <Button onClick={addTag} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Tag
                    </Button>
                  </div>
                  
                  {bucketConfig.tags.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No tags configured</p>
                      <p className="text-sm">Click &quot;Add Tag&quot; to create a new tag</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bucketConfig.tags.map((tag, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="flex-1">
                            <Label className="text-sm">Key</Label>
                            <Input
                              value={(tag as Tag).Key || ''}
                              onChange={(e) => {
                                const newTags = [...bucketConfig.tags]
                                newTags[index] = { ...(tag as Tag), Key: e.target.value }
                                setBucketConfig(prev => ({ ...prev, tags: newTags }))
                              }}
                              placeholder="Environment"
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-sm">Value</Label>
                            <Input
                              value={(tag as Tag).Value || ''}
                              onChange={(e) => {
                                const newTags = [...bucketConfig.tags]
                                newTags[index] = { ...(tag as Tag), Value: e.target.value }
                                setBucketConfig(prev => ({ ...prev, tags: newTags }))
                              }}
                              placeholder="Production"
                            />
                          </div>
                          <Button 
                            onClick={() => removeTag(index)} 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 hover:text-red-700 mt-6"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateBucketConfig}>
                Update Configuration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
