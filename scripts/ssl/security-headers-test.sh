#!/bin/bash

# ILS 2.0 Security Headers Test Script
# Comprehensive security headers validation and testing

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="${DOMAIN:-localhost:3000}"
PROTOCOL="${PROTOCOL:-https}"
TIMEOUT="${TIMEOUT:-10}"

# Security headers to test
declare -A SECURITY_HEADERS=(
    ["Strict-Transport-Security"]="HSTS"
    ["X-Frame-Options"]="Clickjacking Protection"
    ["X-Content-Type-Options"]="MIME Type Sniffing Protection"
    ["X-XSS-Protection"]="XSS Protection"
    ["Referrer-Policy"]="Referrer Policy"
    ["Content-Security-Policy"]="Content Security Policy"
    ["Permissions-Policy"]="Permissions Policy"
    ["Cross-Origin-Embedder-Policy"]="COEP"
    ["Cross-Origin-Opener-Policy"]="COOP"
    ["Cross-Origin-Resource-Policy"]="CORP"
)

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Test HTTP vs HTTPS
test_protocol_enforcement() {
    log "Testing protocol enforcement..."
    
    local url="${PROTOCOL}://${DOMAIN}"
    
    # Test if HTTPS is enforced
    if [ "$PROTOCOL" = "https" ]; then
        # Try HTTP connection
        if curl -s --max-time "$TIMEOUT" "http://${DOMAIN}" | grep -q "https"; then
            success "HTTPS redirection working"
        else
            warning "HTTP to HTTPS redirection may not be configured"
        fi
    fi
    
    # Test secure connection
    if curl -s --max-time "$TIMEOUT" "$url" > /dev/null; then
        success "Secure connection established"
    else
        error "Failed to establish secure connection"
        return 1
    fi
}

# Test security headers
test_security_headers() {
    log "Testing security headers..."
    
    local url="${PROTOCOL}://${DOMAIN}"
    local headers_file="/tmp/security_headers_$(date +%s).txt"
    
    # Get response headers
    curl -s --max-time "$TIMEOUT" -I "$url" > "$headers_file"
    
    local total_headers=${#SECURITY_HEADERS[@]}
    local present_headers=0
    local missing_headers=()
    
    echo
    echo "📋 Security Headers Analysis:"
    echo "============================"
    
    for header in "${!SECURITY_HEADERS[@]}"; do
        if grep -qi "^$header:" "$headers_file"; then
            success "$header: PRESENT"
            present_headers=$((present_headers + 1))
            
            # Extract and display header value
            local value=$(grep -i "^$header:" "$headers_file" | cut -d' ' -f2- | tr -d '\r\n')
            if [ -n "$value" ]; then
                echo "   Value: $value"
            fi
        else
            error "$header: MISSING"
            missing_headers+=("$header")
        fi
        echo
    done
    
    # Calculate security score
    local security_score=$((present_headers * 100 / total_headers))
    
    echo "📊 Security Headers Score: $security_score% ($present_headers/$total_headers)"
    
    if [ $security_score -ge 80 ]; then
        success "Excellent security headers configuration"
    elif [ $security_score -ge 60 ]; then
        warning "Good security headers configuration, but can be improved"
    else
        error "Poor security headers configuration - needs immediate attention"
    fi
    
    # Recommendations for missing headers
    if [ ${#missing_headers[@]} -gt 0 ]; then
        echo
        echo "🔧 Recommendations for Missing Headers:"
        for header in "${missing_headers[@]}"; do
            echo "- $header (${SECURITY_HEADERS[$header]})"
        done
    fi
    
    rm -f "$headers_file"
}

# Test Content Security Policy in detail
test_csp_details() {
    log "Analyzing Content Security Policy..."
    
    local url="${PROTOCOL}://${DOMAIN}"
    local csp_header=$(curl -s --max-time "$TIMEOUT" -I "$url" | grep -i "Content-Security-Policy:" | cut -d' ' -f2- | tr -d '\r\n')
    
    if [ -n "$csp_header" ]; then
        echo
        echo "🔒 Content Security Policy Analysis:"
        echo "===================================="
        
        # Check for important CSP directives
        local csp_directives=(
            "default-src"
            "script-src"
            "style-src"
            "img-src"
            "connect-src"
            "font-src"
            "frame-src"
            "object-src"
            "media-src"
            "manifest-src"
        )
        
        for directive in "${csp_directives[@]}"; do
            if echo "$csp_header" | grep -q "$directive"; then
                local value=$(echo "$csp_header" | grep -o "$directive [^;]*" | cut -d' ' -f2-)
                success "$directive: $value"
            else
                warning "$directive: Not specified"
            fi
        done
        
        # Check for unsafe directives
        echo
        echo "⚠️  Unsafe CSP Directives Check:"
        if echo "$csp_header" | grep -q "'unsafe-inline'"; then
            warning "Contains 'unsafe-inline' - potential XSS risk"
        fi
        if echo "$csp_header" | grep -q "'unsafe-eval'"; then
            warning "Contains 'unsafe-eval' - potential XSS risk"
        fi
        if echo "$csp_header" | grep -q "\*"; then
            warning "Contains wildcard (*) - overly permissive"
        fi
        
    else
        warning "Content Security Policy not found"
    fi
}

# Test HSTS configuration
test_hsts_details() {
    log "Analyzing HSTS Configuration..."
    
    local url="${PROTOCOL}://${DOMAIN}"
    local hsts_header=$(curl -s --max-time "$TIMEOUT" -I "$url" | grep -i "Strict-Transport-Security:" | cut -d' ' -f2- | tr -d '\r\n')
    
    if [ -n "$hsts_header" ]; then
        echo
        echo "🛡️  HSTS Configuration Analysis:"
        echo "================================"
        
        # Extract max-age
        if echo "$hsts_header" | grep -q "max-age="; then
            local max_age=$(echo "$hsts_header" | grep -o "max-age=[0-9]*" | cut -d'=' -f2)
            local days=$((max_age / 86400))
            
            if [ $days -ge 365 ]; then
                success "max-age: $max_age ($days days) - Excellent"
            elif [ $days -ge 30 ]; then
                warning "max-age: $max_age ($days days) - Good, but could be longer"
            else
                error "max-age: $max_age ($days days) - Too short"
            fi
        fi
        
        # Check includeSubDomains
        if echo "$hsts_header" | grep -q "includeSubDomains"; then
            success "includeSubDomains: Enabled"
        else
            warning "includeSubDomains: Not enabled"
        fi
        
        # Check preload
        if echo "$hsts_header" | grep -q "preload"; then
            success "preload: Enabled (eligible for browser preload list)"
        else
            warning "preload: Not enabled"
        fi
        
    else
        error "HSTS header not found"
    fi
}

# Test TLS configuration
test_tls_configuration() {
    log "Testing TLS Configuration..."
    
    local domain_host=$(echo "$DOMAIN" | cut -d':' -f1)
    local domain_port=$(echo "$DOMAIN" | cut -d':' -f2 -s)
    domain_port=${domain_port:-443}
    
    echo
    echo "🔐 TLS Configuration Analysis:"
    echo "=============================="
    
    # Test TLS connection
    if openssl s_client -connect "$domain_host:$domain_port" -servername "$domain_host" < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
        success "TLS certificate validation: PASSED"
    else
        error "TLS certificate validation: FAILED"
    fi
    
    # Check TLS version
    local tls_version=$(openssl s_client -connect "$domain_host:$domain_port" -servername "$domain_host" < /dev/null 2>/dev/null | grep "Protocol" | awk '{print $3}')
    echo "📋 TLS Version: $tls_version"
    
    case "$tls_version" in
        "TLSv1.3")
            success "TLS 1.3: Excellent security"
            ;;
        "TLSv1.2")
            warning "TLS 1.2: Good security, consider upgrading to 1.3"
            ;;
        *)
            error "TLS version $tls_version: Insecure, upgrade immediately"
            ;;
    esac
    
    # Check cipher suite
    local cipher=$(openssl s_client -connect "$domain_host:$domain_port" -servername "$domain_host" < /dev/null 2>/dev/null | grep "Cipher" | awk '{print $3}')
    echo "🔐 Cipher Suite: $cipher"
    
    # Check for Perfect Forward Secrecy
    if echo "$cipher" | grep -qE "(ECDHE|DHE)"; then
        success "Perfect Forward Secrecy: Enabled"
    else
        error "Perfect Forward Secrecy: Not enabled"
    fi
    
    # Check certificate details
    echo
    echo "📜 Certificate Information:"
    local cert_info=$(openssl s_client -connect "$domain_host:$domain_port" -servername "$domain_host" < /dev/null 2>/dev/null | openssl x509 -noout -dates -subject)
    
    echo "$cert_info"
    
    # Check certificate expiry
    local expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d'=' -f2)
    local expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$expiry_date" +%s 2>/dev/null)
    local current_timestamp=$(date +%s)
    local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
    
    if [ $days_until_expiry -gt 30 ]; then
        success "Certificate expires in $days_until_expiry days"
    elif [ $days_until_expiry -gt 0 ]; then
        warning "Certificate expires in $days_until_expiry days - renewal needed soon"
    else
        error "Certificate has expired!"
    fi
}

# Test for common security vulnerabilities
test_security_vulnerabilities() {
    log "Testing for common security vulnerabilities..."
    
    local url="${PROTOCOL}://${DOMAIN}"
    
    echo
    echo "🔍 Security Vulnerability Tests:"
    echo "================================"
    
    # Test for server information disclosure
    local server_header=$(curl -s --max-time "$TIMEOUT" -I "$url" | grep -i "Server:" | cut -d' ' -f2- | tr -d '\r\n')
    if [ -n "$server_header" ]; then
        warning "Server header disclosed: $server_header"
    else
        success "Server header hidden"
    fi
    
    # Test for X-Powered-By header
    local powered_by=$(curl -s --max-time "$TIMEOUT" -I "$url" | grep -i "X-Powered-By:" | cut -d' ' -f2- | tr -d '\r\n')
    if [ -n "$powered_by" ]; then
        warning "X-Powered-By header disclosed: $powered_by"
    else
        success "X-Powered-By header hidden"
    fi
    
    # Test for directory listing
    local http_code=$(curl -s --max-time "$TIMEOUT" -o /dev/null -w "%{http_code}" "$url/directory-that-should-not-exist/")
    if [ "$http_code" = "404" ]; then
        success "Directory listing appears to be disabled"
    else
        warning "Directory listing may be enabled (HTTP $http_code)"
    fi
    
    # Test for error page information disclosure
    local error_page=$(curl -s --max-time "$TIMEOUT" "$url/non-existent-page-$(date +%s)")
    if echo "$error_page" | grep -qi "error\|exception\|stack trace"; then
        warning "Error pages may disclose sensitive information"
    else
        success "Error pages appear to be properly sanitized"
    fi
}

# Generate security report
generate_security_report() {
    log "Generating security assessment report..."
    
    local report_file="./security-assessment-$(date +%Y%m%d_%H%M%S).json"
    
    cat > "$report_file" << EOF
{
  "assessment_date": "$(date -Iseconds)",
  "domain": "$DOMAIN",
  "protocol": "$PROTOCOL",
  "security_headers": {
    "strict_transport_security": $(curl -s --max-time "$TIMEOUT" -I "${PROTOCOL}://${DOMAIN}" | grep -qi "Strict-Transport-Security:" && echo "true" || echo "false"),
    "x_frame_options": $(curl -s --max-time "$TIMEOUT" -I "${PROTOCOL}://${DOMAIN}" | grep -qi "X-Frame-Options:" && echo "true" || echo "false"),
    "x_content_type_options": $(curl -s --max-time "$TIMEOUT" -I "${PROTOCOL}://${DOMAIN}" | grep -qi "X-Content-Type-Options:" && echo "true" || echo "false"),
    "x_xss_protection": $(curl -s --max-time "$TIMEOUT" -I "${PROTOCOL}://${DOMAIN}" | grep -qi "X-XSS-Protection:" && echo "true" || echo "false"),
    "referrer_policy": $(curl -s --max-time "$TIMEOUT" -I "${PROTOCOL}://${DOMAIN}" | grep -qi "Referrer-Policy:" && echo "true" || echo "false"),
    "content_security_policy": $(curl -s --max-time "$TIMEOUT" -I "${PROTOCOL}://${DOMAIN}" | grep -qi "Content-Security-Policy:" && echo "true" || echo "false"),
    "permissions_policy": $(curl -s --max-time "$TIMEOUT" -I "${PROTOCOL}://${DOMAIN}" | grep -qi "Permissions-Policy:" && echo "true" || echo "false")
  },
  "tls_configuration": {
    "tls_version": "$(openssl s_client -connect "$(echo "$DOMAIN" | cut -d':' -f1):$(echo "$DOMAIN" | cut -d':' -f2 -s)" < /dev/null 2>/dev/null | grep "Protocol" | awk '{print $3}' || echo "Unknown")",
    "perfect_forward_secrecy": $(openssl s_client -connect "$(echo "$DOMAIN" | cut -d':' -f1):$(echo "$DOMAIN" | cut -d':' -f2 -s)" < /dev/null 2>/dev/null | grep "Cipher" | grep -qE "(ECDHE|DHE)" && echo "true" || echo "false")
  },
  "recommendations": [
    "Enable all security headers",
    "Use TLS 1.3 exclusively",
    "Implement HSTS with preload",
    "Regularly update SSL certificates",
    "Monitor security headers configuration"
  ]
}
EOF
    
    success "Security assessment report generated: $report_file"
}

# Main test function
main() {
    echo
    echo "🔒 ILS 2.0 Security Headers Test"
    echo "================================="
    echo "Testing: $DOMAIN"
    echo "Protocol: $PROTOCOL"
    echo
    
    # Run security tests
    test_protocol_enforcement
    test_security_headers
    test_csp_details
    test_hsts_details
    test_tls_configuration
    test_security_vulnerabilities
    generate_security_report
    
    echo
    success "Security headers testing completed! 🔒"
    echo
    echo "📋 Test Results:"
    echo "- Security headers validated"
    echo "- TLS configuration analyzed"
    echo "- Vulnerability assessment completed"
    echo "- Detailed report generated"
    echo
    echo "🔧 Next Steps:"
    echo "1. Review the security assessment report"
    echo "2. Implement missing security headers"
    echo "3. Update TLS configuration if needed"
    echo "4. Schedule regular security assessments"
    echo
}

# Handle script interruption
trap 'error "Security testing interrupted"; exit 1' INT TERM

# Run main function
main "$@"
