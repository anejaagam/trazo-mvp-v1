#!/bin/bash
# Vercel Environment Variables Setup Script
# Run this to configure all environment variables for production

set -e

echo "🚀 Setting up Vercel environment variables for TRAZO Polling..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="prj_dr4r9kR9LJUimJvcSOWb7zoXmn0c"
TEAM_ID="team_CRswVX77pwUTMyqAgczZLlxl"

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

echo -e "${BLUE}Logging into Vercel...${NC}"
vercel login

echo ""
echo -e "${BLUE}Linking to project...${NC}"
vercel link --yes --project trazo-mvp-v1

echo ""
echo -e "${YELLOW}Setting environment variables for PRODUCTION...${NC}"
echo ""

# Helper function to set env var
set_env() {
    local key=$1
    local value=$2
    echo -e "${GREEN}Setting ${key}...${NC}"
    echo "$value" | vercel env add "$key" production --yes 2>/dev/null || \
    (vercel env rm "$key" production --yes 2>/dev/null && echo "$value" | vercel env add "$key" production --yes)
}

# Critical variables
echo "1/10: CRON_SECRET"
set_env "CRON_SECRET" "a190070be723571af295c460516c2a39236b2b70c27c426946a62fa58b7064e0"

echo "2/10: SUPABASE_SERVICE_ROLE_KEY"
set_env "SUPABASE_SERVICE_ROLE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycnJma2diY3JndHBscGVrd2ppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg2MDg4OSwiZXhwIjoyMDc1NDM2ODg5fQ._WjKuMcbVHk1LlsoOgT67xOFckbf5-lMa8YRNttYrd4"

echo "3/10: CAN_SUPABASE_SERVICE_ROLE_KEY"
set_env "CAN_SUPABASE_SERVICE_ROLE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpbGd4Ymh5b3Vmb2Zvcnh1eWVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg3NTM0NywiZXhwIjoyMDc1NDUxMzQ3fQ.kg25cFvFvEkUkEgjX4_qUIulyqrRFxYhjMq8Bsg_wjA"

echo "4/10: NEXT_PUBLIC_SUPABASE_URL"
set_env "NEXT_PUBLIC_SUPABASE_URL" "https://srrrfkgbcrgtplpekwji.supabase.co"

echo "5/10: NEXT_PUBLIC_SUPABASE_ANON_KEY"
set_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycnJma2diY3JndHBscGVrd2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NjA4ODksImV4cCI6MjA3NTQzNjg4OX0.fKi8wsa9ZV4UqgoHhcmWsJF77POfeHCtOyuYSf4gabw"

echo "6/10: NEXT_PUBLIC_CAN_SUPABASE_URL"
set_env "NEXT_PUBLIC_CAN_SUPABASE_URL" "https://eilgxbhyoufoforxuyek.supabase.co"

echo "7/10: NEXT_PUBLIC_CAN_SUPABASE_ANON_KEY"
set_env "NEXT_PUBLIC_CAN_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpbGd4Ymh5b3Vmb2Zvcnh1eWVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NzUzNDcsImV4cCI6MjA3NTQ1MTM0N30.LBp01Ua37R2BjkC6mQLO9XmbzD_MWVzugZ7ouighi0c"

echo "8/10: NEXT_PUBLIC_SITE_URL"
set_env "NEXT_PUBLIC_SITE_URL" "https://trazo-mvp-v1.vercel.app"

echo "9/10: NODE_ENV"
set_env "NODE_ENV" "production"

echo "10/10: NEXT_PUBLIC_DEV_MODE"
set_env "NEXT_PUBLIC_DEV_MODE" "false"

echo ""
echo -e "${GREEN}✅ All environment variables set!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the configuration above"
echo "2. Run: ${BLUE}vercel --prod${NC} to deploy"
echo "3. Test the cron endpoint after deployment"
echo ""
echo "For detailed instructions, see: VERCEL_POLLING_DEPLOYMENT.md"
