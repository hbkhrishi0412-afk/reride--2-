# Test MongoDB Connection on Vercel (PowerShell)
# Usage: .\test-vercel-db.ps1 your-app-name.vercel.app

param(
    [Parameter(Mandatory=$true)]
    [string]$VercelUrl
)

# Remove https:// if provided
$VercelUrl = $VercelUrl -replace "^https://", "" -replace "^http://", ""

Write-Host "🧪 Testing MongoDB Connection on Vercel" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Target: https://$VercelUrl" -ForegroundColor White
Write-Host ""

# Test 1: Database Health
Write-Host "1️⃣  Testing Database Health Endpoint..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "https://$VercelUrl/api/db-health" -Method Get -UseBasicParsing
    $body = $response.Content | ConvertFrom-Json
    
    if ($response.StatusCode -eq 200 -and $body.status -eq "ok") {
        Write-Host "✅ SUCCESS! Database connected" -ForegroundColor Green
        Write-Host ($body | ConvertTo-Json -Depth 10)
    } else {
        Write-Host "❌ FAILED! Status: $($response.StatusCode)" -ForegroundColor Red
        Write-Host ($body | ConvertTo-Json -Depth 10)
        Write-Host ""
        Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
        Write-Host "   1. Check MONGODB_URI in Vercel dashboard"
        Write-Host "   2. Verify MongoDB Atlas Network Access allows 0.0.0.0/0"
        Write-Host "   3. Check MongoDB credentials are correct"
        Write-Host "   4. Wait 2 minutes after adding IP whitelist"
        exit 1
    }
} catch {
    Write-Host "❌ FAILED! Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host $errorBody
    }
    Write-Host ""
    Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Check MONGODB_URI in Vercel dashboard"
    Write-Host "   2. Verify MongoDB Atlas Network Access allows 0.0.0.0/0"
    Write-Host "   3. Check MongoDB credentials are correct"
    exit 1
}

Write-Host ""

# Test 2: Vehicles Endpoint
Write-Host "2️⃣  Testing Vehicles Endpoint..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "https://$VercelUrl/api/vehicles" -Method Get -UseBasicParsing
    $body = $response.Content | ConvertFrom-Json
    
    if ($response.StatusCode -eq 200) {
        $count = ($body | Measure-Object).Count
        Write-Host "✅ SUCCESS! Found $count vehicles" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Status: $($response.StatusCode)" -ForegroundColor Yellow
        Write-Host ($body | ConvertTo-Json -Depth 10)
    }
} catch {
    Write-Host "⚠️  Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Test 3: Users Endpoint
Write-Host "3️⃣  Testing Users Endpoint..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "https://$VercelUrl/api/users" -Method Get -UseBasicParsing
    $body = $response.Content | ConvertFrom-Json
    
    if ($response.StatusCode -eq 200) {
        $count = ($body | Measure-Object).Count
        Write-Host "✅ SUCCESS! Found $count users" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Status: $($response.StatusCode)" -ForegroundColor Yellow
        Write-Host ($body | ConvertTo-Json -Depth 10)
    }
} catch {
    Write-Host "⚠️  Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✨ All tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   - If tests failed, check MONGODB_VERCEL_SETUP.md"
Write-Host "   - Use QUICK_FIX_CHECKLIST.md for quick fixes"
Write-Host "   - Check Vercel function logs for detailed errors"
Write-Host ""

