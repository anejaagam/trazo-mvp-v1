#!/bin/bash

echo "🔄 Testing TagoIO Polling Service..."
echo ""

# Get the cron secret
CRON_SECRET=$(grep "^CRON_SECRET" .env.local | cut -d'=' -f2)

if [ -z "$CRON_SECRET" ]; then
  echo "❌ CRON_SECRET not found in .env.local"
  exit 1
fi

echo "✅ Found CRON_SECRET"
echo ""

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "❌ Dev server not running on http://localhost:3000"
  echo "   Run: npm run dev"
  exit 1
fi

echo "✅ Dev server is running"
echo ""

# Call the polling endpoint
echo "📡 Calling polling endpoint..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "http://localhost:3000/api/cron/telemetry-poll" \
  -H "Authorization: Bearer $CRON_SECRET")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Polling successful (HTTP $HTTP_CODE)"
  echo ""
  echo "Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ Polling failed (HTTP $HTTP_CODE)"
  echo ""
  echo "Response:"
  echo "$BODY"
fi
