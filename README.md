# CloudGlass

A modern, responsive web application for managing AWS/Localstack with a beautiful glass-like interface. Built with Next.js 15, React 19, and TypeScript.

<img width="1693" height="978" alt="image" src="https://github.com/user-attachments/assets/b60e1be2-4df8-42f2-b3ac-e3ac9002f80d" />

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

- **Issues**: [GitHub Issues](https://github.com/synaxz/cloudglass/issues)
- **Discussions**: [GitHub Discussions](https://github.com/synaxz/cloudglass/discussions)

---

**CloudGlass** - Making AWS management beautiful and intuitive. ✨
