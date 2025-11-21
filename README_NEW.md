# KTI Assets - Asset Management System (React + Node 24 + Azure Cosmos DB)

A modern, fully-featured Asset Management System built with React, Express.js, and Azure Cosmos DB. This is a complete migration from Next.js monolith to a scalable microservices architecture.

## 🚀 Quick Start

### Prerequisites
- Node.js 22+ (24 recommended for backend)
- npm or yarn
- Azure Cosmos DB account (MongoDB API)
- Azure Storage account (optional, for file uploads)

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your Azure Cosmos DB connection string
npm install
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## 📦 Project Structure

### Backend (Node.js + Express + TypeScript)

```
backend/
├── src/
│   ├── index.ts                 # Express app entry point
│   ├── lib/
│   │   ├── config.ts            # Configuration management
│   │   ├── database.ts          # MongoDB/Cosmos DB connection
│   │   ├── errors.ts            # Custom error classes
│   │   ├── logger.ts            # Logging utility
│   │   └── response.ts          # Response formatting helpers
│   ├── middleware/
│   │   ├── auth.ts              # JWT authentication & RBAC
│   │   └── error.ts             # Global error handler
│   ├── routes/
│   │   ├── auth.ts              # Authentication endpoints
│   │   ├── assets.ts            # Asset CRUD endpoints
│   │   └── uploads.ts           # File upload endpoints
│   ├── services/
│   │   ├── auth.service.ts      # Authentication logic
│   │   └── blob-storage.service.ts # Azure Blob Storage integration
│   └── types/
│       └── index.ts             # TypeScript type definitions
├── package.json
├── tsconfig.json
├── Dockerfile
└── .env.example
```

### Frontend (React + Vite + TypeScript)

```
frontend/
├── src/
│   ├── main.tsx                 # Vite entry point
│   ├── App.tsx                  # Root React component
│   ├── index.css                # Tailwind CSS styles
│   ├── components/              # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── ...
│   ├── pages/                   # Page components
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   └── ...
│   ├── context/                 # React context providers
│   │   └── AuthContext.tsx
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useToast.ts
│   ├── services/                # API client
│   │   └── api.ts
│   └── lib/                     # Utilities
│       └── utils.ts
├── public/                      # Static assets
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── Dockerfile
└── .env.example
```

## 🔧 Configuration

### Backend Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb+srv://username:password@account.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retryWrites=false&maxIdleTimeMS=120000
MONGODB_DATABASE=kti_assets

# JWT
JWT_SECRET_KEY=your-secret-key-min-32-chars-long!!
JWT_EXPIRY=24h

# Azure Storage (optional)
AZURE_STORAGE_ACCOUNT_NAME=
AZURE_STORAGE_ACCOUNT_KEY=
AZURE_STORAGE_CONTAINER_NAME=kti-assets
AZURE_STORAGE_CONNECTION_STRING=

# CORS
CORS_ORIGIN=http://localhost:5173

# Features
ENABLE_FILE_UPLOAD=true
ENABLE_NOTIFICATIONS=true
ENABLE_AUDIT_LOGGING=true
```

### Frontend Environment Variables

```env
VITE_API_URL=http://localhost:5000/api
```

## 🔐 Authentication

### Login Flow

1. User submits credentials to `/api/auth/login`
2. Backend validates and returns JWT token
3. Frontend stores token in `localStorage` with key `auth_token`
4. API client automatically includes token in `Authorization: Bearer <token>` header
5. Protected routes redirect to `/login` if token is invalid/missing

### Role-Based Access Control

Three roles with hierarchical permissions:
- **Admin**: Full system access
- **SPOC**: Department-level access, can approve requests
- **User**: Read-only department access

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get current user profile

### Assets
- `GET /api/assets` - List assets (paginated)
- `GET /api/assets/:id` - Get asset details
- `POST /api/assets` - Create asset (admin only)
- `PUT /api/assets/:id` - Update asset (admin only)
- `DELETE /api/assets/:id` - Delete asset (admin only)

### File Uploads
- `POST /api/uploads/file` - Upload file to Azure Blob Storage
- `DELETE /api/uploads/file/:fileName` - Delete file from storage

### Health
- `GET /health` - Server health check

## 🛠️ Development

### Building

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm preview
```

### Running with Docker Compose

```bash
docker-compose up --build
```

This will start:
- Backend on `http://localhost:5000`
- Frontend on `http://localhost:5173`
- MongoDB on `localhost:27017`

### Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 🚢 Deployment

### Azure App Service

1. **Backend**:
   ```bash
   az webapp up --name kti-assets-backend --resource-group myResourceGroup --runtime "node|22"
   ```

2. **Frontend**:
   Use Azure Static Web Apps for optimal frontend hosting

3. **Database**:
   Set `MONGODB_URI` environment variable to your Cosmos DB connection string

### Docker Hub

1. Build and push images:
   ```bash
   docker build -t your-registry/kti-assets-backend:latest backend/
   docker build -t your-registry/kti-assets-frontend:latest frontend/
   docker push your-registry/kti-assets-backend:latest
   docker push your-registry/kti-assets-frontend:latest
   ```

2. Update `docker-compose.yml` with your image URLs

## 🔄 Migration from Next.js

### What Changed

| Aspect | Before | After |
|--------|--------|-------|
| Framework | Next.js 13 | Express.js + React 18 |
| Database | MongoDB Atlas | Azure Cosmos DB |
| File Storage | Local/Custom | Azure Blob Storage |
| Deployment | Vercel/Self-hosted | Docker/Azure App Service |
| Build | Next.js Build | TypeScript + Vite |

### Code Migration

**API Routes**:
- `src/app/api/assets/route.ts` → `backend/src/routes/assets.ts`
- `src/app/api/auth/route.ts` → `backend/src/routes/auth.ts`

**Components**:
- Removed `'use client'` directives
- Converted Next.js components to React components
- Removed SSR-specific logic
- Updated imports to use relative paths

**Services**:
- Reused `auth-service.ts` with minimal modifications
- Adapted `rbac.ts` for Express middleware
- Created new API client for frontend

## 🎯 Features Implemented

✅ User authentication with JWT
✅ Role-based access control (Admin/SPOC/User)
✅ Asset CRUD operations
✅ Azure Cosmos DB integration
✅ Azure Blob Storage for file uploads
✅ Protected API routes
✅ React context for state management
✅ Responsive UI with Tailwind CSS
✅ Error handling and validation
✅ Docker containerization
✅ CORS enabled for cross-origin requests
✅ Graceful error handling

## 📋 Features Not Yet Implemented

- [ ] Asset transfers/movements
- [ ] Verification/audit workflows
- [ ] Asset reports generation
- [ ] Notification system
- [ ] Advanced search/filtering
- [ ] Bulk import/export
- [ ] Analytics dashboard
- [ ] Complete form validations
- [ ] API documentation (Swagger/OpenAPI)

## 🐛 Troubleshooting

### Backend Issues

**Port already in use**:
```bash
# Change PORT in .env or kill process using port 5000
lsof -i :5000
kill -9 <PID>
```

**MongoDB connection failed**:
- Verify `MONGODB_URI` is correct
- Check firewall rules in Cosmos DB
- Ensure `retryWrites=false` in connection string

**Azure Storage not working**:
- Verify `AZURE_STORAGE_CONNECTION_STRING` is set
- Check container name matches configuration
- Ensure storage account allows blob uploads

### Frontend Issues

**Can't connect to backend**:
- Verify backend is running on port 5000
- Check `VITE_API_URL` matches backend URL
- Check browser console for CORS errors

**Login not working**:
- Clear localStorage and try again
- Check backend logs for authentication errors
- Verify JWT_SECRET_KEY is set in backend

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Azure Cosmos DB Documentation](https://docs.microsoft.com/en-us/azure/cosmos-db/)
- [Azure Blob Storage Documentation](https://docs.microsoft.com/en-us/azure/storage/blobs/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## 📝 License

This project is proprietary software for KTI.

## 🤝 Contributing

For development guidelines and contribution instructions, see MIGRATION_GUIDE.md

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review existing GitHub issues
3. Contact the development team

---

**Last Updated**: November 21, 2025
**Version**: 1.0.0 (Migration Release)
