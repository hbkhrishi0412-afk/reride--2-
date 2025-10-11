#!/bin/bash

# Test MongoDB Connection on Vercel
# Usage: ./test-vercel-db.sh your-app-name.vercel.app

if [ -z "$1" ]; then
    echo "❌ Error: Please provide your Vercel app URL"
    echo "Usage: ./test-vercel-db.sh your-app-name.vercel.app"
    echo "Example: ./test-vercel-db.sh reride-app.vercel.app"
    exit 1
fi

VERCEL_URL="$1"

# Remove https:// if provided
VERCEL_URL="${VERCEL_URL#https://}"
VERCEL_URL="${VERCEL_URL#http://}"

echo "🧪 Testing MongoDB Connection on Vercel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📍 Target: https://$VERCEL_URL"
echo ""

echo "1️⃣  Testing Database Health Endpoint..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
response=$(curl -s -w "\n%{http_code}" "https://$VERCEL_URL/api/db-health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo "✅ SUCCESS! Database connected"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo "❌ FAILED! HTTP Status: $http_code"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   1. Check MONGODB_URI in Vercel dashboard"
    echo "   2. Verify MongoDB Atlas Network Access allows 0.0.0.0/0"
    echo "   3. Check MongoDB credentials are correct"
    echo "   4. Wait 2 minutes after adding IP whitelist"
    exit 1
fi

echo ""
echo "2️⃣  Testing Vehicles Endpoint..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
response=$(curl -s -w "\n%{http_code}" "https://$VERCEL_URL/api/vehicles")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    count=$(echo "$body" | jq '. | length' 2>/dev/null || echo "?")
    echo "✅ SUCCESS! Found $count vehicles"
else
    echo "⚠️  HTTP Status: $http_code"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
fi

echo ""
echo "3️⃣  Testing Users Endpoint..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
response=$(curl -s -w "\n%{http_code}" "https://$VERCEL_URL/api/users")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    count=$(echo "$body" | jq '. | length' 2>/dev/null || echo "?")
    echo "✅ SUCCESS! Found $count users"
else
    echo "⚠️  HTTP Status: $http_code"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ All tests completed!"
echo ""
echo "📝 Next steps:"
echo "   - If tests failed, check MONGODB_VERCEL_SETUP.md"
echo "   - Use QUICK_FIX_CHECKLIST.md for quick fixes"
echo "   - Check Vercel function logs for detailed errors"
echo ""

