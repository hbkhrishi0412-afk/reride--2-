<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ReRide - Vehicle Marketplace Platform
<!-- Updated: Buyer dashboard fixes deployed -->

A modern, AI-powered vehicle marketplace platform built with React, TypeScript, and Google Gemini AI.

## Features

- 🚗 Vehicle listings with advanced search and filtering
- 🤖 AI-powered vehicle recommendations and descriptions
- 💬 Real-time messaging between buyers and sellers
- 📊 Seller dashboard with analytics
- 🔐 Multi-role authentication (Customer, Seller, Admin)
- 📱 Responsive design with modern UI/UX
- ⚡ Fast performance with Vite

## Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local instance or MongoDB Atlas account)
- **Google Gemini API Key** (get one from [Google AI Studio](https://aistudio.google.com/app/apikey))

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd reride
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   
   Then edit `.env.local` and add your credentials:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   MONGODB_URI=your_mongodb_connection_string_here
   ```

   **Getting your credentials:**
   - **Gemini API Key**: Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - **MongoDB URI**: 
     - For MongoDB Atlas (free): Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
     - For local MongoDB: Use `mongodb://localhost:27017/reride`

4. **Run the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## Building for Production

```bash
npm run build
npm run preview
```

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `GEMINI_API_KEY`
   - `MONGODB_URI`
4. Deploy!

### Environment Variables for Production

Make sure to set these in your hosting platform:
- `GEMINI_API_KEY` - Your Google Gemini API key
- `MONGODB_URI` - Your MongoDB connection string

## Project Structure

```
reride/
├── api/              # Backend API routes (Vercel serverless functions)
│   ├── lib-db.ts    # Database connection utility
│   ├── lib-user.ts  # User Mongoose model
│   ├── lib-vehicle.ts # Vehicle Mongoose model
│   └── *.ts         # API endpoints (auth, users, vehicles, etc.)
├── components/       # React components
├── services/         # Service layer for business logic
├── data/            # Static data
├── types.ts         # TypeScript type definitions
└── App.tsx          # Main application component
```

**Note:** The `lib-*.ts` files in the `api/` folder are utilities that don't export API handlers, so they won't create routes.

## Default Login Credentials

For testing purposes, you can seed the database with default users. Check the `api/seed.ts` file.

## Tech Stack

- **Frontend**: React 19, TypeScript, TailwindCSS
- **Backend**: Vercel Serverless Functions
- **Database**: MongoDB with Mongoose
- **AI**: Google Gemini API
- **Build Tool**: Vite
- **Charts**: Chart.js

## License

MIT

## Support

For issues and questions, please open an issue on GitHub or contact support.
