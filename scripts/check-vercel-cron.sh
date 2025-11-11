#!/bin/bash

# Script to check and test Vercel cron job
# Usage: ./scripts/check-vercel-cron.sh

set -e

echo "======================================"
echo "TRAZO MVP - Vercel Cron Job Checker"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env.local ]; then
    source .env.local
else
    echo -e "${RED}❌ .env.local file not found${NC}"
    exit 1
fi

echo "📋 Checking required environment variables..."
echo ""

# Check required variables
MISSING_VARS=0

check_var() {
    local var_name=$1
    local var_value=${!var_name}
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}❌ $var_name: NOT SET${NC}"
        MISSING_VARS=$((MISSING_VARS + 1))
    else
        # Mask the value for security
        local masked_value="${var_value:0:8}...${var_value: -4}"
        echo -e "${GREEN}✅ $var_name: $masked_value${NC}"
    fi
}

# Check all required variables
check_var "CRON_SECRET"
check_var "NEXT_PUBLIC_SUPABASE_URL"
check_var "NEXT_PUBLIC_SUPABASE_ANON_KEY"
check_var "SUPABASE_SERVICE_ROLE_KEY"

echo ""

if [ $MISSING_VARS -gt 0 ]; then
    echo -e "${RED}❌ $MISSING_VARS required variable(s) missing${NC}"
    echo ""
    echo "Please add them to your .env.local file"
    exit 1
fi

echo -e "${GREEN}✅ All required environment variables are set locally${NC}"
echo ""

# Test the cron endpoint locally
echo "🧪 Testing cron endpoint locally..."
echo ""

# Start the dev server in the background if not already running
if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Local dev server not running on port 3000"
    echo "Start it with: npm run dev"
    echo ""
else
    echo "Testing local endpoint: http://localhost:3000/api/cron/telemetry-poll"
    
    # Make request with auth header
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $CRON_SECRET" \
        http://localhost:3000/api/cron/telemetry-poll)
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Cron endpoint responded successfully (HTTP $http_code)${NC}"
        echo ""
        echo "Response:"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ Cron endpoint failed (HTTP $http_code)${NC}"
        echo ""
        echo "Response:"
        echo "$body"
    fi
    echo ""
fi

# Instructions for Vercel
echo "======================================"
echo "📦 Vercel Environment Setup"
echo "======================================"
echo ""
echo "To enable the cron job in Vercel production, add these environment variables:"
echo ""
echo "1. Go to: https://vercel.com/trazo-os/trazo-mvp-v1/settings/environment-variables"
echo ""
echo "2. Add the following variables for 'Production' environment:"
echo ""
echo "   CRON_SECRET"
echo "   Value: $CRON_SECRET"
echo ""
echo "   NEXT_PUBLIC_SUPABASE_URL"  
echo "   Value: $NEXT_PUBLIC_SUPABASE_URL"
echo ""
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   Value: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo ""
echo "   SUPABASE_SERVICE_ROLE_KEY"
echo "   Value: (your service role key)"
echo ""
echo "3. After adding variables, redeploy production:"
echo "   vercel --prod"
echo ""
echo "======================================"
echo "🔍 Checking Production Deployment"
echo "======================================"
echo ""

# Get production URL from vercel.json or use default
PROD_URL="trazo-mvp-v1.vercel.app"

echo "Production URL: https://$PROD_URL"
echo ""
echo "To test production cron (after env vars are set):"
echo ""
echo "  curl -H \"Authorization: Bearer \$CRON_SECRET\" \\"
echo "    https://$PROD_URL/api/cron/telemetry-poll"
echo ""
echo "Note: Vercel cron jobs run automatically every minute in production."
echo "You don't need to call them manually once deployed."
echo ""
