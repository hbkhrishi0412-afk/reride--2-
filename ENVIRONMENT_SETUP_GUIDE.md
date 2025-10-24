# Environment Configuration Guide

## 🔒 Secure Environment Setup

This guide explains how to securely configure environment variables for the ReRide application.

### 📁 Required Files

#### 1. Create `.env` file (DO NOT commit to git)
```bash
# Copy the example and fill in your values
cp .env.example .env
```

#### 2. `.env` file content:
```bash
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/?appName=your_app_name

# Environment
NODE_ENV=development
PORT=3000

# Add other environment variables as needed
```

### 🚨 Security Best Practices

#### ✅ DO:
- Use environment variables for all sensitive data
- Store `.env` file locally (not in git)
- Use strong, unique passwords
- Rotate credentials regularly
- Use MongoDB Atlas IP whitelist
- Enable MongoDB Atlas authentication

#### ❌ DON'T:
- Commit `.env` files to version control
- Share credentials in chat/email
- Use weak passwords
- Store credentials in code
- Use production credentials in development

### 🔧 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/?appName=App` |
| `NODE_ENV` | Application environment | `development`, `production` |
| `PORT` | Server port | `3000`, `8080` |

### 🚀 Deployment

#### Vercel Deployment:
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add `MONGODB_URI` with your production connection string
5. Redeploy your application

#### Other Platforms:
- **Heroku**: Use `heroku config:set MONGODB_URI=your_connection_string`
- **Railway**: Add environment variables in dashboard
- **DigitalOcean**: Use App Platform environment variables

### 🔍 Troubleshooting

#### Common Issues:
1. **Connection Failed**: Check if credentials are correct
2. **Network Error**: Verify IP whitelist in MongoDB Atlas
3. **Authentication Error**: Ensure username/password are correct
4. **URL Encoding**: Use `%40` for `@` in passwords

#### Testing Connection:
```bash
# Test MongoDB connection
node test-mongodb-data.js
```

### 📞 Support

If you encounter issues:
1. Check MongoDB Atlas logs
2. Verify environment variables are set
3. Test connection string format
4. Check network connectivity

---

**Remember**: Security is everyone's responsibility. Keep your credentials safe!
