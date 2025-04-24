# Laundries - Modern Laundry Management System

A full-stack application for laundry business management with a modern and futuristic UI design.

## Tech Stack

- **Frontend**: React with Material UI
- **Backend**: NestJS
- **Database**: PostgreSQL on Neon
- **Deployment**: Vercel

## Features

- 📊 Interactive dashboard with statistics and insights
- 👥 Customer management
- 📋 Order processing and tracking
- 🧺 Laundry services management
- 🔒 User authentication and authorization
- 💰 Payment tracking

## Getting Started

### Prerequisites

- Node.js (v14+ recommended)
- npm or yarn
- PostgreSQL database (local or Neon cloud)

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/laundries.git
cd laundries
```

2. Install dependencies

```bash
npm run install:all
```

3. Set up environment variables

   - Create `.env` files in both `backend` and root directories
   - Add the necessary environment variables (see `.env.example`)

4. Start development servers

```bash
npm run dev
```

### Database Setup

1. Create a new database in Neon or your PostgreSQL server
2. Update the `DATABASE_URL` in your `.env` file
3. The database tables will be automatically created when you start the application due to TypeORM's synchronize feature

## Project Structure
