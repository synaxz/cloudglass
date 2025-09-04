#!/bin/bash

# CloudGlass Sample Data Initialization
# This script can be run manually to populate LocalStack with sample data

echo "🚀 CloudGlass Sample Data Initialization"
echo "========================================"

# Check if LocalStack is running
if ! curl -s http://localhost:4566/_localstack/health > /dev/null; then
    echo "❌ LocalStack is not running. Please start LocalStack first:"
    echo "   ./start.sh (choose option 1 or 2)"
    echo "   or"
    echo "   docker compose up -d"
    exit 1
fi

echo "✅ LocalStack is running"

# Run the initialization script
echo "📦 Setting up sample data..."
./localstack-init/init-localstack.sh

echo ""
echo "🎉 Sample data initialization complete!"
echo "🌐 Access CloudGlass at: http://localhost:3000"
