#!/bin/bash

# ILS 2.0 Comprehensive Security Verification Script
# End-to-end security testing and validation

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="${DOMAIN:-localhost:3000}"
PROTOCOL="${PROTOCOL:-http}"
TIMEOUT="${TIMEOUT:-10}"
VERBOSE="${VERBOSE:-false}"

# Test results
declare -A TEST_RESULTS
TOTAL_TESTS=0
PASSED_TESTS=0

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
    TEST_RESULTS["$1"]="PASS"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    TEST_RESULTS["$1"]="WARN"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    TEST_RESULTS["$1"]="FAIL"
}

info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

header() {
    echo -e "${CYAN}🔒 $1${NC}"
    echo "================================"
}

# Increment test counter
increment_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Test SSL/TLS Configuration
test_ssl_configuration() {
    header "SSL/TLS Configuration Test"
    
    increment_test
    log "Testing SSL certificate validity..."
    
    local domain_host=$(echo "$DOMAIN" | cut -d':' -f1)
    local domain_port=$(echo "$DOMAIN" | cut -d':' -f2 -s)
    domain_port=${domain_port:-443}
    
    if [ "$PROTOCOL" = "https" ] || [ "$domain_port" = "443" ]; then
        if openssl s_client -connect "$domain_host:$domain_port" -servername "$domain_host" < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
            success "SSL certificate validation"
        else
            error "SSL certificate validation"
        fi
        
        increment_test
        log "Testing TLS version..."
        local tls_version=$(openssl s_client -connect "$domain_host:$domain_port" -servername "$domain_host" < /dev/null 2>/dev/null | grep "Protocol" | awk '{print $3}')
        
        case "$tls_version" in
            "TLSv1.3")
                success "TLS 1.3 supported"
                ;;
            "TLSv1.2")
                warning "TLS 1.2 supported (consider upgrading to 1.3)"
                ;;
            *)
                error "TLS version $tls_version (upgrade required)"
                ;;
        esac
        
        increment_test
        log "Testing Perfect Forward Secrecy..."
        local cipher=$(openssl s_client -connect "$domain_host:$domain_port" -servername "$domain_host" < /dev/null 2>/dev/null | grep "Cipher" | awk '{print $3}')
        
        if echo "$cipher" | grep -qE "(ECDHE|DHE)"; then
            success "Perfect Forward Secrecy enabled"
        else
            error "Perfect Forward Secrecy not enabled"
        fi
        
        increment_test
        log "Testing certificate expiry..."
        local cert_info=$(openssl s_client -connect "$domain_host:$domain_port" -servername "$domain_host" < /dev/null 2>/dev/null | openssl x509 -noout -dates)
        local expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d'=' -f2)
        local expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$expiry_date" +%s 2>/dev/null)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [ $days_until_expiry -gt 30 ]; then
            success "Certificate expires in $days_until_expiry days"
        elif [ $days_until_expiry -gt 0 ]; then
            warning "Certificate expires in $days_until_expiry days"
        else
            error "Certificate has expired"
        fi
    else
        warning "SSL/TLS test skipped (HTTP or non-standard port)"
    fi
}

# Test Security Headers
test_security_headers() {
    header "Security Headers Test"
    
    local url="${PROTOCOL}://${DOMAIN}"
    local headers_file="/tmp/security_headers_$(date +%s).txt"
    
    # Get response headers
    if curl -s --max-time "$TIMEOUT" -I "$url" > "$headers_file"; then
        # Test critical security headers
        local headers=(
            "Strict-Transport-Security:HSTS"
            "X-Frame-Options:Clickjacking Protection"
            "X-Content-Type-Options:MIME Type Protection"
            "X-XSS-Protection:XSS Protection"
            "Referrer-Policy:Referrer Policy"
            "Content-Security-Policy:Content Security Policy"
            "Permissions-Policy:Permissions Policy"
        )
        
        for header_test in "${headers[@]}"; do
            local header=$(echo "$header_test" | cut -d':' -f1)
            local description=$(echo "$header_test" | cut -d':' -f2)
            
            increment_test
            log "Testing $description ($header)..."
            
            if grep -qi "^$header:" "$headers_file"; then
                success "$description header present"
            else
                error "$description header missing"
            fi
        done
        
        # Test server information disclosure
        increment_test
        log "Testing server information disclosure..."
        local server_header=$(grep -i "Server:" "$headers_file" | cut -d' ' -f2- | tr -d '\r\n')
        
        if [ -n "$server_header" ] && [ "$server_header" != "nginx" ]; then
            warning "Server header disclosed: $server_header"
        else
            success "Server information properly hidden"
        fi
        
    else
        error "Failed to retrieve headers from $url"
    fi
    
    rm -f "$headers_file"
}

# Test CORS Configuration
test_cors_configuration() {
    header "CORS Configuration Test"
    
    local url="${PROTOCOL}://${DOMAIN}/api/test"
    
    increment_test
    log "Testing CORS preflight request..."
    
    local cors_response=$(curl -s --max-time "$TIMEOUT" -H "Origin: https://example.com" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" -X OPTIONS "$url" -I 2>/dev/null || echo "")
    
    if echo "$cors_response" | grep -qi "Access-Control-Allow-Origin"; then
        success "CORS headers configured"
        
        # Check if wildcard is used (security concern)
        if echo "$cors_response" | grep -qi "Access-Control-Allow-Origin: \*"; then
            warning "CORS allows all origins (consider restricting)"
        fi
    else
        warning "CORS may not be properly configured"
    fi
}

# Test Rate Limiting
test_rate_limiting() {
    header "Rate Limiting Test"
    
    local url="${PROTOCOL}://${DOMAIN}/api/test"
    
    increment_test
    log "Testing rate limiting..."
    
    local rate_limit_hits=0
    for i in {1..10}; do
        local status_code=$(curl -s --max-time "$TIMEOUT" -o /dev/null -w "%{http_code}" "$url" || echo "000")
        if [ "$status_code" = "429" ]; then
            rate_limit_hits=$((rate_limit_hits + 1))
        fi
        sleep 0.1
    done
    
    if [ $rate_limit_hits -gt 0 ]; then
        success "Rate limiting is active"
    else
        warning "Rate limiting may not be configured or threshold not reached"
    fi
}

# Test Authentication Security
test_authentication_security() {
    header "Authentication Security Test"
    
    local url="${PROTOCOL}://${DOMAIN}/api/auth/login"
    
    increment_test
    log "Testing authentication endpoint security..."
    
    # Test for SQL injection in login
    local malicious_payload="' OR '1'='1"
    local response=$(curl -s --max-time "$TIMEOUT" -X POST -H "Content-Type: application/json" -d "{\"username\":\"$malicious_payload\",\"password\":\"test\"}" "$url" 2>/dev/null || echo "")
    
    if echo "$response" | grep -qi "error\|invalid\|unauthorized"; then
        success "Login endpoint properly secured against injection"
    else
        warning "Login endpoint may be vulnerable to injection"
    fi
    
    increment_test
    log "Testing password policy enforcement..."
    
    # Test weak password
    local weak_response=$(curl -s --max-time "$TIMEOUT" -X POST -H "Content-Type: application/json" -d '{"username":"test","password":"123456"}' "$url" 2>/dev/null || echo "")
    
    if echo "$weak_response" | grep -qi "weak\|invalid\|requirements"; then
        success "Password policy enforcement active"
    else
        warning "Password policy may not be enforced"
    fi
}

# Test Data Protection
test_data_protection() {
    header "Data Protection Test"
    
    increment_test
    log "Testing sensitive data exposure..."
    
    local url="${PROTOCOL}://${DOMAIN}"
    local response=$(curl -s --max-time "$TIMEOUT" "$url" 2>/dev/null || echo "")
    
    # Check for exposed sensitive information
    local sensitive_patterns=(
        "password"
        "secret"
        "api_key"
        "private_key"
        "database"
        "connection_string"
    )
    
    local exposure_found=false
    for pattern in "${sensitive_patterns[@]}"; do
        if echo "$response" | grep -qi "$pattern"; then
            warning "Potential sensitive data exposure: $pattern"
            exposure_found=true
        fi
    done
    
    if [ "$exposure_found" = false ]; then
        success "No obvious sensitive data exposure detected"
    fi
    
    increment_test
    log "Testing error message sanitization..."
    
    local error_url="${PROTOCOL}://${DOMAIN}/api/non-existent-endpoint-$(date +%s)"
    local error_response=$(curl -s --max-time "$TIMEOUT" "$error_url" 2>/dev/null || echo "")
    
    if echo "$error_response" | grep -qi "stack trace\|internal error\|exception"; then
        warning "Error messages may expose sensitive information"
    else
        success "Error messages appear properly sanitized"
    fi
}

# Test HTTPS Enforcement
test_https_enforcement() {
    header "HTTPS Enforcement Test"
    
    if [ "$PROTOCOL" = "https" ]; then
        local domain_host=$(echo "$DOMAIN" | cut -d':' -f1)
        
        increment_test
        log "Testing HTTP to HTTPS redirection..."
        
        local http_response=$(curl -s --max-time "$TIMEOUT" -I "http://$domain_host" 2>/dev/null || echo "")
        
        if echo "$http_response" | grep -qi "301\|302" && echo "$http_response" | grep -qi "location.*https"; then
            success "HTTP to HTTPS redirection active"
        else
            warning "HTTP to HTTPS redirection not detected"
        fi
    else
        warning "HTTPS enforcement test skipped (HTTP mode)"
    fi
}

# Test Session Security
test_session_security() {
    header "Session Security Test"
    
    local url="${PROTOCOL}://${DOMAIN}/api/auth/login"
    
    increment_test
    log "Testing session cookie security..."
    
    local login_response=$(curl -s --max-time "$TIMEOUT" -X POST -H "Content-Type: application/json" -d '{"username":"test","password":"test"}' -c /tmp/cookies.txt "$url" 2>/dev/null || echo "")
    local cookies_file="/tmp/cookies.txt"
    
    if [ -f "$cookies_file" ]; then
        local secure_cookie=$(grep -i "secure" "$cookies_file" || echo "")
        local httponly_cookie=$(grep -i "httponly" "$cookies_file" || echo "")
        local samesite_cookie=$(grep -i "samesite" "$cookies_file" || echo "")
        
        if [ -n "$secure_cookie" ] && [ -n "$httponly_cookie" ]; then
            success "Session cookies have security flags"
        else
            warning "Session cookies may lack security flags"
        fi
        
        rm -f "$cookies_file"
    else
        warning "Could not test session security"
    fi
}

# Test Input Validation
test_input_validation() {
    header "Input Validation Test"
    
    local url="${PROTOCOL}://${DOMAIN}/api/test"
    
    increment_test
    log "Testing XSS protection..."
    
    local xss_payload="<script>alert('xss')</script>"
    local xss_response=$(curl -s --max-time "$TIMEOUT" -X POST -H "Content-Type: application/json" -d "{\"input\":\"$xss_payload\"}" "$url" 2>/dev/null || echo "")
    
    if echo "$xss_response" | grep -qi "<script>"; then
        warning "XSS protection may be insufficient"
    else
        success "XSS protection appears active"
    fi
    
    increment_test
    log "Testing SQL injection protection..."
    
    local sqli_payload="'; DROP TABLE users; --"
    local sqli_response=$(curl -s --max-time "$TIMEOUT" -X POST -H "Content-Type: application/json" -d "{\"id\":\"$sqli_payload\"}" "$url" 2>/dev/null || echo "")
    
    if echo "$sqli_response" | grep -qi "error\|syntax\|mysql"; then
        warning "SQL injection protection may need improvement"
    else
        success "SQL injection protection appears active"
    fi
}

# Test File Upload Security
test_file_upload_security() {
    header "File Upload Security Test"
    
    local url="${PROTOCOL}://${DOMAIN}/api/upload"
    
    increment_test
    log "Testing file upload restrictions..."
    
    # Create test malicious file
    echo "<?php system(\$_GET['cmd']); ?>" > /tmp/malicious.php
    
    local upload_response=$(curl -s --max-time "$TIMEOUT" -X POST -F "file=@/tmp/malicious.php" "$url" 2>/dev/null || echo "")
    
    if echo "$upload_response" | grep -qi "error\|invalid\|not allowed"; then
        success "File upload restrictions active"
    else
        warning "File upload security may need review"
    fi
    
    rm -f /tmp/malicious.php
}

# Generate Security Report
generate_security_report() {
    header "Security Assessment Report"
    
    local score=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    local report_file="./security-report-$(date +%Y%m%d_%H%M%S).json"
    
    echo
    info "Security Score: $score% ($PASSED_TESTS/$TOTAL_TESTS tests passed)"
    
    if [ $score -ge 90 ]; then
        success "Excellent security posture"
    elif [ $score -ge 70 ]; then
        warning "Good security posture with room for improvement"
    elif [ $score -ge 50 ]; then
        warning "Moderate security posture - improvements needed"
    else
        error "Poor security posture - immediate attention required"
    fi
    
    echo
    info "Detailed Results:"
    for test in "${!TEST_RESULTS[@]}"; do
        local result=${TEST_RESULTS[$test]}
        case "$result" in
            "PASS")
                echo -e "  ${GREEN}✅${NC} $test"
                ;;
            "WARN")
                echo -e "  ${YELLOW}⚠️${NC} $test"
                ;;
            "FAIL")
                echo -e "  ${RED}❌${NC} $test"
                ;;
        esac
    done
    
    # Generate JSON report
    cat > "$report_file" << EOF
{
  "assessment_date": "$(date -Iseconds)",
  "domain": "$DOMAIN",
  "protocol": "$PROTOCOL",
  "security_score": $score,
  "total_tests": $TOTAL_TESTS,
  "passed_tests": $PASSED_TESTS,
  "test_results": {
$(for test in "${!TEST_RESULTS[@]}"; do
    echo "    \"$test\": \"${TEST_RESULTS[$test]}\","
done | sed '$s/,$//')
  },
  "recommendations": [
    "Enable all security headers",
    "Implement HTTPS enforcement",
    "Configure proper rate limiting",
    "Strengthen input validation",
    "Regular security assessments",
    "Monitor security logs",
    "Keep dependencies updated"
  ],
  "next_steps": [
    "Address failed security tests",
    "Implement missing security features",
    "Schedule regular security scans",
    "Set up security monitoring"
  ]
}
EOF
    
    success "Security report generated: $report_file"
}

# Main verification function
main() {
    echo
    echo "🔒 ILS 2.0 Comprehensive Security Verification"
    echo "==============================================="
    echo "Testing: $DOMAIN"
    echo "Protocol: $PROTOCOL"
    echo "Timeout: ${TIMEOUT}s"
    echo
    
    # Run security tests
    test_ssl_configuration
    test_security_headers
    test_cors_configuration
    test_rate_limiting
    test_authentication_security
    test_data_protection
    test_https_enforcement
    test_session_security
    test_input_validation
    test_file_upload_security
    
    # Generate report
    generate_security_report
    
    echo
    header "Security Verification Summary"
    echo "Tests Completed: $TOTAL_TESTS"
    echo "Tests Passed: $PASSED_TESTS"
    echo "Success Rate: $((PASSED_TESTS * 100 / TOTAL_TESTS))%"
    echo
    
    if [ $((PASSED_TESTS * 100 / TOTAL_TESTS)) -ge 80 ]; then
        success "Security verification completed successfully! 🔒"
        echo
        echo "🎯 Your application demonstrates strong security practices."
        echo "📊 Review the detailed report for specific recommendations."
    else
        warning "Security verification completed with concerns ⚠️"
        echo
        echo "🚨 Several security issues require attention."
        echo "📋 Please review the failed tests and implement fixes."
    fi
    
    echo
    echo "📋 Next Steps:"
    echo "1. Review the security assessment report"
    echo "2. Address any failed security tests"
    echo "3. Implement recommended security improvements"
    echo "4. Schedule regular security assessments"
    echo "5. Set up continuous security monitoring"
    echo
}

# Handle script interruption
trap 'error "Security verification interrupted"; exit 1' INT TERM

# Run main function
main "$@"
