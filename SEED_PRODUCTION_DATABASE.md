# 🌱 Seed Production Database - Quick Guide

## Problem
After deployment to Vercel, your database is empty. Users and vehicles are not showing up because MongoDB has no data.

## Solution
You have a seed API endpoint at `/api/seed` that will populate your database with mock data.

---

## ✅ Quick Method: Call the Seed API

### Option 1: Using Browser (Easiest)

1. **Open your deployed website** (e.g., `https://your-app.vercel.app`)
2. **Open browser console** (Press F12)
3. **Run this command:**

```javascript
fetch('/api/seed', { method: 'POST' })
  .then(res => res.json())
  .then(data => {
    console.log('✅ Database seeded!', data);
    console.log('Refreshing page...');
    setTimeout(() => location.reload(), 1500);
  })
  .catch(err => console.error('❌ Error:', err));
```

4. **Wait for success message**
5. **Page will auto-refresh** with data loaded!

### Option 2: Using cURL (Command Line)

```bash
curl -X POST https://your-app.vercel.app/api/seed
```

Replace `your-app.vercel.app` with your actual Vercel domain.

### Option 3: Using API Client (Postman/Insomnia)

- **Method:** POST
- **URL:** `https://your-app.vercel.app/api/seed`
- **Click Send**

---

## 📊 What Gets Seeded?

### Users (7 Total)
- **1 Admin:** `admin@test.com` (password: `password`)
- **4 Sellers:**
  - `seller@test.com` - Prestige Motors (Premium)
  - `john.smith@seller.com` - Reliable Rides (Pro)
  - `speedy@auto.com` - Speedy Auto (Pro)
  - `eco@drive.com` - Eco Drive (Free)
- **2 Customers:**
  - `customer@test.com`
  - `jane.doe@customer.com`

All passwords: `password`

### Vehicles (50 Total)
- Multiple makes and models (Tata, Mahindra, Hyundai, Honda, Toyota, etc.)
- Years: 2015 - 2024
- Price range: ₹4L - ₹40L
- Various cities across India
- Mix of featured and regular listings
- Some with certified inspections
- Realistic service records and accident history

---

## ⚠️ Important Prerequisites

### 1. MongoDB URI Must Be Set in Vercel

Go to your Vercel Dashboard:
1. Select your project
2. Go to **Settings** → **Environment Variables**
3. Check if `MONGODB_URI` exists
4. If not, add it:
   ```
   Key:   MONGODB_URI
   Value: mongodb+srv://username:password@cluster.mongodb.net/reride
   ```
5. **Redeploy** your app after adding the variable

### 2. MongoDB Atlas Network Access

Make sure your MongoDB Atlas allows connections:
1. Go to MongoDB Atlas Dashboard
2. **Network Access** → Add IP Address
3. For testing: Allow `0.0.0.0/0` (all IPs)
4. For production: Add Vercel's IP ranges

---

## 🔍 Verify Data Loaded

### Check in Your Application

1. **Homepage** → Should show 50 vehicles
2. **Login as Admin** (`admin@test.com`) → User Management should show 7 users
3. **Login as Seller** (`seller@test.com`) → Dashboard should show assigned vehicles

### Check in MongoDB Atlas

1. Go to MongoDB Atlas → **Database** → **Browse Collections**
2. You should see:
   - `users` collection: **7 documents**
   - `vehicles` collection: **50 documents**

### Check Browser Console

Open console (F12) and look for:
```
✅ Database seeded successfully!
```

---

## 🔧 Troubleshooting

### Error: "Failed to seed database"

**Cause:** MongoDB connection issue

**Fix:**
1. Check `MONGODB_URI` is set in Vercel
2. Check MongoDB Atlas network access
3. Verify database credentials are correct

### Error: "MONGODB_URI environment variable is not defined"

**Fix:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add `MONGODB_URI` with your MongoDB connection string
3. Redeploy the app

### Error: "Network timeout" or "ENOTFOUND"

**Fix:**
1. Go to MongoDB Atlas → Network Access
2. Add IP `0.0.0.0/0` to allow all connections
3. Wait 1-2 minutes for changes to propagate
4. Try seeding again

### Data shows but login doesn't work

**Issue:** Passwords in mock data are plain text, not hashed

**Fix:** The authentication system should handle this, but if issues persist:
- Check that your auth service compares passwords correctly
- Consider updating the seed data to use hashed passwords

---

## 🔄 Re-seed Database (Fresh Data)

To clear and reload all data:

1. Visit your deployed site
2. Open browser console (F12)
3. Run:
```javascript
fetch('/api/seed', { method: 'POST' })
  .then(res => res.json())
  .then(data => console.log('✅ Fresh data loaded!', data));
```

⚠️ **Warning:** This will **DELETE ALL** existing data and replace it with fresh mock data!

---

## 📋 Quick Checklist

- [ ] MongoDB Atlas cluster created
- [ ] MONGODB_URI set in Vercel Environment Variables
- [ ] Network access configured in MongoDB Atlas (0.0.0.0/0)
- [ ] App deployed to Vercel
- [ ] Seed API called successfully
- [ ] Data visible in MongoDB Atlas
- [ ] Data visible in application
- [ ] Login working with test credentials

---

## 🎯 Expected Result

After successful seeding:

✅ **User Management:** 7 users visible  
✅ **Vehicle Listings:** 50 vehicles visible  
✅ **Login Works:** Can login with test accounts  
✅ **Seller Dashboard:** Shows assigned vehicles  
✅ **Admin Panel:** Shows all users and vehicles  

---

## 🚀 Next Steps

1. **Test the seed endpoint** (see Option 1 above)
2. **Verify data loads** in your application
3. **Test login** with credentials above
4. **Customize data** if needed (edit `constants.ts`)
5. **Deploy changes** if you modify the seed data

---

## 📞 Still Having Issues?

If the seed endpoint doesn't work:

1. Check Vercel deployment logs:
   - Vercel Dashboard → Deployments → Select latest → View Logs
2. Check for errors in the Function logs
3. Try the local seeding method below

---

## 💻 Alternative: Local Seeding Script

If the API endpoint doesn't work, you can seed from your local machine:

```bash
# Make sure MONGODB_URI is in your .env file
node seed-database.js
```

This will connect to your production MongoDB and seed it directly.

---

## Summary

**Fastest Method:** Open your deployed site, press F12, paste the fetch command, done! 🎉

The seed API endpoint (`/api/seed`) is ready to use and will populate your database with:
- 7 users (admin, sellers, customers)
- 50 realistic vehicles
- All test credentials with password: `password`

Just call the endpoint and your production database will be populated instantly!

