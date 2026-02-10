#!/bin/bash
# Setup script for resume examples and previews
# This script runs migrations, seeds examples, and generates previews

set -e

echo "🚀 Starting Resume Examples Setup..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in Docker or local
if [ -f /.dockerenv ] || [ -n "$DOCKER_CONTAINER" ]; then
    echo -e "${YELLOW}Running in Docker container${NC}"
    USE_TSX=true
else
    echo -e "${YELLOW}Running locally${NC}"
    USE_TSX=false
fi

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
if command -v pg_isready &> /dev/null; then
    until pg_isready -h ${POSTGRES_HOST:-postgres} -p ${POSTGRES_PORT:-5432} -U ${POSTGRES_USER:-studojo} 2>/dev/null; do
        echo "   Waiting for PostgreSQL..."
        sleep 2
    done
    echo -e "${GREEN}✓ Database is ready${NC}"
else
    echo "   pg_isready not found, skipping check"
fi

echo ""

# Step 1: Run migrations (if not already done)
echo "📦 Step 1: Checking database migrations..."
if [ -d "apps/frontend/drizzle" ]; then
    echo "   Migration files found"
    # Migrations are typically run by the db-push service in docker-compose
    # or by the k8s job, so we'll skip manual migration here
    echo -e "${GREEN}✓ Migrations should be handled by db-push service${NC}"
else
    echo -e "${YELLOW}⚠ Migration directory not found${NC}"
fi

echo ""

# Step 2: Seed example resumes
echo "🌱 Step 2: Seeding example resumes..."
if [ "$USE_TSX" = true ]; then
    echo "   Running seed script with tsx..."
    cd apps/frontend
    npx tsx ../../scripts/seed-resume-examples.ts
    cd ../..
else
    echo "   Running seed script..."
    if command -v tsx &> /dev/null; then
        tsx scripts/seed-resume-examples.ts
    elif command -v ts-node &> /dev/null; then
        ts-node scripts/seed-resume-examples.ts
    else
        echo -e "${YELLOW}⚠ tsx or ts-node not found. Install with: npm install -g tsx${NC}"
        exit 1
    fi
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Example resumes seeded${NC}"
else
    echo -e "${YELLOW}⚠ Seed script failed or examples already exist${NC}"
fi

echo ""

# Step 3: Generate preview images
echo "🖼️  Step 3: Generating preview images..."
echo "   This may take a few minutes..."

# Generate template previews
echo "   Generating template previews..."
if [ "$USE_TSX" = true ]; then
    cd apps/frontend
    npx tsx ../../scripts/generate-template-previews.ts || echo -e "${YELLOW}⚠ Template preview generation failed (may need canvas/pdfjs-dist)${NC}"
    cd ../..
else
    if command -v tsx &> /dev/null; then
        tsx scripts/generate-template-previews.ts || echo -e "${YELLOW}⚠ Template preview generation failed (may need canvas/pdfjs-dist)${NC}"
    elif command -v ts-node &> /dev/null; then
        ts-node scripts/generate-template-previews.ts || echo -e "${YELLOW}⚠ Template preview generation failed (may need canvas/pdfjs-dist)${NC}"
    else
        echo -e "${YELLOW}⚠ tsx or ts-node not found. Skipping preview generation${NC}"
    fi
fi

# Generate example previews
echo "   Generating example resume previews..."
if [ "$USE_TSX" = true ]; then
    cd apps/frontend
    npx tsx ../../scripts/generate-example-previews.ts || echo -e "${YELLOW}⚠ Example preview generation failed (may need canvas/pdfjs-dist)${NC}"
    cd ../..
else
    if command -v tsx &> /dev/null; then
        tsx scripts/generate-example-previews.ts || echo -e "${YELLOW}⚠ Example preview generation failed (may need canvas/pdfjs-dist)${NC}"
    elif command -v ts-node &> /dev/null; then
        ts-node scripts/generate-example-previews.ts || echo -e "${YELLOW}⚠ Example preview generation failed (may need canvas/pdfjs-dist)${NC}"
    else
        echo -e "${YELLOW}⚠ tsx or ts-node not found. Skipping preview generation${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Note: Preview generation requires 'canvas' and 'pdfjs-dist' packages."
echo "If previews failed, install them with: npm install canvas pdfjs-dist"

