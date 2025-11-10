#!/bin/bash

###############################################################################
# Apply Telemetry Deduplication Migration to Both Regions
#
# This script applies the telemetry deduplication migration to both
# US and Canada Supabase instances.
#
# Usage:
#   ./scripts/apply-telemetry-deduplication.sh
#
# Environment variables required:
#   - SUPABASE_URL (US region)
#   - SUPABASE_DB_PASSWORD (US region)
#   - CANADA_SUPABASE_URL (Canada region)
#   - CANADA_SUPABASE_DB_PASSWORD (Canada region)
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Migration file
MIGRATION_FILE="lib/supabase/migrations/20251107_add_telemetry_deduplication.sql"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Telemetry Deduplication Migration (Multi-Region)             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
  echo -e "${RED}❌ Migration file not found: $MIGRATION_FILE${NC}"
  exit 1
fi

echo -e "${GREEN}✓${NC} Migration file found: $MIGRATION_FILE"
echo ""

###############################################################################
# Function to apply migration to a region
###############################################################################
apply_migration() {
  local REGION_NAME=$1
  local DB_URL=$2
  local DB_PASSWORD=$3
  
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}Applying migration to: ${REGION_NAME}${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  if [ -z "$DB_URL" ]; then
    echo -e "${RED}❌ Database URL not set for ${REGION_NAME}${NC}"
    return 1
  fi
  
  if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}❌ Database password not set for ${REGION_NAME}${NC}"
    return 1
  fi
  
  # Extract connection details from Supabase URL
  # Format: https://xxxxxxxxxxxx.supabase.co
  PROJECT_REF=$(echo "$DB_URL" | sed -E 's|https://([^.]+)\.supabase\.co.*|\1|')
  
  if [ -z "$PROJECT_REF" ]; then
    echo -e "${RED}❌ Could not extract project reference from URL${NC}"
    return 1
  fi
  
  # Construct PostgreSQL connection string
  # Supabase uses db.[project-ref].supabase.co for direct Postgres access
  PGHOST="db.${PROJECT_REF}.supabase.co"
  PGPORT="5432"
  PGDATABASE="postgres"
  PGUSER="postgres"
  PGPASSWORD="$DB_PASSWORD"
  
  echo -e "${YELLOW}→${NC} Connecting to: $PGHOST"
  
  # Check if constraint already exists
  CONSTRAINT_EXISTS=$(PGPASSWORD="$PGPASSWORD" psql \
    "postgresql://$PGUSER@$PGHOST:$PGPORT/$PGDATABASE?sslmode=require" \
    -tAc "SELECT COUNT(*) FROM pg_constraint WHERE conname = 'telemetry_readings_pod_timestamp_unique';")
  
  if [ "$CONSTRAINT_EXISTS" -gt 0 ]; then
    echo -e "${YELLOW}⚠${NC}  Constraint already exists, skipping migration for ${REGION_NAME}"
    echo -e "${GREEN}✓${NC} ${REGION_NAME} is up to date"
    echo ""
    return 0
  fi
  
  # Apply migration
  echo -e "${YELLOW}→${NC} Applying migration..."
  
  PGPASSWORD="$PGPASSWORD" psql \
    "postgresql://$PGUSER@$PGHOST:$PGPORT/$PGDATABASE?sslmode=require" \
    -f "$MIGRATION_FILE"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Migration applied successfully to ${REGION_NAME}"
  else
    echo -e "${RED}❌ Failed to apply migration to ${REGION_NAME}${NC}"
    return 1
  fi
  
  echo ""
}

###############################################################################
# Apply to US Region
###############################################################################
if [ -n "$SUPABASE_URL" ]; then
  apply_migration "US Region" "$SUPABASE_URL" "$SUPABASE_DB_PASSWORD"
else
  echo -e "${YELLOW}⚠${NC}  SUPABASE_URL not set, skipping US region"
  echo ""
fi

###############################################################################
# Apply to Canada Region
###############################################################################
if [ -n "$CANADA_SUPABASE_URL" ]; then
  apply_migration "Canada Region" "$CANADA_SUPABASE_URL" "$CANADA_SUPABASE_DB_PASSWORD"
else
  echo -e "${YELLOW}⚠${NC}  CANADA_SUPABASE_URL not set, skipping Canada region"
  echo ""
fi

###############################################################################
# Summary
###############################################################################
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Migration complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Run historical data import: ${YELLOW}npm run poll:historical${NC}"
echo -e "  2. Verify no duplicates in telemetry_readings table"
echo -e "  3. Monitor regular polling to ensure upsert works correctly"
echo ""
