# 🚀 CloudGlass Quick Start Guide

## One-Command Setup

```bash
# Start everything in development mode (recommended)
./start.sh dev

# Or use npm scripts
npm run start:dev
```

## Available Commands

### 🐳 Docker Commands

#### Development Mode (Recommended)
```bash
# Start development stack
npm run docker:dev
# or
./start.sh dev

# View logs
npm run docker:dev:logs

# Stop development stack
npm run docker:dev:down

# Restart development stack
npm run docker:dev:restart
```

#### Production Mode
```bash
# Start production stack
npm run docker:prod
# or
./start.sh prod

# View logs
npm run docker:prod:logs

# Stop production stack
npm run docker:prod:down
```

#### Local Development (No Docker)
```bash
# Start local development (requires LocalStack running separately)
npm run start:local
# or
./start.sh local
```

### 🧹 Cleanup Commands

```bash
# Clean up Docker resources
npm run docker:clean

# Stop all containers
docker compose -f docker-compose.dev.yml down
```

## 🌐 Access Points

- **CloudGlass App**: [http://localhost:3000](http://localhost:3000)
- **LocalStack**: [http://localhost:4566](http://localhost:4566)
- **LocalStack Health**: [http://localhost:4566/_localstack/health](http://localhost:4566/_localstack/health)

## 🔧 Troubleshooting

### App Not Loading?
```bash
# Check container status
docker compose -f docker-compose.dev.yml ps

# Check logs
docker compose -f docker-compose.dev.yml logs cloudglass

# Restart
docker compose -f docker-compose.dev.yml restart
```

### LocalStack Issues?
```bash
# Check LocalStack health
curl http://localhost:4566/_localstack/health

# Check LocalStack logs
docker compose -f docker-compose.dev.yml logs localstack
```

### Port Conflicts?
```bash
# Check what's using port 3000
lsof -i :3000

# Kill process or change port in docker-compose.dev.yml
```

## 📋 Sample Data

The development setup automatically creates sample data:

- **S3**: 3 buckets with sample files
- **SQS**: 2 queues with sample messages
- **SNS**: 2 topics with subscriptions
- **IAM**: Users, groups, policies, and roles

## 🎯 Next Steps

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. Explore the AWS services through the beautiful UI
3. Check out the sample data in each service
4. Start building your own AWS management workflows!

---

**Need help?** Check the main [README.md](README.md) for detailed documentation.
