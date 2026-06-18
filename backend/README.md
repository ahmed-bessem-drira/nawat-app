# NAWAT FOCUS Backend

NestJS backend API for NAWAT FOCUS - ADHD Support Platform

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- Redis (for BullMQ)
- Ollama (for AI recommendations)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npx prisma migrate dev
npx prisma generate

# Start development server
npm run start:dev
```

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/nawat_focus?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRATION="7d"
PORT=3001
NODE_ENV="development"
REDIS_HOST="localhost"
REDIS_PORT=6379
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="qwen2.5:1.5b"
```

## 📚 API Documentation

Swagger documentation available at: `http://localhost:3001/api/docs`

## 🏗️ Project Structure

```
src/
├── auth/              # Authentication module
├── children/          # Child management
├── sessions/          # Game sessions
├── recommendations/    # AI recommendations
├── ai/               # Ollama integration
├── sync/             # Data synchronization
└── common/           # Shared utilities
    ├── guards/       # Auth guards
    ├── decorators/   # Custom decorators
    ├── filters/      # Exception filters
    ├── interceptors/ # Request interceptors
    └── pipes/        # Validation pipes
```

## 🔐 Authentication

JWT-based authentication. Login endpoint:
```
POST /auth/login
{
  "email": "teacher@nawat.com",
  "password": "password123"
}
```

Returns access token for protected endpoints.

## 🤖 AI Integration

Uses Ollama to run Qwen2.5:1.5B locally for generating recommendations.

### Setup Ollama

```bash
# Install Ollama
# https://ollama.ai/download

# Pull the model
ollama pull qwen2.5:1.5b

# Start Ollama service
ollama serve
```

## 📊 Database Schema

See `prisma/schema.prisma` for complete schema.

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 📦 Build

```bash
npm run build
npm run start:prod
```
