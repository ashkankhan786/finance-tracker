# Finance Tracker

A modern personal finance management application that helps users track expenses, analyze spending patterns, and manage their financial data with AI-powered transaction parsing.

## Features

- **User Authentication**: Secure Google OAuth integration with JWT tokens
- **Transaction Management**: Add, edit, and delete transactions with ease
- **AI-Powered Parsing**: Automatic transaction parsing using Google Gemini AI
- **Analytics Dashboard**: Visual spending analysis with interactive charts
- **Category Tracking**: Organize expenses by customizable categories
- **Dark/Light Theme**: System-aware theme toggle for better user experience
- **Responsive Design**: Optimized for desktop and mobile devices

## Tech Stack

### Frontend

- **React** - UI library
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **SWR** - Data fetching and caching
- **Recharts** - Charts and data visualization
- **ShadCN UI** - Modern UI components

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication tokens
- **Google OAuth** - User authentication
- **Google Gemini AI** - Transaction parsing

## Project Structure

```
/finance-tracker
├── /frontend          # React frontend application
├── /backend           # Express.js backend API
├── /docs             # Documentation files
├── README.md         # This file
├── .env.example      # Environment variables template
└── package.json      # Root package.json for easy setup
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Google Cloud Console project for OAuth
- Google AI Studio API key for Gemini

### Quick Setup (Recommended)

1. **Clone the repository**

   ```bash
   git clone <your-repository-url>
   cd finance-tracker
   ```

2. **Install all dependencies**

   ```bash
   npm run install-all
   ```

3. **Set up Environment Variables**

   - Copy the backend variables from `.env.example` to `backend/.env`
   - Copy the frontend variables from `.env.example` to `frontend/.env`
   - Fill in your actual values (see Environment Variables section below)

4. **Run the application**
   ```bash
   npm run dev
   ```
   This will start both frontend (http://localhost:5173) and backend (http://localhost:5000) simultaneously.

### Alternative: Manual Setup

If you prefer to set up each part individually:

1. **Clone the repository**

   ```bash
   git clone <your-repository-url>
   cd finance-tracker
   ```

2. **Install Frontend Dependencies**

   ```bash
   cd frontend
   npm install
   ```

3. **Install Backend Dependencies**

   ```bash
   cd ../backend
   npm install
   ```

4. **Set up Environment Variables** (same as above)

5. **Run Frontend and Backend Separately**

   ```bash
   # Terminal 1 - Backend
   npm run server

   # Terminal 2 - Frontend
   npm run client
   ```

### Available Scripts

From the root directory:

- `npm run dev` - Start both frontend and backend concurrently
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend development server
- `npm run install-all` - Install dependencies for both frontend and backend
- `npm run build` - Build the frontend for production
- `npm start` - Start the backend in production mode

### Environment Variables

The `.env.example` file contains all required environment variables. Copy the appropriate sections to create your `.env` files:

#### Frontend (.env)

Place these variables in `frontend/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_SERVER_URL=http://localhost:5000
```

#### Backend (.env)

Place these variables in `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MONGODB_URI=mongodb://localhost:27017/finance-tracker
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
```

## Usage

1. **Authentication**: Sign in with your Google account
2. **Add Transactions**: Use natural language to describe transactions (e.g., "Coffee at Starbucks $6.50")
3. **View Dashboard**: Monitor spending patterns with interactive charts
4. **Manage Categories**: Organize expenses by category
5. **Edit/Delete**: Modify or remove transactions as needed
6. **Theme Toggle**: Switch between dark and light modes

## API Endpoints

### Authentication

- `POST /auth/google` - Google OAuth login
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get user profile

### Transactions

- `GET /api/transactions` - Get all user transactions
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `POST /api/transactions/parse` - Parse transaction text with AI

### Analytics

- `GET /api/analytics/summary` - Get financial summary
- `GET /api/analytics/categories` - Get spending by category
- `GET /api/analytics/trends` - Get spending trends

## Credits

- UI Design: [v0.dev](https://v0.dev)
- Development & Debugging: [Claude AI](https://claude.ai)
- Icons: [Lucide React](https://lucide.dev)
- UI Components: [ShadCN UI](https://ui.shadcn.com)

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**

   - Ensure MongoDB is running locally or check your Atlas connection string
   - Verify MONGODB_URI in backend/.env

2. **Google OAuth Issues**

   - Check Google Console configuration
   - Ensure redirect URLs are properly set
   - Verify GOOGLE_CLIENT_ID matches in both frontend and backend

3. **CORS Errors**

   - Verify VITE_SERVER_URL in frontend/.env
   - Check backend CORS configuration

4. **AI Parsing Not Working**

   - Verify GEMINI_API_KEY in backend/.env
   - Check Google AI Studio quotas and permissions

5. **Concurrently Issues**
   - If `npm run dev` doesn't work, try running frontend and backend separately:
     ```bash
     npm run server  # In one terminal
     npm run client  # In another terminal
     ```
