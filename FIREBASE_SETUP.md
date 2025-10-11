# Firebase Setup Guide for Google Auth and Phone OTP

This guide will help you set up Firebase Authentication for Google Sign-In and Phone OTP login on your Reride application.

## Prerequisites
- A Google account
- Node.js and npm installed
- Your Reride application running

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter your project name (e.g., "Reride")
4. Follow the setup wizard (you can disable Google Analytics if not needed)
5. Click "Create project"

## Step 2: Register Your Web App

1. In your Firebase project dashboard, click the Web icon (`</>`)
2. Register your app with a nickname (e.g., "Reride Web App")
3. Don't check "Firebase Hosting" unless you plan to use it
4. Click "Register app"
5. Copy the Firebase configuration object - you'll need these values

## Step 3: Enable Authentication Methods

### Enable Google Sign-In

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Google** in the providers list
3. Toggle the **Enable** switch
4. Enter your project support email
5. Click **Save**

### Enable Phone Authentication

1. In the same **Sign-in method** page, click on **Phone**
2. Toggle the **Enable** switch
3. Click **Save**

**Important for Phone Auth:**
- Phone authentication requires reCAPTCHA verification
- For testing, you can add test phone numbers in the Phone numbers for testing section
- Example: +91 1234567890 with code 123456

## Step 4: Configure Your Application

### Create Environment File

Create a `.env` file in your project root (if it doesn't exist):

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Add Your Firebase Configuration

Copy the values from Step 2 into your `.env` file:

- `apiKey` → `VITE_FIREBASE_API_KEY`
- `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
- `projectId` → `VITE_FIREBASE_PROJECT_ID`
- `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
- `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `appId` → `VITE_FIREBASE_APP_ID`

## Step 5: Add Authorized Domains

For production deployment:

1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add your production domain (e.g., `reride.vercel.app`)
3. `localhost` is already authorized for development

## Step 6: Test the Implementation

### Test Google Sign-In

1. Start your development server: `npm run dev`
2. Navigate to the Customer or Seller login page
3. Click the "Google" button
4. Sign in with your Google account
5. You should be redirected back and logged in

### Test Phone OTP

1. Navigate to the Customer or Seller login page
2. Click the "Phone OTP" button
3. Enter a valid Indian phone number (10 digits)
4. Click "Send OTP"
5. Enter the 6-digit OTP received on your phone
6. Click "Verify OTP"

**For Testing Without a Real Phone:**

1. Go to Firebase Console → Authentication → Sign-in method → Phone
2. Scroll to "Phone numbers for testing"
3. Add a test phone number (e.g., +91 9876543210) and a test code (e.g., 123456)
4. Use this phone number in your app with the test code

## Step 7: Deploy to Production

### Vercel Deployment

1. Add the environment variables to your Vercel project:
   - Go to your Vercel project settings
   - Navigate to Environment Variables
   - Add all the `VITE_FIREBASE_*` variables

2. Redeploy your application

### Important Security Notes

1. **API Key Security**: Firebase API keys are safe to expose in client-side code as they identify your Firebase project, not authorize access. Access is controlled by Security Rules.

2. **reCAPTCHA**: Phone authentication uses reCAPTCHA. Make sure your domain is properly configured in Firebase.

3. **Rate Limiting**: Firebase automatically rate-limits authentication requests. For production, consider implementing additional rate limiting on your backend.

## Features Included

✅ **Google Sign-In**
- One-click authentication
- Automatic account creation
- Profile photo sync

✅ **Phone OTP Login**
- Indian phone number support (+91)
- 6-digit OTP verification
- Resend OTP functionality
- Automatic account creation

✅ **Seamless Integration**
- Works with both Customer and Seller login
- Backend synchronization
- User profile management

## Troubleshooting

### Google Sign-In Issues

**Error: "This app is not verified"**
- This is normal during development
- Click "Advanced" → "Go to [Your App] (unsafe)" to continue
- For production, submit your app for verification

**Error: "Unauthorized domain"**
- Add your domain to Authorized domains in Firebase Console

### Phone OTP Issues

**Error: "reCAPTCHA verification failed"**
- Check if your domain is authorized
- Clear browser cache and cookies
- Try in an incognito window

**Error: "Invalid phone number"**
- Phone numbers must include country code (+91 for India)
- Use format: +91 followed by 10 digits

**OTP not received**
- Check if phone number is correct
- Try using a test phone number (see Step 6)
- Check Firebase quotas in Firebase Console

## Support

For issues or questions:
1. Check the Firebase documentation: https://firebase.google.com/docs/auth
2. Review the implementation in:
   - `lib/firebase.ts` - Firebase configuration
   - `services/authService.ts` - Authentication services
   - `components/OTPLogin.tsx` - OTP login UI
   - `CustomerLogin.tsx` & `Login.tsx` - Login pages

## Next Steps

- [ ] Set up test phone numbers for QA testing
- [ ] Configure production domains in Firebase
- [ ] Add environment variables to Vercel
- [ ] Test authentication flows in production
- [ ] Monitor authentication metrics in Firebase Console

