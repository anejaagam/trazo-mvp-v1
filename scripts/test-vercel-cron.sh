#!/bin/bash
# Test Vercel Cron Endpoint
# Run this after deployment to verify the cron endpoint works

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CRON_SECRET="a190070be723571af295c460516c2a39236b2b70c27c426946a62fa58b7064e0"

echo -e "${BLUE}🔍 Testing Vercel Cron Endpoint${NC}"
echo ""

# Get production URL
echo "Enter your production URL (e.g., https://trazo-mvp-v1.vercel.app):"
read -r PROD_URL

# Remove trailing slash if present
PROD_URL=${PROD_URL%/}

echo ""
echo -e "${YELLOW}Testing endpoint: ${PROD_URL}/api/cron/telemetry-poll${NC}"
echo ""

# Test 1: Without auth (should fail with 401)
echo -e "${BLUE}Test 1: Unauthorized request (should return 401)${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET "${PROD_URL}/api/cron/telemetry-poll")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "401" ]; then
    echo -e "${GREEN}✅ Unauthorized request blocked correctly${NC}"
else
    echo -e "${RED}❌ Expected 401, got ${http_code}${NC}"
    echo "Response: $body"
fi

echo ""

# Test 2: With correct auth (should succeed)
echo -e "${BLUE}Test 2: Authorized request (should return 200)${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET "${PROD_URL}/api/cron/telemetry-poll" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo ""
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ Authorized request successful!${NC}"
    echo ""
    echo -e "${YELLOW}Response:${NC}"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
    echo ""
    
    # Parse summary if possible
    if echo "$body" | grep -q "success"; then
        success=$(echo "$body" | grep -o '"success":[^,}]*' | cut -d':' -f2)
        if [ "$success" = "true" ]; then
            echo -e "${GREEN}🎉 Polling service is working!${NC}"
        else
            echo -e "${YELLOW}⚠️  Polling service returned success=false${NC}"
        fi
    fi
else
    echo -e "${RED}❌ Expected 200, got ${http_code}${NC}"
    echo "Response: $body"
    echo ""
    echo -e "${YELLOW}Possible issues:${NC}"
    echo "- CRON_SECRET not set in Vercel"
    echo "- SUPABASE credentials missing"
    echo "- Database connection failure"
    echo ""
    echo "Check logs: vercel logs --since 5m"
fi

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Monitor Vercel logs: ${YELLOW}vercel logs --follow${NC}"
echo "2. Check database for new readings"
echo "3. Wait for automatic cron execution (every minute)"
echo "4. View dashboard: ${YELLOW}${PROD_URL}/dashboard/monitoring${NC}"
echo ""
