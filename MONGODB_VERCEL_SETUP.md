# 🔧 MongoDB Connection Fix for Vercel

## ✅ What I Fixed

I've made the following changes to fix your MongoDB connection on Vercel:

### 1. **Updated `vercel.json`**
   - Added CORS headers for API routes
   - Configured function memory (1024MB) and timeout (10s)
   - Proper API route handling

### 2. **Improved `api/lib-db.ts`**
   - Added better error handling and logging
   - Connection retry logic
   - Better connection caching
   - IPv4 enforcement (Vercel compatibility)
   - Detailed error messages

### 3. **Enhanced `api/db-health.ts`**
   - Diagnostic endpoint with detailed information
   - Connection timing
   - Helpful error messages
   - Environment variable checks

---

## 🚀 Steps to Fix MongoDB Connection on Vercel

### Step 1: Set Environment Variables in Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the following variable:

   **Variable Name:** `MONGODB_URI`
   
   **Value:** Your MongoDB connection string (format below)
   
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   ```
   
   Example:
   ```
   mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/reride?retryWrites=true&w=majority
   ```

5. **Important:** Enable this variable for all environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

6. Click **Save**

---

### Step 2: Configure MongoDB Atlas Network Access

Your MongoDB Atlas needs to allow connections from Vercel's servers:

1. Go to MongoDB Atlas: https://cloud.mongodb.com/
2. Select your project
3. Click **Network Access** in the left sidebar
4. Click **+ ADD IP ADDRESS**
5. Select **ALLOW ACCESS FROM ANYWHERE**
   - This adds `0.0.0.0/0` to the whitelist
   - This is required for Vercel serverless functions
6. Click **Confirm**

**Important:** Vercel serverless functions don't have fixed IP addresses, so you must allow `0.0.0.0/0`.

---

### Step 3: Verify MongoDB Connection String

Make sure your connection string is correct:

1. **Format Check:**
   ```
   mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
   ```

2. **Common Issues:**
   - ❌ Special characters in password not URL-encoded
   - ❌ Wrong cluster URL
   - ❌ Database name missing
   - ❌ Using `mongodb://` instead of `mongodb+srv://`

3. **Fix Special Characters:**
   If your password contains special characters like `@`, `#`, `$`, etc., you need to URL-encode them:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `%` → `%25`

   Example:
   ```
   Password: MyP@ss#123
   Encoded:  MyP%40ss%23123
   ```

---

### Step 4: Deploy to Vercel

After setting the environment variables, deploy your changes:

**Option A: Using Git (Recommended)**
```bash
git add .
git commit -m "Fix MongoDB connection for Vercel"
git push origin main
```
Vercel will automatically deploy.

**Option B: Force Redeploy from Dashboard**
1. Go to Vercel dashboard → Your project
2. Click **Deployments** tab
3. Click the latest deployment
4. Click **Redeploy** → **Use existing Build Cache: NO**

**Option C: Using Vercel CLI**
```bash
npx vercel --force
```

---

### Step 5: Test the Connection

After deployment completes:

1. **Test Database Health Endpoint:**
   ```bash
   curl https://your-app.vercel.app/api/db-health
   ```

   **Expected Success Response:**
   ```json
   {
     "status": "ok",
     "message": "Database connected successfully",
     "details": {
       "connectionState": "connected",
       "connectionTime": "150ms",
       "host": "cluster0.abc123.mongodb.net",
       "name": "reride"
     },
     "timestamp": "2025-10-11T..."
   }
   ```

2. **Test Auth Endpoint:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/auth \
     -H "Content-Type: application/json" \
     -d '{"action":"login","email":"test@example.com","password":"test123"}'
   ```

3. **Check Vercel Logs:**
   - Go to Vercel dashboard → Your project
   - Click **Deployments** → Latest deployment
   - Click **Functions** tab
   - View logs for any errors

---

## 🔍 Troubleshooting

### Error: "MONGODB_URI environment variable is not configured"

**Solution:**
- Go to Vercel dashboard → Settings → Environment Variables
- Make sure `MONGODB_URI` is added
- Verify it's enabled for Production environment
- Redeploy after adding

---

### Error: "Authentication failed" or "Invalid credentials"

**Solution:**
1. Check your MongoDB username and password
2. In MongoDB Atlas → Database Access → Edit user
3. Verify password is correct
4. If password has special characters, URL-encode them
5. Update `MONGODB_URI` in Vercel
6. Redeploy

---

### Error: "Connection timeout" or "Server selection timeout"

**Solution:**
1. Go to MongoDB Atlas → Network Access
2. Make sure `0.0.0.0/0` is in the IP whitelist
3. Wait a few minutes for changes to propagate
4. Redeploy to Vercel

---

### Error: "MongoServerError: bad auth"

**Solution:**
1. Your credentials are wrong
2. Go to MongoDB Atlas → Database Access
3. Create a new user or reset password
4. Update `MONGODB_URI` in Vercel with new credentials
5. Make sure to URL-encode special characters
6. Redeploy

---

### Error: "Unable to connect to database"

**Possible Causes:**
1. **MongoDB cluster is paused** - Resume it in Atlas
2. **Wrong connection string** - Verify format
3. **Network access not configured** - Add 0.0.0.0/0
4. **Database doesn't exist** - Create it in Atlas

---

## 📋 Checklist

Before deploying, make sure:

- [ ] MongoDB Atlas cluster is running (not paused)
- [ ] Network Access allows `0.0.0.0/0` in MongoDB Atlas
- [ ] `MONGODB_URI` environment variable is set in Vercel
- [ ] `MONGODB_URI` is enabled for Production environment
- [ ] Password special characters are URL-encoded
- [ ] Connection string uses `mongodb+srv://` (not `mongodb://`)
- [ ] Database name is included in connection string
- [ ] Latest code is pushed to GitHub
- [ ] Vercel deployment completed successfully
- [ ] `/api/db-health` endpoint returns success

---

## 🧪 Quick Test Commands

**1. Test from your local machine:**
```bash
# Replace YOUR-APP-URL with your actual Vercel URL
export VERCEL_URL="https://your-app.vercel.app"

# Test health endpoint
curl $VERCEL_URL/api/db-health

# Test vehicles endpoint
curl $VERCEL_URL/api/vehicles

# Test users endpoint
curl $VERCEL_URL/api/users
```

**2. Test from browser:**
Open these URLs in your browser:
- `https://your-app.vercel.app/api/db-health`
- `https://your-app.vercel.app/api/vehicles`

---

## 🎯 Common MongoDB Atlas Setup

If you need to set up MongoDB Atlas from scratch:

1. **Create Account:** https://www.mongodb.com/cloud/atlas/register
2. **Create Cluster:**
   - Choose FREE tier (M0)
   - Select a cloud provider (AWS recommended)
   - Choose region closest to your users
   - Click "Create Cluster"

3. **Create Database User:**
   - Go to Database Access
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `reride_user`
   - Password: Generate a strong password (save it!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

4. **Configure Network Access:**
   - Go to Network Access
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere"
   - This adds `0.0.0.0/0`
   - Click "Confirm"

5. **Get Connection String:**
   - Go to Database → Connect
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Replace `<database>` with `reride`
   - Example: `mongodb+srv://reride_user:YOUR_PASSWORD@cluster0.abc123.mongodb.net/reride?retryWrites=true&w=majority`

6. **Add to Vercel:**
   - Copy the connection string
   - Go to Vercel → Settings → Environment Variables
   - Add `MONGODB_URI` with the connection string
   - Save and redeploy

---

## 📞 Need More Help?

If you're still having issues:

1. **Check Vercel Function Logs:**
   - Vercel Dashboard → Deployments → Click deployment → Functions tab
   - Look for detailed error messages

2. **Check MongoDB Atlas Logs:**
   - MongoDB Atlas → Monitoring → Logs
   - Look for connection attempts and errors

3. **Test Connection String Locally:**
   Create a test file `test-mongo.js`:
   ```javascript
   const mongoose = require('mongoose');
   
   const uri = 'YOUR_MONGODB_URI';
   
   mongoose.connect(uri)
     .then(() => {
       console.log('✅ Connected successfully!');
       process.exit(0);
     })
     .catch((err) => {
       console.error('❌ Connection failed:', err);
       process.exit(1);
     });
   ```
   
   Run: `node test-mongo.js`

---

## ✨ Summary

Your MongoDB connection should now work on Vercel with:
- ✅ Proper CORS headers
- ✅ Better error handling
- ✅ Connection caching
- ✅ Detailed diagnostics
- ✅ Environment variable checks

**Next Steps:**
1. Set `MONGODB_URI` in Vercel dashboard
2. Configure MongoDB Atlas Network Access (0.0.0.0/0)
3. Deploy to Vercel
4. Test `/api/db-health` endpoint
5. Verify your app works!

Good luck! 🚀

