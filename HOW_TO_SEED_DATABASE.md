# 🚀 HOW TO SEED YOUR DATABASE (3 Easy Methods)

Your production database is empty. Choose **ONE** of these methods to populate it with test data:

---

## ✅ METHOD 1: Browser Console (EASIEST & FASTEST)

**Best for:** Quick seeding right after deployment

### Steps:

1. **Open your deployed website** in a browser
   - Go to: `https://your-app.vercel.app`

2. **Open Developer Tools**
   - Press `F12` (Windows/Linux)
   - Or `Cmd + Option + I` (Mac)

3. **Go to Console tab**

4. **Paste this code and press Enter:**

```javascript
fetch('/api/seed', { method: 'POST' })
  .then(res => res.json())
  .then(data => {
    console.log('✅ SUCCESS!', data);
    alert(`Database seeded!\n\nUsers: ${data.data.users.inserted}\nVehicles: ${data.data.vehicles.inserted}\n\nPage will refresh...`);
    setTimeout(() => location.reload(), 2000);
  })
  .catch(err => console.error('❌ ERROR:', err));
```

5. **Wait for success message** (takes 5-10 seconds)

6. **Page will auto-refresh** with data loaded! 🎉

---

## ✅ METHOD 2: Visual Seeding Tool (PRETTIEST)

**Best for:** Non-technical users or visual interface

### Steps:

1. **Copy `seed-production.html`** to your desktop or downloads folder

2. **Open it in a browser** (double-click the file)

3. **Enter your site URL:**
   - Example: `https://your-app.vercel.app`

4. **Click "Seed Database Now"**

5. **Success!** You'll see:
   - ✅ 7 users inserted
   - ✅ 50 vehicles inserted
   - 🔑 Login credentials

6. **Click OK** to go to your site

---

## ✅ METHOD 3: Command Line (FOR DEVELOPERS)

**Best for:** Developers who prefer terminal

### Option A: Using Node.js

```bash
# Quick method
node seed-quick.js

# Or specify MongoDB URI directly
node seed-quick.js "mongodb+srv://user:pass@cluster.mongodb.net/reride"
```

### Option B: Using the full script

```bash
# Make sure .env file has MONGODB_URI
node seed-database.js
```

### Option C: Using cURL

```bash
curl -X POST https://your-app.vercel.app/api/seed
```

---

## 🎯 What Gets Seeded?

After seeding, you'll have:

### 👥 Users (7 total)

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| **Admin** | admin@test.com | password | Full access |
| **Seller** | seller@test.com | password | Prestige Motors (Premium) |
| **Seller** | john.smith@seller.com | password | Reliable Rides (Pro) |
| **Seller** | speedy@auto.com | password | Speedy Auto (Pro) |
| **Seller** | eco@drive.com | password | Eco Drive (Free) |
| **Customer** | customer@test.com | password | Regular user |
| **Customer** | jane.doe@customer.com | password | Regular user |

### 🚗 Vehicles (50 total)

- Multiple Indian brands: Tata, Mahindra, Hyundai, Maruti Suzuki, Honda, Toyota, Kia, MG
- Various models and variants
- Years: 2015-2024
- Price range: ₹4,00,000 - ₹40,00,000
- Different cities across India
- Mix of featured and regular listings
- Some with certified inspections
- Realistic service records

---

## ⚠️ Prerequisites

### 1. MongoDB URI Set in Vercel

Before seeding, ensure `MONGODB_URI` is set:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. **Settings** → **Environment Variables**
4. Check if `MONGODB_URI` exists
5. If not, add it:
   ```
   Key:   MONGODB_URI
   Value: mongodb+srv://username:password@cluster.mongodb.net/reride
   ```
6. **Redeploy** after adding

### 2. MongoDB Atlas Network Access

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. **Network Access** → **Add IP Address**
3. For testing: Add `0.0.0.0/0` (allows all)
4. For production: Add specific IPs
5. Wait 1-2 minutes for changes

---

## ✅ Verify Seeding Worked

### Check in Application

1. **Homepage** → Should show 50 vehicles
2. **Login as Admin** → User Management shows 7 users
3. **Login as Seller** → Dashboard shows your vehicles

### Check in MongoDB Atlas

1. **Database** → **Browse Collections**
2. Should see:
   - `users` collection: **7 documents**
   - `vehicles` collection: **50 documents**

### Check API Directly

Visit in browser:
```
https://your-app.vercel.app/api/users
https://your-app.vercel.app/api/vehicles
```

Should return JSON with data.

---

## 🔧 Troubleshooting

### ❌ "MONGODB_URI environment variable is not defined"

**Fix:**
1. Add `MONGODB_URI` in Vercel Environment Variables
2. Redeploy the application
3. Try seeding again

### ❌ "Failed to connect to database"

**Fix:**
1. Check MongoDB Atlas is running
2. Verify network access allows `0.0.0.0/0`
3. Test connection string is correct
4. Check username/password

### ❌ "Authentication failed"

**Fix:**
1. Go to MongoDB Atlas → **Database Access**
2. Verify user exists
3. Reset password if needed
4. Update `MONGODB_URI` with correct credentials

### ❌ "Network timeout" or "ENOTFOUND"

**Fix:**
1. MongoDB Atlas → **Network Access**
2. Add `0.0.0.0/0` to IP whitelist
3. Wait 2-3 minutes
4. Try again

### ❌ Data shows but login fails

**Issue:** Password comparison issue

**Fix:**
- The mock data uses plain text passwords
- Your auth system should handle this
- Check `authService.ts` password comparison logic

---

## 🔄 Re-seed (Fresh Data)

To clear and reload all data:

### Browser Console:
```javascript
fetch('/api/seed', { method: 'POST' })
  .then(res => res.json())
  .then(data => console.log('✅ Fresh data loaded!', data));
```

### Command Line:
```bash
node seed-quick.js
```

⚠️ **Warning:** This **DELETES ALL** existing data!

---

## 📋 Quick Checklist

- [ ] MongoDB Atlas cluster created
- [ ] `MONGODB_URI` set in Vercel
- [ ] Network access configured (0.0.0.0/0)
- [ ] App deployed to Vercel
- [ ] Seed API called successfully
- [ ] Data visible in MongoDB Atlas
- [ ] Data visible in application
- [ ] Login works with test credentials

---

## 🎉 Success!

After seeding, you should have:

✅ **User Management:** 7 users (1 admin, 4 sellers, 2 customers)  
✅ **Vehicle Listings:** 50 realistic vehicles  
✅ **Login Working:** Test with credentials above  
✅ **Seller Dashboard:** Shows assigned vehicles  
✅ **Admin Panel:** Full control  

---

## 💡 Recommended: Method 1 (Browser Console)

**Why?**
- ✅ Fastest (takes 10 seconds)
- ✅ No additional tools needed
- ✅ Works from anywhere
- ✅ Instant feedback
- ✅ Auto-refresh on success

Just open your site, press F12, paste the code, done! 🚀

---

## 📞 Still Need Help?

If seeding fails after trying all methods:

1. Check Vercel deployment logs
2. Check MongoDB Atlas metrics
3. Verify all prerequisites above
4. Test connection with `test-vercel-db.sh`

---

**TL;DR:** Open your deployed site → Press F12 → Paste the fetch code → Press Enter → Done in 10 seconds! 🎉

