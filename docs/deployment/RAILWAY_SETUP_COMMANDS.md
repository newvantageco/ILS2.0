# Railway Setup Commands

Quick reference for all Railway CLI commands and setup steps.

## Initial Setup

### Install Railway CLI
```bash
npm install -g @railway/cli
```

### Login to Railway
```bash
railway login
```

### Initialize New Project
```bash
# Create new Railway project
railway init

# Or link to existing project
railway link
```

## Project Configuration

### Add Services

```bash
# Add PostgreSQL database
railway add --database postgres

# Add Redis cache
railway add --database redis

# Add MySQL (alternative)
railway add --database mysql
```

### View Project Info

```bash
# See current project and environment
railway status

# Check who you're logged in as
railway whoami

# List all projects
railway list
```

## Deployment

### Deploy Application

```bash
# Deploy current directory
railway up

# Deploy with safe validation (uses our custom script)
npm run railway:deploy:safe

# Force rebuild and deploy
railway up --detach
```

### View Deployment

```bash
# View real-time logs
railway logs

# Follow logs (continuous)
railway logs --follow
npm run railway:logs:follow

# View specific number of lines
railway logs --lines 100
```

### Rollback

```bash
# Rollback to previous deployment
railway rollback

# List all deployments
railway status
```

## Environment Variables

### Set Variables

```bash
# Set a single variable
railway variables set SESSION_SECRET=<your-secret>

# Set multiple variables
railway variables set \
  SESSION_SECRET=<secret> \
  ADMIN_SETUP_KEY=<key> \
  APP_URL=https://app.yourdomain.com
```

### View Variables

```bash
# List all environment variables
railway variables

# Get specific variable
railway variables get DATABASE_URL
```

### Delete Variables

```bash
# Delete a variable
railway variables delete OLD_VARIABLE
```

## Database Operations

### Connect to Database

```bash
# Open PostgreSQL shell
railway connect postgres

# Run SQL command
railway run psql $DATABASE_URL -c "SELECT version();"
```

### Database Migrations

```bash
# Run migrations in Railway environment
railway run npm run db:push

# Run custom migration script
railway run npm run migrate-storage
```

## Service Management

### Control Services

```bash
# Restart service
railway restart

# Open Railway dashboard in browser
railway open

# Open specific service
railway open --service postgres
```

### Execute Commands

```bash
# Run command in Railway environment
railway run <command>

# Examples:
railway run npm run check
railway run npm test
railway run node scripts/seed-data.js

# Interactive shell
railway shell
```

## Domains

### Manage Domains

```bash
# View current domains
railway domain

# Add custom domain (do this in dashboard)
# railway domain add app.yourdomain.com
```

## Monitoring

### View Logs

```bash
# Real-time logs
railway logs --follow

# Filter logs
railway logs --service web
railway logs --deployment latest

# Export logs
railway logs > deployment.log
```

### Check Service Health

```bash
# Check deployment status
railway status

# Test health endpoint
curl https://your-app.up.railway.app/api/health
```

## Multiple Environments

### Switch Environments

```bash
# List environments
railway environment

# Switch to production
railway environment production

# Switch to staging
railway environment staging
```

### Create Environment

```bash
# Create new environment (do this in dashboard)
# railway environment create staging
```

## Advanced

### Service Configuration

```bash
# View current service configuration
railway service

# Link to different service
railway service link
```

### Project Settings

```bash
# View project settings
railway project

# Switch projects
railway project switch
```

## Helper Scripts (npm)

We've added these npm scripts for convenience:

```bash
# Validate environment before deploy
npm run validate:env

# Railway commands
npm run railway:init          # Initialize Railway project
npm run railway:link          # Link to existing project
npm run railway:deploy        # Quick deploy
npm run railway:deploy:safe   # Deploy with validation
npm run railway:logs          # View logs
npm run railway:logs:follow   # Follow logs
npm run railway:status        # Check status
npm run railway:open          # Open dashboard
npm run railway:restart       # Restart service
npm run railway:rollback      # Rollback deployment
npm run railway:shell         # Interactive shell
npm run railway:whoami        # Check login status
```

## Troubleshooting Commands

### Debug Build Issues

```bash
# View build logs
railway logs --deployment latest

# Rebuild from scratch
railway up --detach

# Test build locally
docker build -t ils-test .
docker run -p 5000:5000 ils-test
```

### Debug Connection Issues

```bash
# Test database connection
railway run npm run db:push

# Check environment variables
railway variables

# Verify services are running
railway status
```

### Performance Monitoring

```bash
# Check resource usage
railway status

# View metrics (in dashboard)
railway open
# Navigate to: Metrics tab
```

## Production Deployment Workflow

### Complete Production Deploy

```bash
# 1. Validate environment
npm run validate:env

# 2. Check TypeScript compilation
npm run check

# 3. Run tests
npm run test:all

# 4. Deploy to Railway
npm run railway:deploy:safe

# 5. Monitor deployment
npm run railway:logs:follow

# 6. Verify health
curl https://app.yourdomain.com/api/health

# 7. Test critical paths
# (login, order creation, payments, etc.)
```

### Rollback Procedure

```bash
# 1. Rollback deployment
railway rollback

# 2. Check logs for errors
railway logs

# 3. Verify rollback successful
curl https://app.yourdomain.com/api/health

# 4. Investigate issue
railway logs > error-logs.txt
```

## Security Best Practices

### Rotate Secrets

```bash
# Generate new secrets
openssl rand -base64 32  # SESSION_SECRET
openssl rand -base64 24  # ADMIN_SETUP_KEY

# Update in Railway
railway variables set SESSION_SECRET=<new-secret>

# Restart service
railway restart
```

### Audit Environment Variables

```bash
# List all variables
railway variables

# Check for leaked secrets in git
git log -S "sk_live_" --all
git log -S "re_" --all
```

## Backup & Recovery

### Database Backup

```bash
# Export database
railway run pg_dump $DATABASE_URL > backup.sql

# Restore database
railway run psql $DATABASE_URL < backup.sql
```

### Export Project Configuration

```bash
# Export environment variables
railway variables > production.env

# Export deployment info
railway status > deployment-info.txt
```

## Multi-Service Deployment

If you have multiple services (web, worker, cron):

```bash
# Deploy specific service
railway up --service web
railway up --service worker

# View logs for specific service
railway logs --service web
railway logs --service worker

# Restart specific service
railway restart --service web
```

## Useful Aliases

Add these to your `~/.bashrc` or `~/.zshrc`:

```bash
alias rw='railway'
alias rwl='railway logs --follow'
alias rws='railway status'
alias rwd='railway up'
alias rwr='railway restart'
alias rwo='railway open'
alias rwsh='railway shell'
```

## Support Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app
- **ILS 2.0 Guide**: [docs/RAILWAY_DEPLOYMENT.md](docs/RAILWAY_DEPLOYMENT.md)

---

**Quick Start**: [RAILWAY_QUICK_START.md](RAILWAY_QUICK_START.md)
**Deployment Checklist**: [RAILWAY_CHECKLIST.md](RAILWAY_CHECKLIST.md)
**Full Documentation**: [docs/RAILWAY_DEPLOYMENT.md](docs/RAILWAY_DEPLOYMENT.md)
