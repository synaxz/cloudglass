'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TreeNode {
  id: string
  name: string
  type: 'folder' | 'file'
  size?: number
  lastModified?: Date
  children?: TreeNode[]
  path: string
}

interface TreeProps {
  data: TreeNode[]
  onNodeClick?: (node: TreeNode) => void
  onNodeSelect?: (node: TreeNode, isSelected: boolean) => void
  selectedNodes?: Set<string>
  className?: string
}

interface TreeNodeProps {
  node: TreeNode
  level: number
  onNodeClick?: (node: TreeNode) => void
  onNodeSelect?: (node: TreeNode, isSelected: boolean) => void
  selectedNodes?: Set<string>
}

function TreeNodeComponent({ node, level, onNodeClick, onNodeSelect, selectedNodes }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasChildren = node.children && node.children.length > 0
  const isFolder = node.type === 'folder'
  const isSelected = selectedNodes?.has(node.id) || false

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isFolder && hasChildren) {
      setIsExpanded(!isExpanded)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Handle selection for files only
    if (!isFolder && onNodeSelect) {
      onNodeSelect(node, !isSelected)
    }
    
    // Handle regular click
    if (onNodeClick) {
      onNodeClick(node)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 py-1 px-2 rounded cursor-pointer",
          "transition-colors duration-150",
          isSelected 
            ? "bg-blue-100 border border-blue-300 text-blue-900" 
            : "hover:bg-gray-100",
          !isFolder && "select-none"
        )}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={handleClick}
      >
        {isFolder && hasChildren && (
          <button
            onClick={handleToggle}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
        {!isFolder && hasChildren && <div className="w-6" />}
        
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isFolder ? (
            <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
          ) : (
            <File className="h-4 w-4 text-gray-500 flex-shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </div>
        
        {!isFolder && node.size !== undefined && (
          <span className="text-sm text-gray-500 flex-shrink-0">
            {formatFileSize(node.size)}
          </span>
        )}
        
        {!isFolder && node.lastModified && (
          <span className="text-sm text-gray-500 flex-shrink-0">
            {node.lastModified.toLocaleDateString()}
          </span>
        )}
      </div>
      
      {isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              onNodeClick={onNodeClick}
              onNodeSelect={onNodeSelect}
              selectedNodes={selectedNodes}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function Tree({ data, onNodeClick, onNodeSelect, selectedNodes, className }: TreeProps) {
  return (
    <div className={cn("w-full", className)}>
      {data.map((node) => (
        <TreeNodeComponent
          key={node.id}
          node={node}
          level={0}
          onNodeClick={onNodeClick}
          onNodeSelect={onNodeSelect}
          selectedNodes={selectedNodes}
        />
      ))}
    </div>
  )
}
