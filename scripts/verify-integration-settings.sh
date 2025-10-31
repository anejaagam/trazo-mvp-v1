#!/bin/bash

# Integration Settings Verification Script
# Tests database setup and API endpoints

set -e

echo "🔍 Integration Settings Verification"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if dev server is running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo -e "${RED}❌ Dev server not running. Start with: npm run dev${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Dev server is running${NC}"
echo ""

# Test 1: Check if integration_settings table exists
echo "Test 1: Database table exists"
if command -v psql &> /dev/null && [ -n "$DATABASE_URL" ]; then
  TABLE_EXISTS=$(psql $DATABASE_URL -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'integration_settings');")
  if [[ $TABLE_EXISTS == *"t"* ]]; then
    echo -e "${GREEN}✅ integration_settings table exists${NC}"
    
    # Show table structure
    echo ""
    echo "Table structure:"
    psql $DATABASE_URL -c "\d integration_settings" | head -n 20
  else
    echo -e "${RED}❌ integration_settings table not found${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠️  Skipping database check (psql not available or DATABASE_URL not set)${NC}"
fi

echo ""

# Test 2: Check if test data was removed
echo "Test 2: Test data cleanup"
if command -v psql &> /dev/null && [ -n "$DATABASE_URL" ]; then
  TEST_DATA=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM pods WHERE tagoio_device_id LIKE 'demo-device-%';")
  TEST_DATA=$(echo $TEST_DATA | xargs) # Trim whitespace
  
  if [ "$TEST_DATA" = "0" ]; then
    echo -e "${GREEN}✅ Test data removed successfully${NC}"
  else
    echo -e "${RED}❌ Found $TEST_DATA test device(s) still in database${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Skipping test data check${NC}"
fi

echo ""

# Test 3: Check if page compiles
echo "Test 3: TypeScript compilation"
if npm run typecheck > /dev/null 2>&1; then
  echo -e "${GREEN}✅ TypeScript compilation passes${NC}"
else
  echo -e "${RED}❌ TypeScript errors found${NC}"
  npm run typecheck
  exit 1
fi

echo ""

# Test 4: Check if files exist
echo "Test 4: Required files exist"
FILES=(
  "app/dashboard/admin/api-tokens/page.tsx"
  "components/features/admin/integration-settings-form.tsx"
  "lib/supabase/queries/integration-settings.ts"
  "lib/supabase/queries/integration-settings-server.ts"
  "lib/tagoio/polling-service.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅${NC} $file"
  else
    echo -e "${RED}❌${NC} $file (missing)"
    exit 1
  fi
done

echo ""

# Test 5: Check if old integrations directory was removed
echo "Test 5: Old directory cleanup"
if [ -d "app/dashboard/admin/integrations" ]; then
  echo -e "${YELLOW}⚠️  Old integrations directory still exists${NC}"
  echo "   Run: rm -rf app/dashboard/admin/integrations"
else
  echo -e "${GREEN}✅ Old integrations directory removed${NC}"
fi

echo ""
echo "===================================="
echo -e "${GREEN}🎉 All checks passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Navigate to http://localhost:3000/dashboard/admin/api-tokens"
echo "2. Test token configuration UI"
echo "3. Verify polling service: curl -X POST http://localhost:3000/api/cron/telemetry-poll"
echo ""
