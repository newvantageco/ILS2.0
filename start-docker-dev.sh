#!/bin/bash

# Start Docker Development Environment
# Waits for Docker to be ready, then starts all services

echo "🐳 Starting Docker Development Environment..."
echo ""

# Function to check if Docker is running
check_docker() {
    docker info > /dev/null 2>&1
    return $?
}

# Wait for Docker to be ready
echo "⏳ Waiting for Docker to start..."
RETRY_COUNT=0
MAX_RETRIES=30

while ! check_docker; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -gt $MAX_RETRIES ]; then
        echo "❌ Docker failed to start after 30 seconds"
        echo "   Please start Docker Desktop manually and try again"
        exit 1
    fi
    echo -n "."
    sleep 1
done

echo ""
echo "✅ Docker is ready!"
echo ""

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
docker-compose -f docker-compose.dev.yml down 2>/dev/null

echo ""
echo "🚀 Starting services with docker-compose.dev.yml..."
echo "   - PostgreSQL (port 5433)"
echo "   - Redis (port 6380)"
echo "   - ILS App (ports 5001, 5173)"
echo "   - Adminer - DB UI (port 8082)"
echo "   - MailHog - Email testing (port 8025)"
echo "   - Redis Commander (port 8083)"
echo ""

# Start services
docker-compose -f docker-compose.dev.yml up -d --build

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check service status
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✨ Docker Development Environment Started!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Available Services:"
echo "   🌐 App Frontend:     http://localhost:5173"
echo "   🔌 App Backend:      http://localhost:5001"
echo "   🗄️  Adminer (DB):     http://localhost:8082"
echo "      └─ Server: postgres"
echo "      └─ User: ils_user"
echo "      └─ Password: dev_password"
echo "      └─ Database: ils_db_dev"
echo "   📧 MailHog (Email):  http://localhost:8025"
echo "   🔴 Redis Commander:  http://localhost:8083"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Wait for services to fully start (check with 'docker-compose -f docker-compose.dev.yml logs -f')"
echo ""
echo "2. Create your master test user:"
echo "   docker-compose -f docker-compose.dev.yml exec app npm run create-master-user"
echo ""
echo "3. Open the frontend at http://localhost:5173"
echo ""
echo "4. Login with:"
echo "   Email: test@master.com"
echo "   Password: Test123!@#"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "💡 Useful Commands:"
echo "   View logs:     docker-compose -f docker-compose.dev.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.dev.yml down"
echo "   Restart:       docker-compose -f docker-compose.dev.yml restart"
echo "   Shell access:  docker-compose -f docker-compose.dev.yml exec app sh"
echo ""
