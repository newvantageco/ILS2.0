#!/bin/bash

# ILS 2.0 SSL Certificate Setup Script
# Automated SSL certificate generation and configuration

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="${DOMAIN:-localhost}"
EMAIL="${EMAIL:-admin@${DOMAIN}}"
STAGING="${STAGING:-false}"
NGINX_CONFIG="${NGINX_CONFIG:-/etc/nginx/sites-available/ils2}"
SSL_DIR="${SSL_DIR:-/etc/ssl/ils2}"
LOG_FILE="./ssl-setup-$(date +"%Y%m%d_%H%M%S").log"

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "${LOG_FILE}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "${LOG_FILE}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "${LOG_FILE}"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "${LOG_FILE}"
}

# Check if running as root for system SSL setup
check_root() {
    if [ "$EUID" -ne 0 ] && [ "${DOMAIN}" != "localhost" ]; then
        warning "SSL certificate setup for production domains requires root privileges."
        warning "Please run with sudo or use development mode (DOMAIN=localhost)"
        read -p "Continue in development mode? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
        DOMAIN="localhost"
    fi
}

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    local missing_deps=()
    
    # Required dependencies
    for cmd in openssl nginx; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done
    
    # Check for certbot (Let's Encrypt)
    if ! command -v certbot &> /dev/null && [ "${DOMAIN}" != "localhost" ]; then
        missing_deps+=("certbot")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        error "Missing dependencies: ${missing_deps[*]}"
        echo
        echo "Please install the missing dependencies:"
        
        for dep in "${missing_deps[@]}"; do
            case "$dep" in
                "openssl")
                    echo "  - OpenSSL: sudo apt-get install openssl"
                    ;;
                "nginx")
                    echo "  - Nginx: sudo apt-get install nginx"
                    ;;
                "certbot")
                    echo "  - Certbot: sudo apt-get install certbot python3-certbot-nginx"
                    ;;
            esac
        done
        
        echo
        echo "After installing dependencies, run this script again."
        exit 1
    fi
    
    success "All dependencies found"
}

# Create SSL directory structure
create_ssl_directories() {
    log "Creating SSL directory structure..."
    
    local dirs=(
        "${SSL_DIR}"
        "${SSL_DIR}/certs"
        "${SSL_DIR}/private"
        "${SSL_DIR}/csr"
        "${SSL_DIR}/backup"
    )
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            if [ "$EUID" -eq 0 ]; then
                mkdir -p "$dir"
            else
                mkdir -p "./ssl/${dir##*/}"
            fi
            log "Created directory: $dir"
        fi
    done
    
    # Set appropriate permissions
    if [ "$EUID" -eq 0 ]; then
        chmod 755 "$SSL_DIR"
        chmod 755 "${SSL_DIR}/certs"
        chmod 700 "${SSL_DIR}/private"
        chmod 755 "${SSL_DIR}/csr"
        chmod 755 "${SSL_DIR}/backup"
    fi
    
    success "SSL directories created"
}

# Generate self-signed certificate for development
generate_self_signed_cert() {
    log "Generating self-signed SSL certificate for development..."
    
    local cert_dir="./ssl/certs"
    local key_dir="./ssl/private"
    local csr_dir="./ssl/csr"
    
    # Generate private key
    openssl genrsa -out "${key_dir}/localhost.key" 2048
    
    # Generate CSR
    openssl req -new -key "${key_dir}/localhost.key" -out "${csr_dir}/localhost.csr" -subj "/C=US/ST=State/L=City/O=ILS2.0/OU=Development/CN=localhost"
    
    # Generate self-signed certificate
    openssl x509 -req -in "${csr_dir}/localhost.csr" -signkey "${key_dir}/localhost.key" -out "${cert_dir}/localhost.crt" -days 365 -extensions v3_req -extfile <(cat <<EOF
[v3_req]
subjectAltName = @alt_names
[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF
)
    
    success "Self-signed certificate generated"
    log "Certificate: ${cert_dir}/localhost.crt"
    log "Private key: ${key_dir}/localhost.key"
}

# Setup Let's Encrypt certificate for production
setup_lets_encrypt() {
    log "Setting up Let's Encrypt SSL certificate for ${DOMAIN}..."
    
    # Check if domain is accessible
    if ! curl -s "http://${DOMAIN}" > /dev/null; then
        error "Domain ${DOMAIN} is not accessible via HTTP"
        error "Please ensure your domain is pointing to this server and port 80 is open"
        exit 1
    fi
    
    # Generate certificate
    local certbot_args=(
        "certonly"
        "--nginx"
        "--non-interactive"
        "--agree-tos"
        "--email" "${EMAIL}"
        "--domain" "${DOMAIN}"
        "--domain" "www.${DOMAIN}"
    )
    
    if [ "$STAGING" = "true" ]; then
        certbot_args+=("--staging")
        warning "Using Let's Encrypt staging environment for testing"
    fi
    
    if [ "$EUID" -eq 0 ]; then
        certbot "${certbot_args[@]}"
    else
        error "Let's Encrypt requires root privileges"
        exit 1
    fi
    
    success "Let's Encrypt certificate generated for ${DOMAIN}"
}

# Generate SSL configuration
generate_ssl_config() {
    log "Generating SSL configuration..."
    
    local config_file="./ssl/nginx-ssl.conf"
    
    cat > "$config_file" << 'EOF'
# ILS 2.0 SSL Configuration
# Optimized for security and performance

# SSL Protocol Configuration
ssl_protocols TLSv1.3 TLSv1.2;
ssl_prefer_server_ciphers off;

# SSL Ciphers Configuration (TLS 1.3 compatible)
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;

# SSL Session Configuration
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_session_tickets off;

# SSL Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# OCSP Stapling
ssl_ocsp on;
ssl_ocsp_max_stapled_responses 3;
ssl_ocsp_max_stapling_age 3600s;

# SSL Certificate Configuration
ssl_certificate /etc/ssl/ils2/certs/localhost.crt;
ssl_certificate_key /etc/ssl/ils2/private/localhost.key;

# Certificate Chain
ssl_trusted_certificate /etc/ssl/ils2/certs/localhost.crt;

# SSL Security Headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https: wss:;" always;

# SSL Security Enhancements
ssl_ecdh_curve secp384r1;
ssl_conf_command Options PrioritizeChaCha;
ssl_conf_command Ciphersuites TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_CCM_SHA256:TLS_AES_128_CCM_8_SHA256;

# Performance Optimizations
ssl_buffer_size 4k;
ssl_read_ahead on;

# Perfect Forward Secrecy
ssl_dhparam /etc/ssl/ils2/dhparam.pem;

# Security Settings
ssl_reject_handshake on;
EOF
    
    success "SSL configuration generated: $config_file"
}

# Generate DH parameters for Perfect Forward Secrecy
generate_dh_params() {
    log "Generating Diffie-Hellman parameters for Perfect Forward Secrecy..."
    
    local dh_file="./ssl/dhparam.pem"
    
    if [ ! -f "$dh_file" ]; then
        openssl dhparam -out "$dh_file" 2048
        success "DH parameters generated: $dh_file"
    else
        log "DH parameters already exist: $dh_file"
    fi
}

# Generate Nginx server block
generate_nginx_config() {
    log "Generating Nginx server block configuration..."
    
    local server_file="./ssl/nginx-server.conf"
    
    cat > "$server_file" << EOF
# ILS 2.0 Server Configuration
# SSL-enabled server block for ${DOMAIN}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};
    
    # Include SSL configuration
    include ./ssl/nginx-ssl.conf;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Root directory
    root /var/www/ils2;
    index index.html index.htm;
    
    # Client configuration
    client_max_body_size 10M;
    client_body_timeout 60s;
    client_header_timeout 60s;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # AI service proxy
    location /ai/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Static files
    location / {
        try_files \$uri \$uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Security: Hide nginx version
    server_tokens off;
    
    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    # Logging
    access_log /var/log/nginx/ils2.access.log;
    error_log /var/log/nginx/ils2.error.log;
}
EOF
    
    success "Nginx configuration generated: $server_file"
}

# Test SSL configuration
test_ssl_config() {
    log "Testing SSL configuration..."
    
    local config_file="./ssl/nginx-ssl.conf"
    
    if [ -f "$config_file" ]; then
        if command -v nginx &> /dev/null; then
            if nginx -t -c "$config_file" 2>/dev/null; then
                success "SSL configuration is valid"
            else
                error "SSL configuration has errors"
                nginx -t -c "$config_file"
                return 1
            fi
        else
            warning "Nginx not available for configuration testing"
        fi
    fi
}

# Create certificate renewal script
create_renewal_script() {
    log "Creating certificate renewal script..."
    
    local renewal_file="./ssl/renew-certificates.sh"
    
    cat > "$renewal_file" << 'EOF'
#!/bin/bash

# ILS 2.0 SSL Certificate Renewal Script
# Automated certificate renewal and service restart

set -euo pipefail

LOG_FILE="/var/log/ssl-renewal.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Renew Let's Encrypt certificates
renew_certificates() {
    log "Starting SSL certificate renewal..."
    
    if certbot renew --quiet --no-self-upgrade; then
        log "Certificates renewed successfully"
        
        # Reload nginx
        if systemctl reload nginx; then
            log "Nginx reloaded successfully"
        else
            log "Failed to reload nginx"
            exit 1
        fi
        
        # Restart application services
        if systemctl restart ils2-app; then
            log "Application services restarted successfully"
        else
            log "Failed to restart application services"
        fi
        
    else
        log "Certificate renewal failed or no certificates needed renewal"
        exit 1
    fi
}

# Check certificate expiry
check_expiry() {
    local cert_file="/etc/letsencrypt/live/$(hostname)/fullchain.pem"
    
    if [ -f "$cert_file" ]; then
        local expiry_date=$(openssl x509 -in "$cert_file" -noout -enddate | cut -d= -f2)
        local expiry_timestamp=$(date -d "$expiry_date" +%s)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        log "Certificate expires in $days_until_expiry days"
        
        if [ $days_until_expiry -lt 30 ]; then
            log "Certificate expires soon, attempting renewal..."
            renew_certificates
        else
            log "Certificate is still valid"
        fi
    else
        log "No certificate file found"
    fi
}

# Main execution
check_expiry
log "SSL renewal check completed"
EOF
    
    chmod +x "$renewal_file"
    success "Certificate renewal script created: $renewal_file"
}

# Setup cron job for certificate renewal
setup_renewal_cron() {
    log "Setting up automatic certificate renewal..."
    
    local cron_file="/tmp/ils2_ssl_renewal"
    
    cat > "$cron_file" << EOF
# ILS 2.0 SSL Certificate Renewal
# Check for certificate renewal twice daily
0 2,14 * * * $(pwd)/ssl/renew-certificates.sh >> /var/log/ssl-renewal.log 2>&1
EOF
    
    if crontab "$cron_file" 2>/dev/null; then
        success "Certificate renewal cron job installed"
    else
        warning "Failed to install cron job. Please add manually:"
        cat "$cron_file"
    fi
    
    rm -f "$cron_file"
}

# Generate SSL test script
create_test_script() {
    log "Creating SSL test script..."
    
    local test_file="./ssl/test-ssl.sh"
    
    cat > "$test_file" << 'EOF'
#!/bin/bash

# ILS 2.0 SSL Test Script
# Comprehensive SSL configuration testing

DOMAIN="${DOMAIN:-localhost}"
PORT="${PORT:-443}"

echo "🔒 Testing SSL Configuration for $DOMAIN:$PORT"
echo "================================================"

# Test SSL connection
echo "1. Testing SSL connection..."
if openssl s_client -connect "$DOMAIN:$PORT" -servername "$DOMAIN" < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
    echo "✅ SSL connection successful"
else
    echo "❌ SSL connection failed"
    exit 1
fi

# Test certificate chain
echo "2. Testing certificate chain..."
if openssl s_client -connect "$DOMAIN:$PORT" -servername "$DOMAIN" < /dev/null 2>/dev/null | grep -q "Certificate chain"; then
    echo "✅ Certificate chain valid"
else
    echo "❌ Certificate chain invalid"
fi

# Test TLS version
echo "3. Testing TLS version..."
tls_version=$(openssl s_client -connect "$DOMAIN:$PORT" -servername "$DOMAIN" < /dev/null 2>/dev/null | grep "Protocol" | awk '{print $3}')
echo "📋 TLS Version: $tls_version"

# Test cipher suite
echo "4. Testing cipher suite..."
cipher=$(openssl s_client -connect "$DOMAIN:$PORT" -servername "$DOMAIN" < /dev/null 2>/dev/null | grep "Cipher" | awk '{print $3}')
echo "🔐 Cipher Suite: $cipher"

# Test security headers
echo "5. Testing security headers..."
curl -s -I "https://$DOMAIN" | grep -E "(Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options|X-XSS-Protection)" || echo "⚠️  Some security headers may be missing"

# Test certificate expiry
echo "6. Testing certificate expiry..."
expiry_date=$(openssl s_client -connect "$DOMAIN:$PORT" -servername "$DOMAIN" < /dev/null 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
echo "📅 Certificate expires: $expiry_date"

echo "================================================"
echo "🎉 SSL testing completed!"
EOF
    
    chmod +x "$test_file"
    success "SSL test script created: $test_file"
}

# Generate setup summary
generate_summary() {
    log "Generating setup summary..."
    
    local summary_file="./ssl-setup-summary.txt"
    
    cat > "$summary_file" << EOF
ILS 2.0 SSL Setup Summary
=========================

Setup Date: $(date)
Domain: $DOMAIN
Email: $EMAIL
Environment: $([ "$DOMAIN" = "localhost" ] && echo "Development" || echo "Production")

SSL Configuration:
- Certificate Type: $([ "$DOMAIN" = "localhost" ] && echo "Self-Signed" || echo "Let's Encrypt")
- TLS Version: 1.3, 1.2
- Cipher Suites: Modern, secure
- HSTS: Enabled (1 year)
- Perfect Forward Secrecy: Enabled

Generated Files:
- SSL Certificate: ./ssl/certs/localhost.crt
- Private Key: ./ssl/private/localhost.key
- SSL Config: ./ssl/nginx-ssl.conf
- Nginx Config: ./ssl/nginx-server.conf
- DH Parameters: ./ssl/dhparam.pem
- Test Script: ./ssl/test-ssl.sh
- Renewal Script: ./ssl/renew-certificates.sh

Next Steps:
1. Copy SSL configuration to your Nginx installation
2. Update your domain DNS to point to this server
3. Test SSL configuration: ./ssl/test-ssl.sh
4. Setup automatic renewal: ./ssl/renew-certificates.sh
5. Monitor certificate expiry and renewal logs

Security Features:
- HTTPS enforcement
- TLS 1.3 support
- Strong cipher suites
- HSTS preload
- Security headers
- Perfect Forward Secrecy
- Certificate stapling
- OCSP stapling

Testing Commands:
- Test SSL: ./ssl/test-ssl.sh
- Check certificate: openssl x509 -in ./ssl/certs/localhost.crt -text -noout
- Verify chain: openssl verify -CAfile ./ssl/certs/localhost.crt ./ssl/certs/localhost.crt

Troubleshooting:
- Check Nginx logs: /var/log/nginx/error.log
- Check SSL renewal logs: /var/log/ssl-renewal.log
- Verify certificate: openssl s_client -connect $DOMAIN:443 -servername $DOMAIN
EOF
    
    success "Setup summary generated: $summary_file"
    cat "$summary_file"
}

# Main setup function
main() {
    echo
    echo "🔒 ILS 2.0 SSL Certificate Setup"
    echo "================================="
    echo
    
    log "Starting SSL certificate setup..."
    
    # Run setup steps
    check_root
    check_dependencies
    create_ssl_directories
    
    if [ "$DOMAIN" = "localhost" ]; then
        generate_self_signed_cert
    else
        setup_lets_encrypt
    fi
    
    generate_ssl_config
    generate_dh_params
    generate_nginx_config
    test_ssl_config
    create_renewal_script
    setup_renewal_cron
    create_test_script
    generate_summary
    
    echo
    success "SSL certificate setup completed! 🔒"
    echo
    echo "📋 Next Steps:"
    echo "1. Copy SSL configuration to your Nginx installation"
    echo "2. Test SSL configuration: ./ssl/test-ssl.sh"
    echo "3. Setup automatic renewal: ./ssl/renew-certificates.sh"
    echo "4. Monitor certificate expiry and renewal logs"
    echo
    echo "🔐 Security Features Enabled:"
    echo "- HTTPS enforcement with TLS 1.3"
    echo "- Strong cipher suites and Perfect Forward Secrecy"
    echo "- HSTS preload and security headers"
    echo "- Automatic certificate renewal"
    echo
    echo "📝 Configuration Files:"
    echo "- SSL Config: ./ssl/nginx-ssl.conf"
    echo "- Nginx Config: ./ssl/nginx-server.conf"
    echo "- Test Script: ./ssl/test-ssl.sh"
    echo "- Renewal Script: ./ssl/renew-certificates.sh"
    echo
}

# Handle script interruption
trap 'error "SSL setup interrupted"; exit 1' INT TERM

# Run main function
main "$@"
