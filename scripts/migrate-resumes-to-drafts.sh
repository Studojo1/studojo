#!/bin/bash
# Migration script to convert legacy resumes to resume_drafts v2 format
# This script runs the migration SQL to convert all existing resumes to the new draft format

set -e

echo "🔄 Migrating legacy resumes to resume_drafts v2 format..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set"
    echo "Please set it: export DATABASE_URL=postgresql://user:pass@host:5432/db"
    exit 1
fi

# Run the migration
echo "📊 Running migration SQL..."
psql "$DATABASE_URL" -f apps/frontend/drizzle/0015_migrate_resumes_to_drafts.sql

echo ""
echo "✅ Migration complete!"
echo ""
echo "All legacy resumes have been migrated to resume_drafts."
echo "You can verify by checking: SELECT COUNT(*) FROM resume_drafts;"

