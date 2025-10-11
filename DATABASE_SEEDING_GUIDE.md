# 🌱 Database Seeding Guide

## Overview

This guide explains how to populate your MongoDB database with users and vehicles data.

## Two Storage Options

### 1. **localStorage** (Current - Development Only)
- ✅ Works immediately without setup
- ✅ Good for local testing
- ❌ Data lost when clearing browser cache
- ❌ Each user has their own data
- ❌ Won't work in production

### 2. **MongoDB Database** (Recommended - Production Ready)
- ✅ Persistent data
- ✅ Shared across all users
- ✅ Production ready
- ✅ Can be deployed to Vercel
- ⚠️ Requires MongoDB setup

## Quick Start: Seed MongoDB Database

### Prerequisites

1. **MongoDB Atlas Account** (Free)
   - Go to: https://www.mongodb.com/cloud/atlas
   - Sign up for free account
   - Create a free cluster (M0)

2. **Get Connection String**
   - In MongoDB Atlas → Clusters → Connect
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

### Step 1: Set MongoDB Connection

Create a `.env` file in project root:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/reride?retryWrites=true&w=majority
```

Replace with your actual connection string!

### Step 2: Seed the Database

Run the seeding script:

```bash
node seed-database.js
```

You should see:

```
🔄 Starting database seeding...
📡 Connecting to MongoDB...
✅ Connected to MongoDB

👥 Seeding users...
✅ Seeded 5 users

🚗 Seeding vehicles...
✅ Seeded 50 vehicles

🎉 Database seeded successfully!
```

### Step 3: Verify Data Loaded

Your database now contains:

**Users** (5 total):
- 1 Admin
- 2 Sellers (with dealership info)
- 2 Customers

**Vehicles** (50 total):
- Multiple makes: Tata, Mahindra, Hyundai, etc.
- Years: 2015-2024
- Price range: ₹3L - ₹25L
- Mix of featured/regular listings
- Different cities across India

## What Gets Seeded

### Users Collection

```javascript
- admin@test.com (Admin user)
- seller@test.com (Prestige Motors - Premium)
- john.smith@seller.com (Reliable Rides - Pro)
- customer@test.com (Regular customer)
- jane.doe@customer.com (Regular customer)
```

All passwords: `password`

### Vehicles Collection

50 vehicles with:
- Realistic Indian car makes/models
- Proper RTO codes
- Insurance validity dates
- Multiple cities
- Seller assignments
- Featured flags
- View counts

## MongoDB Atlas Setup (Detailed)

### 1. Create Account

1. Visit https://www.mongodb.com/cloud/atlas
2. Sign up with email or Google
3. Verify email

### 2. Create Cluster

1. Click "Build a Database"
2. Choose "FREE" (M0) tier
3. Select cloud provider (AWS recommended)
4. Choose region closest to you
5. Name your cluster (e.g., "reride-cluster")
6. Click "Create"

### 3. Configure Database Access

1. Go to "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Set username and password (save these!)
5. Grant "Read and write to any database"
6. Click "Add User"

### 4. Configure Network Access

1. Go to "Network Access"
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production: Add your server's IP
5. Click "Confirm"

### 5. Get Connection String

1. Go back to "Databases"
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password

## Vercel Deployment

### Add Environment Variable to Vercel

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   ```
   Key:   MONGODB_URI
   Value: mongodb+srv://username:password@cluster...
   ```
5. Click "Save"
6. Redeploy your application

## Troubleshooting

### Error: "Authentication failed"

**Problem**: Wrong username or password

**Solution**:
1. Go to MongoDB Atlas → Database Access
2. Verify user exists
3. Reset password if needed
4. Update connection string with correct credentials

### Error: "Network error" or "ENOTFOUND"

**Problem**: IP not whitelisted

**Solution**:
1. Go to MongoDB Atlas → Network Access
2. Add IP address 0.0.0.0/0 (allows all)
3. Wait 1-2 minutes for changes to propagate

### Error: "Connection string is invalid"

**Problem**: Malformed connection string

**Solution**:
1. Check for special characters in password
2. Ensure password is URL-encoded
3. Verify cluster name is correct
4. Should look like: `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/dbname`

### Error: "Database name is required"

**Problem**: Missing database name

**Solution**:
Add `/reride` before the query parameters:
```
mongodb+srv://...mongodb.net/reride?retryWrites=true
```

### Data not showing after seeding

**Check:**
1. Run: `node seed-database.js` again
2. Check console for errors
3. Verify connection string is correct
4. Check MongoDB Atlas → Browse Collections to see data

## Verify Seeding Success

### Option 1: MongoDB Atlas UI

1. Go to MongoDB Atlas → Databases
2. Click "Browse Collections"
3. Should see:
   - `users` collection (5 documents)
   - `vehicles` collection (50 documents)

### Option 2: Application

1. Start app: `npm run dev`
2. Navigate to homepage → should see 50 vehicles
3. Login as admin → should see 5 users in admin panel
4. Login as seller → should see vehicles assigned to you

### Option 3: Console Logs

Open browser console (F12) and look for:
```
getUsers: API success, loaded 5 users
getVehicles: API success, loaded 50 vehicles
```

## Re-seed Database

To refresh data with new seed:

```bash
node seed-database.js
```

This will:
1. Delete all existing users
2. Delete all existing vehicles
3. Insert fresh seed data

⚠️ **Warning**: This deletes ALL data! Use with caution in production.

## Update Seed Data

### Add More Vehicles

Edit `seed-database.js`:

```javascript
const MOCK_VEHICLES = generateMockVehicles(100); // Increase from 50 to 100
```

### Add More Users

Add to `MOCK_USERS` array in `seed-database.js`:

```javascript
{
  name: 'New Seller',
  email: 'newseller@test.com',
  password: 'password',
  // ... other fields
}
```

## Production Best Practices

1. **Change Default Passwords**
   - Don't use 'password' in production
   - Generate strong passwords
   - Store securely

2. **Environment Variables**
   - Never commit `.env` file
   - Add to `.gitignore`
   - Use Vercel environment variables

3. **Database Security**
   - Restrict network access in production
   - Use strong database passwords
   - Enable MongoDB Atlas monitoring

4. **Backup Data**
   - MongoDB Atlas auto-backups on M10+ tiers
   - Export data periodically
   - Test restore process

## Next Steps

After seeding:

1. ✅ Verify data in MongoDB Atlas
2. ✅ Test login with seeded credentials
3. ✅ Check vehicles display on homepage
4. ✅ Deploy to Vercel with MONGODB_URI
5. 📋 Optional: Customize seed data

## Files Reference

- `seed-database.js` - Complete seeding script (users + vehicles)
- `seed-simple.js` - Users only (legacy)
- `.env` - MongoDB connection string
- `DATABASE_SEEDING_GUIDE.md` - This guide

## Summary

**Current Status**: Using localStorage (temporary)  
**Recommended**: Seed MongoDB database (permanent)  
**Time Required**: 10-15 minutes setup  
**Cost**: Free (MongoDB Atlas M0 tier)  

**Steps**:
1. Create MongoDB Atlas account
2. Get connection string
3. Add to `.env` file
4. Run `node seed-database.js`
5. Deploy to Vercel with MONGODB_URI

**Result**: Production-ready database with 5 users and 50 vehicles! 🎉

