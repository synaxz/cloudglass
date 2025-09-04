# CloudGlass

A modern, responsive web application for managing cloud infrastructure with a beautiful glass-like interface. Built with Next.js 15, React 19, and TypeScript.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![AWS SDK](https://img.shields.io/badge/AWS_SDK-v3-FF9900?style=flat-square&logo=amazon-aws)](https://aws.amazon.com/sdk-for-javascript/)

## ✨ Features

### 🚀 Currently Implemented Services

- **S3 Storage** - Complete object storage management
  - Create, delete, and manage S3 buckets
  - Upload, download, and delete objects with drag & drop support
  - Tree view for file/folder navigation
  - Bucket attributes and tagging
  - Presigned URL generation for secure downloads

- **SQS Queues** - Message queue management
  - Create, delete, and manage SQS queues
  - Send, receive, and delete messages
  - Queue attributes and configuration
  - Dead letter queue support
  - Message visibility timeout configuration

- **SNS Notifications** - Simple notification service
  - Create and manage SNS topics
  - Manage subscriptions and endpoints
  - Send messages to topics
  - Platform applications and endpoints support

- **IAM Identity & Access Management** - Security and permissions
  - User management (create, delete, list users)
  - Role management (create, delete, list roles)
  - Policy management (create, delete, list policies)
  - Access key management

### 🎨 Modern UI/UX Features

- **Dark Mode Support** - Complete dark theme with system preference detection
- **Glass Design System** - Beautiful translucent cards with backdrop blur effects
- **Responsive Design** - Mobile-first design that works on all devices
- **Service Favorites** - Pin frequently used services for quick access
- **Collapsible Sidebar** - Organized by service categories (Storage, Messaging, Security, etc.)
- **Search Functionality** - Find services quickly with real-time search
- **Status Indicators** - Visual status badges for service availability
- **Modern Navigation** - Intuitive sidebar and top navigation with breadcrumbs

### 🔧 Technical Features

- **Direct URL Routing** - Navigate directly to `/s3`, `/sqs`, `/sns`, or `/iam`
- **Real-time Updates** - Live data refresh and status updates
- **Error Handling** - Comprehensive error boundaries and user feedback
- **Loading States** - Skeleton screens and progress indicators
- **Toast Notifications** - User-friendly success and error messages
- **LocalStack Support** - Pre-configured for local AWS development
- **Production Ready** - Works with both LocalStack and real AWS accounts

### 🚧 Coming Soon

- **Lambda Functions** - Serverless compute management
- **RDS Databases** - Managed database service
- **EC2 Instances** - Virtual server management
- **CloudFront** - Content delivery network
- **VPC** - Virtual private cloud networking
- **DynamoDB** - NoSQL database service
- **KMS** - Key management service
- **ECS** - Container orchestration

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended): For easy setup with LocalStack
- **Node.js**: v18+ (recommended: v20+) - For local development
- **npm**: v9+ or **yarn**: v1.22+ - For local development
- **AWS Account** (optional): For production use

### 🐳 Docker Setup (Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/synaxz/cloudglass.git
   cd cloudglass
   ```

2. **Start the entire stack**:
   ```bash
   # Development mode (recommended - includes hot reloading)
   ./start.sh dev
   
   # Or manually with Docker Compose
   docker compose -f docker-compose.dev.yml up -d
   
   # Production mode (if you need it)
   docker compose up -d
   ```

   > 📖 **Quick Reference**: See [QUICK_START.md](QUICK_START.md) for all available commands

3. **Access the application**:
   - **CloudGlass App**: [http://localhost:3000](http://localhost:3000)
   - **LocalStack**: [http://localhost:4566](http://localhost:4566)
   - **LocalStack Health**: [http://localhost:4566/_localstack/health](http://localhost:4566/_localstack/health)

4. **Stop the stack**:
   ```bash
   # Stop development mode
   docker compose -f docker-compose.dev.yml down
   
   # Stop production mode
   docker compose down
   ```

4. **Sample Data**: The Docker setup automatically populates LocalStack with sample data including:
   - **S3**: 4 buckets with sample files and folder structures
   - **SQS**: 5 queues with sample messages (including FIFO and dead letter queues)
   - **SNS**: 5 topics with subscriptions and sample notifications
   - **IAM**: Users, groups, policies, roles, and access keys

5. **Useful Docker commands**:
   ```bash
   npm run docker:logs    # View logs
   npm run docker:down    # Stop services
   npm run docker:clean   # Clean up everything
   ```

### 💻 Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/synaxz/cloudglass.git
   cd cloudglass
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start LocalStack** (in a separate terminal):
   ```bash
   # Using Docker
   docker run -d -p 4566:4566 localstack/localstack
   
   # Or using pip
   pip install localstack
   localstack start
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Configuration

The application is pre-configured for LocalStack by default:

```typescript
{
  endpoint: "http://localhost:4566",
  region: "us-east-1", 
  accessKey: "test",
  secretKey: "test",
  forcePathStyle: true
}
```

You can modify these settings using the Settings panel in the application.

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom glass design system
- **Icons**: Lucide React for consistent iconography
- **State Management**: React Context + Custom hooks
- **AWS Integration**: AWS SDK v3 for JavaScript
- **Development**: ESLint, TypeScript strict mode

### Project Structure

```
src/
├── app/
│   ├── [service]/              # Dynamic service routing
│   │   └── page.tsx           # Service-specific pages
│   ├── api/                   # API Routes
│   │   ├── s3/               # S3 API endpoints
│   │   ├── sqs/              # SQS API endpoints
│   │   ├── sns/              # SNS API endpoints
│   │   └── iam/              # IAM API endpoints
│   ├── globals.css           # Global styles with dark mode
│   ├── layout.tsx            # App layout with theme provider
│   └── page.tsx              # Home page
├── components/
│   ├── ui/                   # Reusable UI components
│   ├── S3Manager.tsx         # S3 service management
│   ├── SQSManager.tsx        # SQS service management
│   ├── SNSManager.tsx        # SNS service management
│   ├── IAMManager.tsx        # IAM service management
│   ├── Layout.tsx            # Main layout wrapper
│   ├── Sidebar.tsx           # Collapsible sidebar
│   └── TopNavigation.tsx     # Top navigation bar
├── contexts/
│   ├── ThemeContext.tsx      # Dark mode management
│   ├── FavoritesContext.tsx  # Service favorites
│   └── ToastContext.tsx      # Toast notifications
└── lib/
    ├── aws-config.ts         # AWS client configuration
    ├── api-client.ts         # API client utilities
    └── services-config.ts    # Service definitions
```

### Key Design Patterns

- **Component Composition**: Modular React components with TypeScript
- **Custom Hooks**: Reusable logic extraction (useAWSClient, useFavorites)
- **Context Providers**: Global state management (theme, favorites, toasts)
- **Error Boundaries**: Comprehensive error handling and user feedback
- **API Abstraction**: Centralized API client with consistent error handling
- **Service Architecture**: Pluggable service system for easy AWS service addition

## 🎨 UI/UX Design System

### Glass Theme
- **Translucent Cards**: Backdrop blur effects with subtle transparency
- **Gradient Backgrounds**: Modern gradients with indigo and purple accents
- **Consistent Spacing**: 8px grid system for perfect alignment
- **Typography**: Inter font family with proper hierarchy
- **Color Palette**: Carefully crafted color schemes for each service

### Dark Mode
- **System Preference Detection**: Automatically detects user's system theme
- **Persistent State**: Remembers user's theme choice across sessions
- **Smooth Transitions**: Elegant theme switching animations
- **Accessibility**: High contrast ratios for better readability

### Responsive Design
- **Breakpoints**: Tailwind CSS responsive breakpoints
- **Touch Friendly**: Large touch targets and intuitive gestures
- **Collapsible UI**: Space-efficient design for smaller screens

## 🔧 Development

### Adding New AWS Services

The application is designed to easily add new AWS services:

1. **Add Service Configuration**:
   ```typescript
   // src/lib/services-config.ts
   {
     id: 'new-service',
     name: 'New Service',
     fullName: 'AWS New Service',
     shortName: 'Service',
     icon: NewIcon,
     color: 'text-purple-600',
     bgColor: 'bg-purple-50',
     borderColor: 'border-purple-200',
     hoverColor: 'hover:bg-purple-100',
     status: 'active',
     category: 'Category',
     description: 'Service description',
     features: ['Feature 1', 'Feature 2']
   }
   ```

2. **Create Service Manager**:
   ```typescript
   // src/components/NewServiceManager.tsx
   export function NewServiceManager({ isSettingsVisible }: Props) {
     // Service-specific UI and logic
   }
   ```

3. **Add API Routes**:
   ```typescript
   // src/app/api/new-service/route.ts
   export async function GET(request: NextRequest) {
     // API implementation
   }
   ```

4. **Update Service Router**:
   ```typescript
   // src/app/[service]/page.tsx
   case 'new-service':
     return <NewServiceManager isSettingsVisible={isSettingsVisible} />
   ```

### Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Configured with Next.js recommended rules
- **Prettier**: Code formatting (if configured)
- **Component Testing**: Ready for testing framework integration

## 🐳 Docker Configuration

### Docker Compose Services

The `docker-compose.yml` includes three main services:

- **`localstack`**: AWS services emulator running on port 4566
- **`cloudglass`**: Next.js application running on port 3000
- **`localstack-ui`**: Optional LocalStack Pro UI on port 8080 (debug profile)

### Docker Files

- **`Dockerfile`**: Production-optimized multi-stage build
- **`Dockerfile.dev`**: Development build with hot reloading
- **`docker-compose.yml`**: Production configuration
- **`docker-compose.dev.yml`**: Development configuration with volume mounting

### Environment Variables

The Docker setup automatically configures:

```bash
AWS_ENDPOINT_URL=http://localstack:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_DEFAULT_REGION=us-east-1
```

### Docker Commands

```bash
# Build and start all services
npm run docker:up

# Start with development hot reloading
npm run docker:dev

# View logs
npm run docker:logs

# Stop services
npm run docker:down

# Clean up (removes volumes)
npm run docker:clean

# Build only the app image
npm run docker:build

# Run app container only
npm run docker:run
```

### Sample Data Management

The Docker setup automatically populates LocalStack with realistic sample data to demonstrate CloudGlass functionality:

#### S3 Sample Data
- **cloudglass-web-assets**: HTML, CSS, JS files with folder structure
- **cloudglass-app-logs**: Sample log files organized by date
- **cloudglass-user-uploads**: User documents and images
- **cloudglass-dev-storage**: Development files and configurations

#### SQS Sample Data
- **user-notifications**: User notification messages
- **email-processing**: Email queue with templates
- **order-processing.fifo**: FIFO queue for order processing
- **dead-letter-queue**: Failed message handling
- **background-tasks**: Long-running task queue

#### SNS Sample Data
- **cloudglass-system-alerts**: System monitoring notifications
- **cloudglass-user-notifications**: User-facing notifications
- **cloudglass-marketing**: Marketing announcements
- **cloudglass-security-events**: Security alerts
- **cloudglass-app-events**: Application events

#### IAM Sample Data
- **Users**: admin, developer, readonly, service accounts
- **Groups**: Admins, Developers, ReadOnly with appropriate permissions
- **Policies**: Role-based access control policies
- **Roles**: Lambda and EC2 execution roles
- **Access Keys**: Service account credentials

#### Manual Sample Data Initialization

If you need to reset or reinitialize sample data:

```bash
# Initialize sample data manually
./init-sample-data.sh

# Or run individual service setup
./localstack-init/01-s3-setup.sh
./localstack-init/02-sqs-setup.sh
./localstack-init/03-sns-setup.sh
./localstack-init/04-iam-setup.sh
```

## 🌐 Deployment

### LocalStack Development

1. **Using Docker (Recommended)**:
   ```bash
   npm run docker:up
   ```

2. **Using LocalStack directly**:
   ```bash
   pip install localstack
   localstack start
   ```

3. **Verify Connection**:
   Visit [http://localhost:4566](http://localhost:4566)

### Production Deployment

1. **Configure AWS Credentials**:
   ```bash
   aws configure
   ```

2. **Update Configuration**:
   Modify the AWS configuration in the Settings panel

3. **Deploy with Docker**:
   ```bash
   # Build production image
   docker build -t cloudglass .
   
   # Run with production AWS config
   docker run -p 3000:3000 \
     -e AWS_ACCESS_KEY_ID=your_key \
     -e AWS_SECRET_ACCESS_KEY=your_secret \
     -e AWS_DEFAULT_REGION=us-east-1 \
     cloudglass
   ```

4. **Deploy to Cloud Platforms**:
   ```bash
   npm run build
   # Deploy the .next folder or use Docker
   ```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run lint`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- Follow the existing code style and patterns
- Use TypeScript for all new code
- Add proper error handling
- Include dark mode support for new UI components
- Write descriptive commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework for production
- [shadcn/ui](https://ui.shadcn.com/) - Beautifully designed components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide](https://lucide.dev/) - Beautiful & consistent icon toolkit
- [AWS SDK](https://aws.amazon.com/sdk-for-javascript/) - Official AWS SDK
- [LocalStack](https://localstack.cloud/) - Local AWS development

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/yourusername/cloudglass/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/cloudglass/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/cloudglass/discussions)

---

**CloudGlass** - Making AWS management beautiful and intuitive. ✨