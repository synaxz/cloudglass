'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Plus, 
  Trash2, 
  User, 
  Shield, 
  FileText, 
  Eye,
  EyeOff,
  Copy,
  Download
} from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { AWSConfig } from '@/components/AWSConfig'
import { useAWSConfig } from '@/contexts/AWSConfigContext'
import { apiClient } from '@/lib/api-client'

interface IAMManagerProps {
  isSettingsVisible: boolean
}

interface IAMUser {
  UserName: string
  UserId: string
  Arn: string
  CreateDate: Date | string
  Path?: string
  Tags?: Array<{ Key: string; Value: string }>
}

interface IAMRole {
  RoleName: string
  RoleId: string
  Arn: string
  CreateDate: Date | string
  Path?: string
  AssumeRolePolicyDocument?: string
  Description?: string
  MaxSessionDuration?: number
  Tags?: Array<{ Key: string; Value: string }>
}

interface IAMPolicy {
  PolicyName: string
  PolicyId: string
  Arn: string
  CreateDate: Date | string
  UpdateDate: Date | string
  Path?: string
  Description?: string
  PolicyVersion?: {
    VersionId: string
    IsDefaultVersion: boolean
    CreateDate: Date | string
  }
  Tags?: Array<{ Key: string; Value: string }>
}

export function IAMManager({ isSettingsVisible }: IAMManagerProps) {
  const { showSuccess, showError } = useToast()
  
  // Use global AWS configuration context
  const { config, updateConfig, saveConfig } = useAWSConfig()
  
  const [users, setUsers] = useState<IAMUser[]>([])
  const [roles, setRoles] = useState<IAMRole[]>([])
  const [policies, setPolicies] = useState<IAMPolicy[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(false)

  // Dialog states
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false)
  const [showCreateRoleDialog, setShowCreateRoleDialog] = useState(false)
  const [showCreatePolicyDialog, setShowCreatePolicyDialog] = useState(false)
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false)
  const [showDeleteRoleDialog, setShowDeleteRoleDialog] = useState(false)
  const [showDeletePolicyDialog, setShowDeletePolicyDialog] = useState(false)
  
  // Form states
  const [newUserName, setNewUserName] = useState('')
  const [newRoleName, setNewRoleName] = useState('')
  const [newPolicyName, setNewPolicyName] = useState('')
  const [newPolicyDocument, setNewPolicyDocument] = useState('')
  const [newRoleDescription, setNewRoleDescription] = useState('')
  const [newRoleTrustPolicy, setNewRoleTrustPolicy] = useState('')
  
  // Items to delete
  const [userToDelete, setUserToDelete] = useState<string>('')
  const [roleToDelete, setRoleToDelete] = useState<string>('')
  const [policyToDelete, setPolicyToDelete] = useState<string>('')
  
  // View states
  const [showPolicyDocument, setShowPolicyDocument] = useState<Record<string, boolean>>({})
  
  // Pagination states
  const [currentUserPage, setCurrentUserPage] = useState(1)
  const [currentRolePage, setCurrentRolePage] = useState(1)
  const [currentPolicyPage, setCurrentPolicyPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // Search states
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [roleSearchTerm, setRoleSearchTerm] = useState('')
  const [policySearchTerm, setPolicySearchTerm] = useState('')


  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true)
    try {
      const response = await apiClient.getIAMUsers(config)
      if (response.success && response.data) {
        const users = response.data as IAMUser[]
        setUsers(users)
        // Only show success message if there are users
        if (users.length > 0) {
          showSuccess('Users Loaded', response.message || `Successfully loaded ${users.length} users`)
        }
      } else {
        showError('Error Loading Users', response.error || 'Failed to load users')
      }
    } catch (error) {
      console.error('Error loading users:', error)
      showError('Error Loading Users', 'An unexpected error occurred')
    } finally {
      setIsLoadingUsers(false)
    }
  }, [config])

  const loadRoles = useCallback(async () => {
    setIsLoadingRoles(true)
    try {
      const response = await apiClient.getIAMRoles(config)
      if (response.success && response.data) {
        const roles = response.data as IAMRole[]
        setRoles(roles)
        // Only show success message if there are roles
        if (roles.length > 0) {
          showSuccess('Roles Loaded', response.message || `Successfully loaded ${roles.length} roles`)
        }
      } else {
        showError('Error Loading Roles', response.error || 'Failed to load roles')
      }
    } catch (error) {
      console.error('Error loading roles:', error)
      showError('Error Loading Roles', 'An unexpected error occurred')
    } finally {
      setIsLoadingRoles(false)
    }
  }, [config])

  const loadPolicies = useCallback(async () => {
    setIsLoadingPolicies(true)
    try {
      const response = await apiClient.getIAMPolicies(config)
      if (response.success && response.data) {
        const policies = response.data as IAMPolicy[]
        setPolicies(policies)
        // Only show success message if there are policies
        if (policies.length > 0) {
          showSuccess('Policies Loaded', response.message || `Successfully loaded ${policies.length} policies`)
        }
      } else {
        showError('Error Loading Policies', response.error || 'Failed to load policies')
      }
    } catch (error) {
      console.error('Error loading policies:', error)
      showError('Error Loading Policies', 'An unexpected error occurred')
    } finally {
      setIsLoadingPolicies(false)
    }
  }, [config])

  useEffect(() => {
    loadUsers()
    loadRoles()
    loadPolicies()
  }, [config])

  const handleCreateUser = async () => {
    if (!newUserName.trim()) return

    try {
      const response = await apiClient.createIAMUser(config, newUserName.trim())
      if (response.success) {
        setNewUserName('')
        setShowCreateUserDialog(false)
        showSuccess('User Created', response.message || `Successfully created user "${newUserName.trim()}"`)
        loadUsers()
      } else {
        showError('Error Creating User', response.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      showError('Error Creating User', 'An unexpected error occurred')
    }
  }

  const handleCreateRole = async () => {
    if (!newRoleName.trim() || !newRoleTrustPolicy.trim()) return

    try {
      const response = await apiClient.createIAMRole(config, newRoleName.trim(), newRoleTrustPolicy, newRoleDescription)
      if (response.success) {
        setNewRoleName('')
        setNewRoleDescription('')
        setNewRoleTrustPolicy('')
        setShowCreateRoleDialog(false)
        showSuccess('Role Created', response.message || `Successfully created role "${newRoleName.trim()}"`)
        loadRoles()
      } else {
        showError('Error Creating Role', response.error || 'Failed to create role')
      }
    } catch (error) {
      console.error('Error creating role:', error)
      showError('Error Creating Role', 'An unexpected error occurred')
    }
  }

  const handleCreatePolicy = async () => {
    if (!newPolicyName.trim() || !newPolicyDocument.trim()) return

    try {
      const response = await apiClient.createIAMPolicy(config, newPolicyName.trim(), newPolicyDocument)
      if (response.success) {
        setNewPolicyName('')
        setNewPolicyDocument('')
        setShowCreatePolicyDialog(false)
        showSuccess('Policy Created', response.message || `Successfully created policy "${newPolicyName.trim()}"`)
        loadPolicies()
      } else {
        showError('Error Creating Policy', response.error || 'Failed to create policy')
      }
    } catch (error) {
      console.error('Error creating policy:', error)
      showError('Error Creating Policy', 'An unexpected error occurred')
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      const response = await apiClient.deleteIAMUser(config, userToDelete)
      if (response.success) {
        setUserToDelete('')
        setShowDeleteUserDialog(false)
        showSuccess('User Deleted', response.message || `Successfully deleted user "${userToDelete}"`)
        loadUsers()
      } else {
        showError('Error Deleting User', response.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      showError('Error Deleting User', 'An unexpected error occurred')
    }
  }

  const handleDeleteRole = async () => {
    if (!roleToDelete) return

    try {
      const response = await apiClient.deleteIAMRole(config, roleToDelete)
      if (response.success) {
        setRoleToDelete('')
        setShowDeleteRoleDialog(false)
        showSuccess('Role Deleted', response.message || `Successfully deleted role "${roleToDelete}"`)
        loadRoles()
      } else {
        showError('Error Deleting Role', response.error || 'Failed to delete role')
      }
    } catch (error) {
      console.error('Error deleting role:', error)
      showError('Error Deleting Role', 'An unexpected error occurred')
    }
  }

  const handleDeletePolicy = async () => {
    if (!policyToDelete) return

    try {
      const response = await apiClient.deleteIAMPolicy(config, policyToDelete)
      if (response.success) {
        setPolicyToDelete('')
        setShowDeletePolicyDialog(false)
        showSuccess('Policy Deleted', response.message || `Successfully deleted policy "${policyToDelete}"`)
        loadPolicies()
      } else {
        showError('Error Deleting Policy', response.error || 'Failed to delete policy')
      }
    } catch (error) {
      console.error('Error deleting policy:', error)
      showError('Error Deleting Policy', 'An unexpected error occurred')
    }
  }

  const togglePolicyDocument = (policyName: string) => {
    setShowPolicyDocument(prev => ({
      ...prev,
      [policyName]: !prev[policyName]
    }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showSuccess('Copied', 'Text copied to clipboard')
  }

  const downloadPolicyDocument = (policyName: string, policyDocument: string) => {
    const blob = new Blob([policyDocument], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${policyName}-policy.json`
    link.click()
    URL.revokeObjectURL(url)
    showSuccess('Downloaded', 'Policy document downloaded')
  }

  // Search filtering functions
  const filterUsers = (users: IAMUser[], searchTerm: string) => {
    if (!searchTerm.trim()) return users
    return users.filter(user => 
      user.UserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.UserId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.Arn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.Path && user.Path.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }

  const filterRoles = (roles: IAMRole[], searchTerm: string) => {
    if (!searchTerm.trim()) return roles
    return roles.filter(role => 
      role.RoleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.RoleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.Arn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.Description && role.Description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (role.Path && role.Path.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }

  const filterPolicies = (policies: IAMPolicy[], searchTerm: string) => {
    if (!searchTerm.trim()) return policies
    return policies.filter(policy => 
      policy.PolicyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.PolicyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.Arn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (policy.Description && policy.Description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (policy.Path && policy.Path.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }

  // Filter data based on search terms
  const filteredUsers = filterUsers(users, userSearchTerm)
  const filteredRoles = filterRoles(roles, roleSearchTerm)
  const filteredPolicies = filterPolicies(policies, policySearchTerm)

  // Pagination calculations
  const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedUsers = filteredUsers.slice(
    (currentUserPage - 1) * itemsPerPage,
    currentUserPage * itemsPerPage
  )

  const totalRolePages = Math.ceil(filteredRoles.length / itemsPerPage)
  const paginatedRoles = filteredRoles.slice(
    (currentRolePage - 1) * itemsPerPage,
    currentRolePage * itemsPerPage
  )

  const totalPolicyPages = Math.ceil(filteredPolicies.length / itemsPerPage)
  const paginatedPolicies = filteredPolicies.slice(
    (currentPolicyPage - 1) * itemsPerPage,
    currentPolicyPage * itemsPerPage
  )

  const defaultTrustPolicy = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}`

  const defaultPolicyDocument = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::example-bucket/*"
    }
  ]
}`

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

      {/* IAM Management Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Policies
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>IAM Users</CardTitle>
                  <CardDescription>Manage user accounts and access permissions</CardDescription>
                </div>
                <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New IAM User</DialogTitle>
                      <DialogDescription>
                        Create a new IAM user with a unique username.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="newUserName">Username</Label>
                        <Input
                          id="newUserName"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          placeholder="my-new-user"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setShowCreateUserDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateUser} disabled={!newUserName.trim()}>
                          Create User
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
                  placeholder="Search users by name, ID, ARN, or path..."
                  value={userSearchTerm}
                  onChange={(e) => {
                    setUserSearchTerm(e.target.value)
                    setCurrentUserPage(1) // Reset to first page when searching
                  }}
                  className="max-w-md"
                />
              </div>
              
              {isLoadingUsers ? (
                <div className="text-center py-8">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {userSearchTerm ? 'No users found matching your search' : 'No users found'}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Path</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers.map((user) => (
                      <TableRow key={user.UserName}>
                        <TableCell className="font-medium">{user.UserName}</TableCell>
                        <TableCell className="font-mono text-sm">{user.UserId}</TableCell>
                        <TableCell>{new Date(user.CreateDate).toLocaleDateString()}</TableCell>
                        <TableCell>{user.Path || '/'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setUserToDelete(user.UserName)
                                setShowDeleteUserDialog(true)
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    </TableBody>
                  </Table>
                  
                  {/* User Pagination */}
                  {totalUserPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {((currentUserPage - 1) * itemsPerPage) + 1} to {Math.min(currentUserPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                        {userSearchTerm && ` (filtered from ${users.length} total)`}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentUserPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentUserPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Page {currentUserPage} of {totalUserPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentUserPage(prev => Math.min(prev + 1, totalUserPages))}
                          disabled={currentUserPage === totalUserPages}
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
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>IAM Roles</CardTitle>
                  <CardDescription>Manage roles and their trust policies</CardDescription>
                </div>
                <Dialog open={showCreateRoleDialog} onOpenChange={setShowCreateRoleDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New IAM Role</DialogTitle>
                      <DialogDescription>
                        Create a new IAM role with a trust policy.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="newRoleName">Role Name</Label>
                        <Input
                          id="newRoleName"
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          placeholder="my-new-role"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newRoleDescription">Description (optional)</Label>
                        <Input
                          id="newRoleDescription"
                          value={newRoleDescription}
                          onChange={(e) => setNewRoleDescription(e.target.value)}
                          placeholder="Role description"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newRoleTrustPolicy">Trust Policy</Label>
                        <textarea
                          id="newRoleTrustPolicy"
                          value={newRoleTrustPolicy}
                          onChange={(e) => setNewRoleTrustPolicy(e.target.value)}
                          placeholder={defaultTrustPolicy}
                          className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm"
                        />
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setNewRoleTrustPolicy(defaultTrustPolicy)}
                          >
                            Use Default
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(newRoleTrustPolicy)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setShowCreateRoleDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateRole} disabled={!newRoleName.trim() || !newRoleTrustPolicy.trim()}>
                          Create Role
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
                  placeholder="Search roles by name, ID, ARN, description, or path..."
                  value={roleSearchTerm}
                  onChange={(e) => {
                    setRoleSearchTerm(e.target.value)
                    setCurrentRolePage(1) // Reset to first page when searching
                  }}
                  className="max-w-md"
                />
              </div>
              
              {isLoadingRoles ? (
                <div className="text-center py-8">Loading roles...</div>
              ) : filteredRoles.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {roleSearchTerm ? 'No roles found matching your search' : 'No roles found'}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role Name</TableHead>
                        <TableHead>Role ID</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRoles.map((role) => (
                      <TableRow key={role.RoleName}>
                        <TableCell className="font-medium">{role.RoleName}</TableCell>
                        <TableCell className="font-mono text-sm">{role.RoleId}</TableCell>
                        <TableCell>{new Date(role.CreateDate).toLocaleDateString()}</TableCell>
                        <TableCell>{role.Description || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRoleToDelete(role.RoleName)
                                setShowDeleteRoleDialog(true)
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    </TableBody>
                  </Table>
                  
                  {/* Role Pagination */}
                  {totalRolePages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {((currentRolePage - 1) * itemsPerPage) + 1} to {Math.min(currentRolePage * itemsPerPage, filteredRoles.length)} of {filteredRoles.length} roles
                        {roleSearchTerm && ` (filtered from ${roles.length} total)`}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentRolePage(prev => Math.max(prev - 1, 1))}
                          disabled={currentRolePage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Page {currentRolePage} of {totalRolePages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentRolePage(prev => Math.min(prev + 1, totalRolePages))}
                          disabled={currentRolePage === totalRolePages}
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
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>IAM Policies</CardTitle>
                  <CardDescription>Manage custom IAM policies and their documents</CardDescription>
                </div>
                <Dialog open={showCreatePolicyDialog} onOpenChange={setShowCreatePolicyDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create Policy
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New IAM Policy</DialogTitle>
                      <DialogDescription>
                        Create a new IAM policy with a JSON policy document.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="newPolicyName">Policy Name</Label>
                        <Input
                          id="newPolicyName"
                          value={newPolicyName}
                          onChange={(e) => setNewPolicyName(e.target.value)}
                          placeholder="my-new-policy"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newPolicyDocument">Policy Document</Label>
                        <textarea
                          id="newPolicyDocument"
                          value={newPolicyDocument}
                          onChange={(e) => setNewPolicyDocument(e.target.value)}
                          placeholder={defaultPolicyDocument}
                          className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm"
                        />
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setNewPolicyDocument(defaultPolicyDocument)}
                          >
                            Use Default
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(newPolicyDocument)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setShowCreatePolicyDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreatePolicy} disabled={!newPolicyName.trim() || !newPolicyDocument.trim()}>
                          Create Policy
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
                  placeholder="Search policies by name, ID, ARN, description, or path..."
                  value={policySearchTerm}
                  onChange={(e) => {
                    setPolicySearchTerm(e.target.value)
                    setCurrentPolicyPage(1) // Reset to first page when searching
                  }}
                  className="max-w-md"
                />
              </div>
              
              {isLoadingPolicies ? (
                <div className="text-center py-8">Loading policies...</div>
              ) : filteredPolicies.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {policySearchTerm ? 'No policies found matching your search' : 'No policies found'}
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {paginatedPolicies.map((policy) => (
                    <Card key={policy.PolicyName} className="border border-gray-200 dark:border-gray-700">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{policy.PolicyName}</CardTitle>
                            <CardDescription className="flex items-center gap-4 mt-1">
                              <span>ID: {policy.PolicyId}</span>
                              <span>Created: {new Date(policy.CreateDate).toLocaleDateString()}</span>
                              {policy.Description && <span>Description: {policy.Description}</span>}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => togglePolicyDocument(policy.PolicyName)}
                              className="flex items-center gap-1"
                            >
                              {showPolicyDocument[policy.PolicyName] ? (
                                <>
                                  <EyeOff className="h-4 w-4" />
                                  Hide
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4" />
                                  View
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setPolicyToDelete(policy.PolicyName)
                                setShowDeletePolicyDialog(true)
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {showPolicyDocument[policy.PolicyName] && (
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">Policy Document</Label>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(JSON.stringify(policy, null, 2))}
                                >
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadPolicyDocument(policy.PolicyName, JSON.stringify(policy, null, 2))}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                              <pre className="text-sm font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap overflow-x-auto">
                                {JSON.stringify(policy, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                  </div>
                  
                  {/* Policy Pagination */}
                  {totalPolicyPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {((currentPolicyPage - 1) * itemsPerPage) + 1} to {Math.min(currentPolicyPage * itemsPerPage, filteredPolicies.length)} of {filteredPolicies.length} policies
                        {policySearchTerm && ` (filtered from ${policies.length} total)`}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPolicyPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPolicyPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Page {currentPolicyPage} of {totalPolicyPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPolicyPage(prev => Math.min(prev + 1, totalPolicyPages))}
                          disabled={currentPolicyPage === totalPolicyPages}
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
        </TabsContent>
      </Tabs>

      {/* Delete User Dialog */}
      <Dialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete IAM User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the user &quot;{userToDelete}&quot;? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteUserDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <Dialog open={showDeleteRoleDialog} onOpenChange={setShowDeleteRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete IAM Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role &quot;{roleToDelete}&quot;? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteRoleDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRole}>
              Delete Role
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Policy Dialog */}
      <Dialog open={showDeletePolicyDialog} onOpenChange={setShowDeletePolicyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete IAM Policy</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the policy &quot;{policyToDelete}&quot;? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowDeletePolicyDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePolicy}>
              Delete Policy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
