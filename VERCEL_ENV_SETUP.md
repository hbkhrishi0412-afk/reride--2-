# 🔐 Environment Variables Setup for Vercel

## Required Environment Variables

Your Vercel deployment needs these environment variables to connect to MongoDB:

### MONGODB_URI

**Format:**
```
mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
```

**Example:**
```
mongodb+srv://reride_user:MySecurePassword123@cluster0.abc123.mongodb.net/reride?retryWrites=true&w=majority
```

**Important Notes:**
- Must use `mongodb+srv://` (not `mongodb://`)
- Include database name after cluster URL
- URL-encode special characters in password
- Add `?retryWrites=true&w=majority` at the end

### GEMINI_API_KEY (Optional)

For AI assistant features:
```
your_gemini_api_key_here
```

---

## How to Add Environment Variables in Vercel

### Step-by-Step Guide:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project

2. **Navigate to Settings**
   - Click on **Settings** tab
   - Click on **Environment Variables** in the left sidebar

3. **Add MONGODB_URI**
   - Click **Add New** button
   - **Name:** `MONGODB_URI`
   - **Value:** Your MongoDB connection string (see format above)
   - **Environments:** Select ALL three:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
   - Click **Save**

4. **Add GEMINI_API_KEY (if needed)**
   - Click **Add New** button again
   - **Name:** `GEMINI_API_KEY`
   - **Value:** Your Gemini API key
   - **Environments:** Select all three
   - Click **Save**

5. **Redeploy**
   - Go to **Deployments** tab
   - Click on latest deployment
   - Click **Redeploy** button
   - Select "Use existing Build Cache: NO"
   - Click **Redeploy**

---

## URL Encoding Special Characters

If your password contains special characters, you must URL-encode them:

| Character | Encoded |
|-----------|---------|
| `@`       | `%40`   |
| `:`       | `%3A`   |
| `/`       | `%2F`   |
| `?`       | `%3F`   |
| `#`       | `%23`   |
| `[`       | `%5B`   |
| `]`       | `%5D`   |
| `%`       | `%25`   |
| `$`       | `%24`   |
| `&`       | `%26`   |
| `+`       | `%2B`   |
| `,`       | `%2C`   |
| `=`       | `%3D`   |

**Example:**
```
Original Password: My@Pass#123
Encoded Password:  My%40Pass%23123

Original URI: mongodb+srv://user:My@Pass#123@cluster0.mongodb.net/reride
Encoded URI:  mongodb+srv://user:My%40Pass%23123@cluster0.mongodb.net/reride
```

---

## Verification

After adding environment variables and redeploying:

1. **Check Variable is Set:**
   - Vercel Dashboard → Settings → Environment Variables
   - You should see `MONGODB_URI` listed

2. **Test the Connection:**
   ```bash
   curl https://your-app.vercel.app/api/db-health
   ```

   Expected response:
   ```json
   {
     "status": "ok",
     "message": "Database connected successfully"
   }
   ```

3. **Check Function Logs:**
   - Vercel Dashboard → Deployments → Latest → Functions
   - Look for "MongoDB connected successfully" log

---

## Troubleshooting

### "MONGODB_URI environment variable is not configured"

**Solution:**
- Variable not added in Vercel dashboard
- Go to Settings → Environment Variables → Add `MONGODB_URI`
- Must redeploy after adding

### "Environment variables not available"

**Solution:**
- Check that variable is enabled for the right environment
- For production deployment, enable "Production"
- Redeploy after changing

### "Invalid connection string"

**Solution:**
- Check format: `mongodb+srv://user:pass@cluster/database?options`
- Must include database name
- Special characters must be URL-encoded
- Use `mongodb+srv://` not `mongodb://`

---

## Security Best Practices

1. ✅ **Never commit `.env` files** to Git
2. ✅ **Use strong passwords** for MongoDB
3. ✅ **Rotate credentials** periodically
4. ✅ **Limit MongoDB user permissions** to only what's needed
5. ✅ **Monitor MongoDB Atlas logs** for suspicious activity
6. ✅ **Use different credentials** for dev/staging/production

---

## Quick Copy-Paste Template

For Vercel Environment Variables:

```
Name: MONGODB_URI
Value: mongodb+srv://USERNAME:PASSWORD@CLUSTER/DATABASE?retryWrites=true&w=majority
Environments: Production, Preview, Development
```

**Remember to replace:**
- `USERNAME` - Your MongoDB user
- `PASSWORD` - Your password (URL-encoded)
- `CLUSTER` - Your cluster URL (e.g., cluster0.abc123.mongodb.net)
- `DATABASE` - Your database name (e.g., reride)

---

## Next Steps

After setting up environment variables:

1. ✅ Add `MONGODB_URI` in Vercel dashboard
2. ✅ Configure MongoDB Atlas Network Access (0.0.0.0/0)
3. ✅ Redeploy on Vercel
4. ✅ Test `/api/db-health` endpoint
5. ✅ Verify your application works

Done! Your MongoDB connection should now work on Vercel! 🎉

