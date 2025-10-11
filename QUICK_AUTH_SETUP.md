# Quick Authentication Setup Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Create a project"
3. Name it (e.g., "Reride")
4. Follow the wizard

### Step 2: Get Firebase Config
1. Click the Web icon (`</>`) in project overview
2. Register your app
3. Copy the config values

### Step 3: Add Environment Variables
Create or update `.env` file:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Step 4: Enable Authentication
1. Go to **Authentication** → **Sign-in method**
2. Enable **Google** (add support email)
3. Enable **Phone** (no extra config needed)
4. Click Save

### Step 5: Test It!
```bash
npm run dev
```
Navigate to login and try:
- Click "Google" button
- Click "Phone OTP" button

## 🧪 Testing Without Real Phone

Add test phone numbers in Firebase:
1. Authentication → Sign-in method → Phone
2. Scroll to "Phone numbers for testing"
3. Add: `+91 9876543210` with code `123456`
4. Use these in your app

## 🌐 Production Deployment

### Vercel
1. Go to Vercel project settings
2. Add all `VITE_FIREBASE_*` environment variables
3. Redeploy

### Firebase
1. Authentication → Settings → Authorized domains
2. Add your production domain

## ✅ What You Get

- ✅ Google Sign-In for customers and sellers
- ✅ Phone OTP login for customers and sellers
- ✅ Automatic account creation
- ✅ Backend synchronization
- ✅ Secure authentication flow

## 📚 Full Documentation

- **FIREBASE_SETUP.md** - Complete setup instructions
- **AUTHENTICATION_FEATURES.md** - Feature documentation and code examples

## 🆘 Common Issues

**Google Sign-In not working?**
- Check if domain is authorized in Firebase Console
- Clear browser cache and try again

**Phone OTP not received?**
- Use test phone numbers for development
- Check Firebase quotas in Console
- Verify phone number format (+91 followed by 10 digits)

**Backend errors?**
- Make sure MongoDB is connected
- Check if `.env` variables are loaded
- Restart dev server after adding variables

## 🎉 You're Ready!

Your authentication system is fully implemented and ready to use. Just add Firebase configuration and you're good to go!

