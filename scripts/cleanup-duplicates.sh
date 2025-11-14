#!/bin/bash

###############################################################################
# ILS 2.0 Codebase Cleanup Script
# Removes duplicate and unnecessary files from the repository
# 
# USAGE: bash scripts/cleanup-duplicates.sh [--dry-run]
#
# --dry-run: Show what would be deleted without actually deleting
###############################################################################

set -u  # Fail on undefined variables, but allow delete to continue

DRY_RUN=false
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Parse arguments
if [[ "${1:-}" == "--dry-run" ]]; then
    DRY_RUN=true
    echo "🔍 DRY RUN MODE - No files will be deleted"
    echo ""
fi

echo "🧹 ILS 2.0 Codebase Cleanup"
echo "================================"
echo "Repository: $REPO_ROOT"
echo "Mode: $([ "$DRY_RUN" = true ] && echo "DRY RUN" || echo "ACTUAL DELETION")"
echo ""

# Counter for deleted files
DELETED_COUNT=0

# Helper function to delete with dry-run support
delete_file() {
    local file="$1"
    local reason="$2"
    
    if [[ -f "$REPO_ROOT/$file" ]] || [[ -d "$REPO_ROOT/$file" ]]; then
        if [ "$DRY_RUN" = true ]; then
            echo "  ❌ [DRY RUN] Would delete: $file"
        else
            rm -rf "$REPO_ROOT/$file"
            echo "  ✅ Deleted: $file"
            ((DELETED_COUNT++))
        fi
    fi
}

# PHASE 1: Documentation Cleanup (35 files)
echo ""
echo "📋 PHASE 1: Cleaning deployment/status documentation..."

delete_file "AUDIT_REPORT_FINAL.md" "interim audit"
delete_file "BRUTAL_AUDIT_REPORT.md" "interim audit"
delete_file "CLEANUP_SUMMARY.md" "interim cleanup note"
delete_file "CODE_READINESS_REPORT.md" "interim code report"
delete_file "DATABASE_MIGRATION_FINAL_STATUS.md" "interim migration status"
delete_file "DEPLOYMENT_CHECKLIST.md" "duplicate of .txt version"
delete_file "DEPLOYMENT_CHECKLIST.txt" "interim checklist"
delete_file "DEPLOYMENT_COMPLETE.md" "obsolete - replaced by DEPLOYMENT_READY_NOW.md"
delete_file "DEPLOYMENT_COMPLETE_SUMMARY.md" "interim summary"
delete_file "DEPLOYMENT_DOCUMENTATION_INDEX.md" "interim index"
delete_file "DEPLOYMENT_GUIDE.md" "use RAILWAY_DEPLOYMENT_GUIDE.md instead"
delete_file "DEPLOYMENT_READY.md" "duplicate of DEPLOYMENT_READY_NOW.md"
delete_file "DEPLOYMENT_STATUS.md" "interim status"
delete_file "DEPLOY_NOW.md" "interim deployment doc"
delete_file "DOCKER_INDEX.md" "interim index"
delete_file "DOCKER_QUICK_REF.md" "duplicate of DOCKER_README.md"
delete_file "DOCKER_SETUP_COMPLETE.md" "interim status"
delete_file "DOCKER_TESTING_GUIDE.md" "interim guide"
delete_file "DOCKER_VISUAL_SUMMARY.md" "interim visual"
delete_file "EXECUTIVE_SUMMARY.md" "interim summary"
delete_file "FINAL_CLEANUP_REPORT.md" "interim report"
delete_file "FINAL_SESSION_SUMMARY.md" "session-specific log"
delete_file "FINAL_STATUS.txt" "interim status"
delete_file "FOUNDATION_STATUS.md" "interim status"
delete_file "HONEST_STATUS.md" "interim status"
delete_file "IMPLEMENTATION_ROADMAP.md" "obsolete plan"
delete_file "IMPROVEMENTS_SUMMARY.md" "interim summary"
delete_file "MIGRATION_PROGRESS.md" "interim progress"
delete_file "MIGRATION_STATUS_AND_FIX_GUIDE.md" "obsolete migration guide"
delete_file "ML_FEATURES_STATUS.md" "interim feature status"
delete_file "NEXT_SESSION_CHECKLIST.md" "session-specific"
delete_file "NLP_FEATURES_STATUS.md" "interim feature status"
delete_file "PHASE_2_CLEANUP_SUMMARY.md" "interim cleanup"
delete_file "PLATFORM_REIMAGINED.md" "interim design doc"
delete_file "PLATFORM_STATUS.md" "interim status"
delete_file "SESSION_PROGRESS_REPORT.md" "session-specific log"
delete_file "SESSION_WORK_SUMMARY.md" "session-specific log"
delete_file "STORAGE_AND_ARCHIVAL_GUIDE.md" "interim guide"
delete_file "WEEK_1_ACTION_PLAN.md" "session-specific plan"

# PHASE 2: Shell & Deployment Scripts (5 files)
echo ""
echo "🔧 PHASE 2: Cleaning deployment scripts..."

delete_file "DEPLOY_RAILWAY_NOW.sh" "use deploy-railway.sh instead"
delete_file "START_DOCKER_TESTING.md" "interim doc"
delete_file "QUICK_DEPLOY.md" "interim doc"
delete_file "QUICKSTART_NEW_FEATURES.md" "interim doc"
delete_file "RUN_THIS_TO_DEPLOY.md" "interim doc"

# PHASE 3: Environment Configuration (5 files)
echo ""
echo "🔐 PHASE 3: Cleaning environment files..."

delete_file ".env.queues.example" "merge into .env.example"
delete_file ".env.railway.template" "use .env.railway instead"
delete_file ".env.scalability.example" "deprecated config"
delete_file ".env.storage.example" "deprecated config"
delete_file ".env.docker" "merge into .env.example"

# PHASE 4: Docker Configuration (2 files)
echo ""
echo "🐳 PHASE 4: Cleaning Docker files..."

delete_file "Dockerfile.backup" "not needed"
delete_file "Dockerfile.dev" "use docker-compose.dev.yml"

# PHASE 5: Configuration & Redundant Files (4 files)
echo ""
echo "⚙️  PHASE 5: Cleaning redundant configuration..."

delete_file "railway-deploy-instructions.txt" "covered in RAILWAY_DEPLOYMENT_GUIDE.md"
delete_file ".railwayignore" "use .gitignore instead"
delete_file "RAILWAY_CHECKLIST.md" "covered in DEPLOYMENT_READY_NOW.md"
delete_file "RAILWAY_DEPLOYMENT_AUDIT.md" "covered by audit docs"

# PHASE 6: Archives & Legacy (1 directory)
echo ""
echo "📦 PHASE 6: Cleaning archived/legacy files..."

delete_file ".archive" "archived content"

# Summary
echo ""
echo "================================"
echo "✨ Cleanup Summary"
echo "================================"

if [ "$DRY_RUN" = true ]; then
    echo "🔍 DRY RUN COMPLETE"
    echo "   To actually perform cleanup, run: bash scripts/cleanup-duplicates.sh"
else
    echo "✅ Cleanup Complete!"
    echo "   Total files deleted: $DELETED_COUNT"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Review changes: git status"
    echo "   2. Verify tests pass: npm run check"
    echo "   3. Commit changes: git add -A && git commit -m 'chore: cleanup duplicate files'"
fi

echo ""
