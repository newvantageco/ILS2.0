# Railway Build Cache Fix

## Problem
Railway build fails with: `/docker-start.sh: not found`

The file **exists** in the repository but Railway's cached build layers don't have it.

## Solution: Clear Railway Build Cache

### Option 1: Via Railway Dashboard (Recommended)

1. Go to your Railway project dashboard
2. Click on the **ILS 2.0** service
3. Go to **Settings** tab
4. Scroll to **Danger Zone**
5. Click **"Clear Build Cache"**
6. Click **"Redeploy"**

### Option 2: Via Railway CLI

```bash
# Install Railway CLI if needed
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Clear cache and redeploy
railway up --detach
```

### Option 3: Force Rebuild (Add Empty Commit)

```bash
# Create an empty commit to force rebuild
git commit --allow-empty -m "chore: Force Railway rebuild - clear cache"
git push origin main
```

## Verification

After clearing cache, check Railway logs for:

```
✅ [internal] load build context
✅ [builder 8/8] RUN npm run build
✅ [production 14/16] COPY --chown=nodejs:nodejs docker-start.sh ./docker-start.sh
✅ [production 15/16] RUN chmod +x ./docker-start.sh
```

## Why This Happens

Railway uses Docker BuildKit with aggressive caching. When a file is added to the repository after the initial build, the cached layers might not include it, causing "file not found" errors even though the file exists in git.

## Alternative: Update Dockerfile

If clearing cache doesn't work, modify the Dockerfile to explicitly verify the file exists:

```dockerfile
# Before the COPY command, add:
RUN echo "=== Verifying docker-start.sh exists ===" && \
    ls -la / || true

# Then the normal COPY
COPY --chown=nodejs:nodejs docker-start.sh ./docker-start.sh
```

This forces a cache bust and shows what files are available in the build context.
