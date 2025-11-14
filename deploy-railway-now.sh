#!/bin/bash
set -e

echo "🚂 ILS 2.0 - Railway Deployment"
echo "================================="
echo ""

cd /Users/saban/Documents/GitHub/ILS2.0

# Step 1: Link to Railway project
echo "Step 1: Linking to Railway project..."
echo "When prompted, select: ILS-2.0-Healthcare-Platform"
railway link

# Step 2: Check status
echo ""
echo "Step 2: Checking project status..."
railway status

# Step 3: Deploy
echo ""
echo "Step 3: Deploying to Railway..."
railway up

# Step 4: Wait for deployment
echo ""
echo "Step 4: Waiting for deployment to complete..."
sleep 15

# Step 5: Check deployment logs
echo ""
echo "Step 5: Checking deployment logs..."
railway logs --limit 50

# Step 6: Get URL
echo ""
echo "Step 6: Getting deployment URL..."
railway domain

echo ""
echo "✅ Deployment process complete!"
echo ""
echo "Next steps:"
echo "1. Check logs: railway logs"
echo "2. Initialize DB: railway run npm run db:push"
echo "3. Check health: railway run curl http://localhost:3000/api/health"
echo ""
