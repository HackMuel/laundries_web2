# Langkah-langkah Setup Laundries App

## 1. Clone Repository dan Install Dependensi

# Masuk ke direktori project

cd c:\Laundries

# Install dependensi untuk root project

npm install

# Install dependensi untuk frontend

cd frontend
npm install

# Install dependensi untuk backend

cd ../backend
npm install

## 2. Setup Database (Neon PostgreSQL)

1. Buat akun di Neon.tech (https://neon.tech)
2. Buat project dan database baru
3. Salin connection string yang diberikan
4. Update file .env di backend dengan connection string tersebut

## 3. Setup Environment Variables

# Backend (.env)

DATABASE_URL=postgres://user:password@db.neon.tech/laundries
JWT_SECRET=laundries_testing
JWT_EXPIRATION=8h
PORT=3001
NODE_ENV=development

# Root (.env) - Opsional

FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
