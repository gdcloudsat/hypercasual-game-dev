#!/bin/bash

echo "🚀 Starting Hyper-Casual Game Platform..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Start services
echo "📦 Starting services with Docker Compose..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
    echo ""
    echo "🎮 Application is ready!"
    echo ""
    echo "📍 Access points:"
    echo "   Frontend:  http://localhost:5173"
    echo "   Backend:   http://localhost:3000"
    echo "   WebSocket: http://localhost:3001"
    echo "   MySQL:     localhost:3306"
    echo "   Redis:     localhost:6379"
    echo ""
    echo "📝 View logs with: docker-compose logs -f"
    echo "🛑 Stop services with: docker-compose down"
else
    echo "❌ Failed to start services. Check logs with: docker-compose logs"
    exit 1
fi
