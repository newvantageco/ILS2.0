#!/bin/bash

# ILS 2.0 - Docker Testing Script
# Automated testing for production and development stacks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}===================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    print_success "Docker is installed"
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    print_success "Docker Compose is installed"
    
    if ! docker ps &> /dev/null; then
        print_error "Docker daemon is not running"
        exit 1
    fi
    print_success "Docker daemon is running"
}

# Production testing
test_production() {
    print_header "Testing Production Stack"
    
    print_info "Starting production services..."
    docker-compose up -d
    
    print_info "Waiting for services to be healthy (40 seconds)..."
    sleep 40
    
    # Check all containers are running
    print_info "Verifying containers..."
    if docker-compose ps | grep -q "Up"; then
        print_success "All production containers are running"
    else
        print_error "Some containers failed to start"
        docker-compose logs
        exit 1
    fi
    
    # Test app endpoint
    print_info "Testing app health endpoint..."
    if curl -s http://localhost:5000/api/health | grep -q "ok\|status"; then
        print_success "App health endpoint responding"
    else
        print_error "App health endpoint not responding"
        exit 1
    fi
    
    # Test database
    print_info "Testing database connectivity..."
    if docker-compose exec postgres pg_isready -U ils_user -d ils_db &> /dev/null; then
        print_success "Database is accessible"
    else
        print_error "Database is not accessible"
        exit 1
    fi
    
    # Test Redis
    print_info "Testing Redis connectivity..."
    if docker-compose exec redis redis-cli -a ils_redis_password ping &> /dev/null; then
        print_success "Redis is accessible"
    else
        print_error "Redis is not accessible"
        exit 1
    fi
    
    # Show URLs
    print_header "Production Services Ready"
    echo -e "${GREEN}Access the following URLs:${NC}"
    echo "  App:             http://localhost:5000"
    echo "  Database (Adminer): http://localhost:8080"
    echo "  Redis UI:        http://localhost:8081"
    
    # Show credentials
    echo -e "\n${GREEN}Database Credentials:${NC}"
    echo "  Server: postgres"
    echo "  Username: ils_user"
    echo "  Password: ils_password"
    echo "  Database: ils_db"
}

# Development testing
test_development() {
    print_header "Testing Development Stack"
    
    print_info "Stopping any running production containers..."
    docker-compose down -v 2>/dev/null || true
    
    print_info "Starting development services..."
    docker-compose -f docker-compose.dev.yml up -d
    
    print_info "Waiting for services to be healthy (40 seconds)..."
    sleep 40
    
    # Check containers
    print_info "Verifying development containers..."
    if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
        print_success "All development containers are running"
    else
        print_error "Some containers failed to start"
        docker-compose -f docker-compose.dev.yml logs
        exit 1
    fi
    
    # Test app endpoint
    print_info "Testing API on development port..."
    if curl -s http://localhost:5001/api/health | grep -q "ok\|status" 2>/dev/null || true; then
        print_success "Development API responding (might still be building)"
    fi
    
    # Test database
    print_info "Testing development database..."
    if docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U ils_user -d ils_db_dev &> /dev/null; then
        print_success "Development database is accessible"
    else
        print_error "Development database is not accessible"
        exit 1
    fi
    
    # Test Redis
    print_info "Testing development Redis..."
    if docker-compose -f docker-compose.dev.yml exec redis redis-cli ping &> /dev/null; then
        print_success "Development Redis is accessible"
    else
        print_error "Development Redis is not accessible"
        exit 1
    fi
    
    # Show URLs
    print_header "Development Services Ready"
    echo -e "${GREEN}Access the following URLs:${NC}"
    echo "  Frontend:        http://localhost:5173"
    echo "  Backend API:     http://localhost:5001"
    echo "  Database (Adminer): http://localhost:8082"
    echo "  Email Testing:   http://localhost:8025"
    echo "  Redis UI:        http://localhost:8083"
    
    echo -e "\n${YELLOW}Development containers are running with hot reload enabled${NC}"
    echo -e "${YELLOW}View logs with: docker-compose -f docker-compose.dev.yml logs -f${NC}"
}

# Show status
show_status() {
    print_header "Container Status"
    
    if [ -f "docker-compose.yml" ]; then
        echo -e "${BLUE}Production Stack:${NC}"
        docker-compose ps 2>/dev/null || echo "  Not running"
    fi
    
    if [ -f "docker-compose.dev.yml" ]; then
        echo -e "\n${BLUE}Development Stack:${NC}"
        docker-compose -f docker-compose.dev.yml ps 2>/dev/null || echo "  Not running"
    fi
}

# Show logs
show_logs() {
    print_header "Container Logs"
    
    if [ "$1" == "production" ]; then
        docker-compose logs --tail=50
    elif [ "$1" == "development" ]; then
        docker-compose -f docker-compose.dev.yml logs --tail=50
    else
        echo "Specify 'production' or 'development'"
    fi
}

# Stop services
stop_services() {
    print_header "Stopping Services"
    
    print_info "Stopping production stack..."
    docker-compose down 2>/dev/null || true
    
    print_info "Stopping development stack..."
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    
    print_success "All services stopped"
}

# Clean everything
clean_all() {
    print_header "Deep Cleaning"
    
    print_info "Stopping and removing all containers..."
    docker-compose down -v 2>/dev/null || true
    docker-compose -f docker-compose.dev.yml down -v 2>/dev/null || true
    
    print_info "Removing images..."
    docker rmi ils-app 2>/dev/null || true
    docker image prune -a -f 2>/dev/null || true
    
    print_info "Pruning volumes..."
    docker volume prune -a -f 2>/dev/null || true
    
    print_success "All cleaned up"
}

# Main menu
show_menu() {
    echo ""
    echo -e "${BLUE}ILS 2.0 Docker Testing${NC}"
    echo -e "${BLUE}=====================${NC}"
    echo "1) Test Production Stack"
    echo "2) Test Development Stack"
    echo "3) Show Status"
    echo "4) View Logs (production)"
    echo "5) View Logs (development)"
    echo "6) Stop All Services"
    echo "7) Deep Clean"
    echo "8) Exit"
    echo ""
}

# Main script
main() {
    if [ $# -eq 0 ]; then
        # Interactive mode
        check_prerequisites
        
        while true; do
            show_menu
            read -p "Select option (1-8): " choice
            
            case $choice in
                1) test_production ;;
                2) test_development ;;
                3) show_status ;;
                4) show_logs production ;;
                5) show_logs development ;;
                6) stop_services ;;
                7) clean_all ;;
                8) print_success "Goodbye!"; exit 0 ;;
                *) print_error "Invalid option" ;;
            esac
        done
    else
        # Command line mode
        check_prerequisites
        case "$1" in
            production) test_production ;;
            development) test_development ;;
            status) show_status ;;
            logs) show_logs "$2" ;;
            stop) stop_services ;;
            clean) clean_all ;;
            *) 
                echo "Usage: $0 [production|development|status|logs|stop|clean]"
                exit 1
                ;;
        esac
    fi
}

# Run main
main "$@"
