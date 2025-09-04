import { 
  HardDrive,
  MessageSquare, 
  Zap, 
  Database, 
  Server, 
  Globe, 
  Network,
  Shield,
  Key,
  Layers,
  FileText,
  Cpu
} from 'lucide-react'

export interface ServiceConfig {
  id: string
  name: string
  fullName: string
  shortName: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  borderColor: string
  hoverColor: string
  status: 'active' | 'coming-soon' | 'running'
  category: string
  description: string
  features: string[]
}

export const servicesConfig: ServiceConfig[] = [
  {
    id: 's3',
    name: 'S3 Storage',
    fullName: 'Simple Storage Service',
    shortName: 'Storage',
    icon: HardDrive,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverColor: 'hover:bg-blue-100',
    status: 'active',
    category: 'Storage',
    description: 'Object storage for any amount of data',
    features: ['Buckets', 'Objects', 'Versioning', 'Lifecycle']
  },
  {
    id: 'sqs',
    name: 'SQS Queues',
    fullName: 'Simple Queue Service',
    shortName: 'Queues',
    icon: MessageSquare,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    hoverColor: 'hover:bg-green-100',
    status: 'active',
    category: 'Messaging',
    description: 'Message queuing for decoupling applications',
    features: ['Standard Queues', 'FIFO Queues', 'Dead Letter', 'Visibility Timeout']
  },
  {
    id: 'lambda',
    name: 'Serverless Functions',
    fullName: 'AWS Lambda',
    shortName: 'Functions',
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    hoverColor: 'hover:bg-yellow-100',
    status: 'coming-soon',
    category: 'Compute',
    description: 'Serverless compute for running code',
    features: ['Functions', 'Triggers', 'Layers', 'Environment Variables']
  },
  {
    id: 'rds',
    name: 'RDS Databases',
    fullName: 'Relational Database Service',
    shortName: 'Databases',
    icon: Database,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    hoverColor: 'hover:bg-purple-100',
    status: 'coming-soon',
    category: 'Database',
    description: 'Managed relational database service',
    features: ['MySQL', 'PostgreSQL', 'Aurora', 'Backups']
  },
  {
    id: 'ec2',
    name: 'EC2 Instances',
    fullName: 'Elastic Compute Cloud',
    shortName: 'Instances',
    icon: Server,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    hoverColor: 'hover:bg-orange-100',
    status: 'coming-soon',
    category: 'Compute',
    description: 'Virtual servers in the cloud',
    features: ['Instances', 'Security Groups', 'Key Pairs', 'Volumes']
  },
  {
    id: 'cloudfront',
    name: 'Content Delivery Network',
    fullName: 'CloudFront',
    shortName: 'CDN',
    icon: Globe,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    hoverColor: 'hover:bg-indigo-100',
    status: 'coming-soon',
    category: 'Networking',
    description: 'Global content delivery network',
    features: ['Distributions', 'Cache Behaviors', 'Origins', 'Invalidations']
  },
  {
    id: 'vpc',
    name: 'VPC',
    fullName: 'Virtual Private Cloud',
    shortName: 'Virtual Network',
    icon: Network,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    hoverColor: 'hover:bg-teal-100',
    status: 'coming-soon',
    category: 'Networking',
    description: 'Virtual private cloud networking',
    features: ['Subnets', 'Route Tables', 'NAT Gateways', 'VPC Peering']
  },
  {
    id: 'iam',
    name: 'IAM',
    fullName: 'Identity and Access Management',
    shortName: 'Identity',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    hoverColor: 'hover:bg-red-100',
    status: 'active',
    category: 'Security',
    description: 'Identity and access management',
    features: ['Users', 'Roles', 'Policies', 'Access Keys']
  },
  {
    id: 'kms',
    name: 'KMS',
    fullName: 'Key Management Service',
    shortName: 'Key Management',
    icon: Key,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    hoverColor: 'hover:bg-pink-100',
    status: 'coming-soon',
    category: 'Security',
    description: 'Key management service',
    features: ['Customer Keys', 'AWS Keys', 'Encryption', 'Key Rotation']
  },
  {
    id: 'dynamodb',
    name: 'DynamoDB',
    fullName: 'NoSQL Database',
    shortName: 'NoSQL DB',
    icon: Layers,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    hoverColor: 'hover:bg-cyan-100',
    status: 'coming-soon',
    category: 'Database',
    description: 'NoSQL database service',
    features: ['Tables', 'Items', 'Indexes', 'Streams']
  },
  {
    id: 'sns',
    name: 'SNS',
    fullName: 'Simple Notification Service',
    shortName: 'Notifications',
    icon: FileText,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-200 dark:border-emerald-700',
    hoverColor: 'hover:bg-emerald-100 dark:hover:bg-emerald-800/30',
    status: 'active',
    category: 'Messaging',
    description: 'Simple notification service for sending messages to multiple subscribers',
    features: ['Topics', 'Subscriptions', 'Messages', 'Endpoints']
  },
  {
    id: 'ecs',
    name: 'ECS',
    fullName: 'Elastic Container Service',
    shortName: 'Containers',
    icon: Cpu,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    hoverColor: 'hover:bg-violet-100',
    status: 'coming-soon',
    category: 'Compute',
    description: 'Elastic container service',
    features: ['Clusters', 'Services', 'Tasks', 'Load Balancers']
  }
]

// Helper functions for filtering services
export const getServicesByCategory = (category: string): ServiceConfig[] => {
  return servicesConfig.filter(service => service.category === category)
}

export const getServicesByStatus = (status: ServiceConfig['status']): ServiceConfig[] => {
  return servicesConfig.filter(service => service.status === status)
}

export const getServiceById = (id: string): ServiceConfig | undefined => {
  return servicesConfig.find(service => service.id === id)
}

export const getAllCategories = (): string[] => {
  const categories = new Set(servicesConfig.map(service => service.category))
  return Array.from(categories).sort()
}
