   # Key Vault 🔐

A modern, secure secret management application built with React, TypeScript, Node.js, and PostgreSQL.

## 🚀 Features

- **Secure Authentication**: Email/password and Google OAuth integration
- **Organization Management**: Create and manage organizations with team members
- **Project Organization**: Organize secrets by projects within organizations
- **Environment Support**: Manage secrets across development, staging, and production environments
- **Modern UI**: Clean, responsive interface with dark theme
- **Real-time Updates**: Live updates for secret changes
- **Audit Logging**: Track who accessed or modified secrets
- **API Access**: Programmatic access via API keys

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Hook Form** with Zod validation
- **Zustand** for state management
- **React Router** for navigation

### Backend
- **Node.js** with TypeScript
- **Express.js** framework
- **Prisma** ORM with PostgreSQL
- **JWT** authentication
- **Passport.js** for OAuth strategies
- **bcrypt** for password hashing

### Database
- **PostgreSQL** for data storage
- **Prisma Migrations** for database schema management

### Infrastructure
- **Docker** containerization
- **Docker Compose** for local development

## 📁 Project Structure

```
key-vault/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── stores/          # Zustand state stores
│   │   ├── services/        # API service layer
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── package.json
│   └── vite.config.ts
├── Backend/                 # Node.js backend application
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   ├── lib/             # Utility libraries
│   │   └── config/          # Configuration files
│   ├── prisma/              # Database schema and migrations
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml       # Docker development setup
├── .github-best-practices.md # GitHub workflow guidelines
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v13 or higher)
- **Docker** (optional, for containerized setup)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/amaykorade/key-vault-new.git
   cd key-vault-new
   ```

2. **Backend Setup**
   ```bash
   cd Backend
   npm install
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Database Setup**
   ```bash
   cd ../Backend
   npx prisma migrate dev
   npx prisma generate
   ```

### Environment Variables

#### Backend (.env)
```env
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/keyvault

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

# Encryption
ENCRYPTION_KEY=your-32-byte-encryption-key

# CORS
CORS_ORIGIN=http://localhost:5173

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:4000/api
```

### Running the Application

#### Development Mode

1. **Start the backend**
   ```bash
   cd Backend
   npm run dev
   ```

2. **Start the frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000/api

#### Docker Development

```bash
docker-compose up -d
```

## 📖 API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Organization Endpoints

- `GET /api/organizations` - Get user organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/:id` - Get organization details
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization

### Project Endpoints

- `GET /api/projects` - Get user projects
- `POST /api/projects/organizations/:orgId/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Secret Endpoints

- `GET /api/secrets/projects/:projectId/secrets` - Get project secrets
- `POST /api/secrets/projects/:projectId/secrets` - Create secret
- `GET /api/secrets/:id` - Get secret details
- `PUT /api/secrets/:id` - Update secret
- `DELETE /api/secrets/:id` - Delete secret

## 🧪 Testing

```bash
# Backend tests
cd Backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd ../Backend
npm run build
```

### Environment Variables for Production

Ensure all environment variables are properly set for production, including:
- Strong JWT secrets
- Production database URL
- Proper CORS origins
- Google OAuth credentials

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read our [GitHub Best Practices Guide](.github-best-practices.md) for detailed contribution guidelines.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Security

- All passwords are hashed using bcrypt
- Secrets are encrypted at rest using AES-256
- JWT tokens for secure API access
- CORS protection configured
- Input validation and sanitization
- Rate limiting on authentication endpoints

## 📞 Support

If you have any questions or need help, please:
1. Check the [Issues](https://github.com/amaykorade/key-vault-new/issues) page
2. Create a new issue if your question isn't answered
3. Contact the maintainers

## 🗺 Roadmap

- [ ] API key management
- [ ] Secret versioning and rollback
- [ ] Advanced audit logging
- [ ] Secret sharing with expiration
- [ ] Integration with CI/CD tools
- [ ] Mobile application
- [ ] Advanced search and filtering
- [ ] Secret templates and presets

---

Built with ❤️ by [Amay Korade](https://github.com/amaykorade)