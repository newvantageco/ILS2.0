#!/bin/bash

################################################################################
# Deployment Verification Script
#
# Verifies a deployment was successful by running comprehensive checks
# Run this after deploying to any environment
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT="${1:-staging}"
BASE_URL="${2:-}"
TIMEOUT=30
MAX_RETRIES=10
RETRY_DELAY=5

################################################################################
# Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Set BASE_URL based on environment if not provided
set_base_url() {
    if [ -z "$BASE_URL" ]; then
        case "$ENVIRONMENT" in
            production)
                BASE_URL="https://ils.example.com"
                ;;
            staging)
                BASE_URL="https://staging.ils.example.com"
                ;;
            development)
                BASE_URL="http://localhost:5000"
                ;;
            *)
                log_error "Unknown environment: $ENVIRONMENT"
                echo "Usage: $0 [environment] [base_url]"
                echo "Environments: production, staging, development"
                exit 1
                ;;
        esac
    fi
}

# Wait for deployment to be ready
wait_for_deployment() {
    log_info "Waiting for deployment to be ready..."

    local retries=0
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -sf --max-time 5 "${BASE_URL}/api/health" > /dev/null 2>&1; then
            log_success "Deployment is responding"
            return 0
        fi

        retries=$((retries + 1))
        log_info "Attempt $retries/$MAX_RETRIES - Deployment not ready yet, waiting ${RETRY_DELAY}s..."
        sleep $RETRY_DELAY
    done

    log_error "Deployment did not become ready after $MAX_RETRIES attempts"
    return 1
}

# Verify health check
verify_health() {
    log_info "Verifying health check..."

    local response=$(curl -s "${BASE_URL}/api/health")
    local status=$(echo "$response" | jq -r '.status' 2>/dev/null || echo "unknown")

    if [ "$status" = "healthy" ]; then
        log_success "Health check: healthy"
        return 0
    else
        log_error "Health check failed: $status"
        echo "Response: $response"
        return 1
    fi
}

# Verify dependencies
verify_dependencies() {
    log_info "Verifying dependencies..."

    local response=$(curl -s "${BASE_URL}/api/health")

    # Check database
    local db_status=$(echo "$response" | jq -r '.dependencies.database' 2>/dev/null || echo "unknown")
    if [ "$db_status" = "healthy" ]; then
        log_success "Database: healthy"
    else
        log_error "Database: $db_status"
        return 1
    fi

    # Check Redis (if configured)
    local redis_status=$(echo "$response" | jq -r '.dependencies.redis' 2>/dev/null || echo "unknown")
    if [ "$redis_status" = "healthy" ] || [ "$redis_status" = "unknown" ]; then
        log_success "Redis: ${redis_status}"
    else
        log_warning "Redis: $redis_status"
    fi
}

# Verify version/release
verify_version() {
    log_info "Verifying deployed version..."

    local response=$(curl -s "${BASE_URL}/api/health")
    local version=$(echo "$response" | jq -r '.version' 2>/dev/null || echo "unknown")

    log_info "Deployed version: $version"

    if [ "$version" != "unknown" ] && [ -n "$version" ]; then
        log_success "Version information present"
        return 0
    else
        log_warning "Version information missing"
        return 1
    fi
}

# Verify critical endpoints
verify_endpoints() {
    log_info "Verifying critical endpoints..."

    local endpoints=(
        "/api/health:200"
        "/api/monitoring/health:200"
        "/:200"
    )

    local failed=0

    for endpoint_config in "${endpoints[@]}"; do
        IFS=':' read -r endpoint expected_status <<< "$endpoint_config"

        local status=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${endpoint}")

        if [ "$status" -eq "$expected_status" ]; then
            log_success "Endpoint $endpoint: $status"
        else
            log_error "Endpoint $endpoint: expected $expected_status, got $status"
            failed=1
        fi
    done

    return $failed
}

# Verify performance
verify_performance() {
    log_info "Verifying performance..."

    local start_time=$(date +%s%N)
    curl -s "${BASE_URL}/api/health" > /dev/null
    local end_time=$(date +%s%N)

    local duration=$(( (end_time - start_time) / 1000000 )) # Convert to ms

    if [ $duration -lt 1000 ]; then
        log_success "Response time: ${duration}ms (< 1000ms)"
        return 0
    else
        log_warning "Response time: ${duration}ms (> 1000ms)"
        return 1
    fi
}

# Run smoke tests
run_smoke_tests() {
    log_info "Running smoke tests..."

    if [ -f "scripts/production-readiness/smoke-tests.sh" ]; then
        if ./scripts/production-readiness/smoke-tests.sh "$BASE_URL"; then
            log_success "Smoke tests passed"
            return 0
        else
            log_error "Smoke tests failed"
            return 1
        fi
    else
        log_warning "Smoke test script not found, skipping"
        return 0
    fi
}

# Verify monitoring
verify_monitoring() {
    log_info "Verifying monitoring setup..."

    # Check if metrics endpoint is accessible
    local metrics_status=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/monitoring/metrics")

    if [ "$metrics_status" -eq 200 ]; then
        log_success "Metrics endpoint accessible"
    else
        log_warning "Metrics endpoint not accessible (status: $metrics_status)"
    fi

    # Check if observability config is available
    local obs_status=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/observability/config")

    if [ "$obs_status" -eq 200 ] || [ "$obs_status" -eq 401 ]; then
        log_success "Observability endpoint exists"
    else
        log_warning "Observability endpoint not found"
    fi
}

# Verify security headers
verify_security() {
    log_info "Verifying security configuration..."

    local headers=$(curl -sI "${BASE_URL}/api/health")

    local security_score=0

    if echo "$headers" | grep -qi "x-frame-options"; then
        log_success "X-Frame-Options header present"
        ((security_score++))
    else
        log_warning "X-Frame-Options header missing"
    fi

    if echo "$headers" | grep -qi "x-content-type-options"; then
        log_success "X-Content-Type-Options header present"
        ((security_score++))
    else
        log_warning "X-Content-Type-Options header missing"
    fi

    if [ "$ENVIRONMENT" = "production" ]; then
        if [ "$BASE_URL" != "${BASE_URL#https://}" ]; then
            log_success "HTTPS enabled"
            ((security_score++))
        else
            log_error "HTTPS not enabled in production!"
            return 1
        fi

        if echo "$headers" | grep -qi "strict-transport-security"; then
            log_success "HSTS header present"
            ((security_score++))
        else
            log_warning "HSTS header missing"
        fi
    fi

    if [ $security_score -ge 2 ]; then
        log_success "Security configuration acceptable (score: $security_score)"
        return 0
    else
        log_warning "Security configuration needs improvement (score: $security_score)"
        return 1
    fi
}

# Verify database migrations
verify_migrations() {
    log_info "Checking database migrations..."

    # This would require database access or an API endpoint
    # For now, we'll assume if the app is healthy, migrations are good
    log_info "Database migrations check skipped (requires DB access)"
}

# Check for error logs
check_error_logs() {
    log_info "Checking for immediate errors..."

    sleep 5 # Wait a bit for any startup errors

    # If we can access logs via kubectl or docker
    if command -v kubectl &> /dev/null && [ "$ENVIRONMENT" != "development" ]; then
        local namespace="ils-${ENVIRONMENT}"
        local errors=$(kubectl logs -n "$namespace" deployment/ils-app --tail=100 2>/dev/null | grep -i error || true)

        if [ -n "$errors" ]; then
            log_warning "Found errors in logs"
            echo "$errors"
        else
            log_success "No errors found in recent logs"
        fi
    else
        log_info "Log check skipped (kubectl not available)"
    fi
}

################################################################################
# Main Execution
################################################################################

main() {
    echo ""
    echo "========================================"
    echo "🔍 DEPLOYMENT VERIFICATION"
    echo "========================================"
    echo "Environment: $ENVIRONMENT"

    set_base_url

    echo "Target URL:  $BASE_URL"
    echo "========================================"
    echo ""

    local failed=0

    # Wait for deployment
    if ! wait_for_deployment; then
        log_error "Deployment verification failed: Service not available"
        exit 1
    fi

    echo ""

    # Run verification steps
    verify_health || failed=1
    verify_dependencies || failed=1
    verify_version || failed=1
    verify_endpoints || failed=1
    verify_performance || failed=1
    verify_monitoring || failed=1
    verify_security || failed=1
    verify_migrations || failed=1
    check_error_logs || true # Don't fail on log check

    echo ""
    echo "Running comprehensive smoke tests..."
    run_smoke_tests || failed=1

    # Summary
    echo ""
    echo "========================================"
    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}✅ DEPLOYMENT VERIFICATION PASSED${NC}"
        echo "========================================"
        echo ""
        log_success "Deployment to $ENVIRONMENT is healthy and verified"
        log_info "URL: $BASE_URL"
        exit 0
    else
        echo -e "${RED}❌ DEPLOYMENT VERIFICATION FAILED${NC}"
        echo "========================================"
        echo ""
        log_error "Deployment to $ENVIRONMENT has issues"
        log_error "Please review the errors above"
        log_warning "Consider rolling back the deployment"
        exit 1
    fi
}

# Run main
main
