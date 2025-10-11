# Database Setup Instructions

## The Issue
The admin login is failing with "Failed to execute 'json' on 'Response': Unexpected end of JSON input" because the application is trying to connect to a MongoDB database that hasn't been configured or seeded.

## Quick Fix for Development

### Option 1: Set up MongoDB (Recommended for production)

1. **Set up MongoDB Atlas (Free tier available):**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free account and cluster
   - Get your connection string

2. **Set environment variable:**
   ```bash
   # In your deployment platform (Vercel, Netlify, etc.)
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/reride?retryWrites=true&w=majority
   ```

3. **Seed the database:**
   - Visit `/api/seed` in your browser after deployment
   - This will populate the database with mock users including:
     - Email: `admin@test.com`
     - Password: `password`
     - Role: `admin`

### Option 2: Use Local Storage (Quick fix for testing)

If you want to test immediately without setting up MongoDB, you can modify the user service to use local storage instead of the API.

## Admin Login Credentials
Once the database is seeded, use these credentials:
- **Email:** admin@test.com
- **Password:** password

## Verification
After seeding, you should be able to:
1. Login with admin credentials
2. Access the admin panel
3. See mock users and vehicles in the system

## Troubleshooting
- Make sure the MONGODB_URI environment variable is set correctly
- Check that the `/api/seed` endpoint runs successfully
- Verify the database connection in your deployment logs
