# ================================
# Multi-Stage Production Dockerfile
# ================================

# ----------------
# Stage 1: Builder
# ----------------
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

    # Install ALL dependencies (including devDependencies for build)
    RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ----------------
# Stage 2: Production
# ----------------
FROM node:20-alpine AS production

# Install runtime dependencies only
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy necessary runtime files
COPY --chown=nodejs:nodejs server ./server
COPY --chown=nodejs:nodejs shared ./shared

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production \
    PORT=5000 \
    HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
