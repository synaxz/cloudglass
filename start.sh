#!/bin/bash

# CloudGlass Startup Script
# This script helps you get started with CloudGlass quickly

set -e

echo "🚀 CloudGlass - AWS Management Interface"
echo "========================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Check for command line arguments
if [ "$1" = "dev" ]; then
    choice=2
elif [ "$1" = "prod" ]; then
    choice=1
elif [ "$1" = "local" ]; then
    choice=3
else
    # Ask user for mode
    echo ""
    echo "Choose your setup mode:"
    echo "1) Production mode (optimized, no hot reloading)"
    echo "2) Development mode (with hot reloading) - RECOMMENDED"
    echo "3) Local development (without Docker)"
    echo ""
    read -p "Enter your choice (1-3): " choice
fi

# Determine which docker compose command to use
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

case $choice in
    1)
        echo "🐳 Starting CloudGlass in production mode..."
        $DOCKER_COMPOSE up -d
        echo ""
        echo "✅ CloudGlass is running!"
        echo "   📱 App: http://localhost:3000"
        echo "   ☁️  LocalStack: http://localhost:4566"
        echo ""
        echo "📋 Useful commands:"
        echo "   View logs: $DOCKER_COMPOSE logs -f"
        echo "   Stop: $DOCKER_COMPOSE down"
        ;;
    2)
        echo "🐳 Starting CloudGlass in development mode..."
        $DOCKER_COMPOSE -f docker-compose.dev.yml up -d
        echo ""
        echo "✅ CloudGlass is running in development mode!"
        echo "   📱 App: http://localhost:3000"
        echo "   ☁️  LocalStack: http://localhost:4566"
        echo "   🔄 Hot reloading enabled"
        echo ""
        echo "📋 Useful commands:"
        echo "   View logs: $DOCKER_COMPOSE -f docker-compose.dev.yml logs -f"
        echo "   Stop: $DOCKER_COMPOSE -f docker-compose.dev.yml down"
        echo "   Restart: $DOCKER_COMPOSE -f docker-compose.dev.yml restart"
        ;;
    3)
        echo "💻 Starting CloudGlass locally..."
        echo "   Make sure LocalStack is running on http://localhost:4566"
        echo "   Starting Next.js development server..."
        npm run dev
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac
