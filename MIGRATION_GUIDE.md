# KTI Assets - Complete Migration Guide

## Project Structure

```
studio/
├── backend/                 # Node.js + Express backend
│   ├── src/
│   │   ├── index.ts        # Main server entry point
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic services
│   │   ├── middleware/     # Express middleware
│   │   ├── lib/            # Utilities and helpers
│   │   └── types/          # TypeScript types
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                # React + Vite frontend
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── services/       # API client service
│   │   ├── context/        # React context (auth, etc.)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities
│   │   ├── index.css       # Tailwind styles
│   │   ├── App.tsx         # Root component
│   │   └── main.tsx        # Entry point
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
│
├── docker-compose.yml       # Docker composition for all services
├── .gitignore
└── README.md
```

## Technology Stack

### Backend
- **Runtime**: Node.js 24
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Azure Cosmos DB (MongoDB API compatible)
- **Authentication**: JWT with Jose
- **File Storage**: Azure Blob Storage
- **Validation**: Zod

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **Routing**: React Router v6
- **HTTP Client**: Axios

## Getting Started

### Prerequisites
- Node.js 22+ (or 24 for backend)
- npm or yarn
- Docker & Docker Compose (optional, for containerized deployment)

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Configure Azure Cosmos DB:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<account>.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retryWrites=false&maxIdleTimeMS=120000
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Build TypeScript:
   ```bash
   npm run build
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## Docker Deployment

Run the entire stack with Docker Compose:

```bash
docker-compose up --build
```

This will start:
- Backend on port 5000
- Frontend on port 5173
- MongoDB on port 27017 (local development)

## API Integration

### Authentication Flow

1. User logs in via `/api/auth/login` endpoint
2. Backend returns JWT token
3. Frontend stores token in `localStorage` with key `auth_token`
4. All subsequent requests include `Authorization: Bearer <token>` header
5. Token is automatically included by the API client interceptor

### API Client Usage

```typescript
import { apiClient } from '@services/api';

// Login
const response = await apiClient.login(email, password);
apiClient.setToken(response.data.token);

// Fetch assets
const assets = await apiClient.getAssets(page, pageSize);

// Create asset
const newAsset = await apiClient.createAsset(assetData);
```

## Migration Notes

### From Next.js to React + Express

1. **API Routes**: `src/app/api/*` → `backend/src/routes/*`
2. **Services**: Reused from original codebase with minimal changes
3. **Components**: Migrated from `src/components/` → `frontend/src/components/`
4. **Types**: Consolidated in backend and frontend type definitions
5. **Middleware**: Express middleware replaces Next.js middleware

### Database Migration

For migrating data from existing MongoDB to Azure Cosmos DB:

1. Export existing data:
   ```bash
   mongodump --uri "mongodb://..." --out ./dump
   ```

2. Import to Cosmos DB:
   ```bash
   mongorestore --uri "mongodb+srv://..." --dir ./dump
   ```

## Azure Resources Setup

### 1. Azure Cosmos DB
- Create a new Cosmos DB account (MongoDB API)
- Create database: `kti_assets`
- Update `MONGODB_URI` with connection string

### 2. Azure Blob Storage
- Create storage account
- Create container: `kti-assets`
- Update configuration with:
  - `AZURE_STORAGE_ACCOUNT_NAME`
  - `AZURE_STORAGE_ACCOUNT_KEY`
  - `AZURE_STORAGE_CONNECTION_STRING`

### 3. Azure App Service (Optional)
- Deploy backend to App Service
- Deploy frontend to Static Web Apps
- Configure environment variables

## Features Implemented

✅ Authentication (JWT-based)
✅ Asset CRUD operations
✅ Role-based access control (RBAC)
✅ Database abstraction for Cosmos DB
✅ Error handling and validation
✅ API response formatting
✅ React Context for state management
✅ Protected routes
✅ Responsive UI with Tailwind CSS

## Next Steps

1. **Migrate remaining API routes** from Next.js to Express
2. **Implement file upload** to Azure Blob Storage
3. **Build additional pages** (Assets list, Reports, etc.)
4. **Add more components** (Forms, Dialogs, Tables, etc.)
5. **Implement all workflows** (transfers, approvals, etc.)
6. **Set up CI/CD** pipeline for automated deployment
7. **Add unit and integration tests**
8. **Configure Azure resources** for production

## Troubleshooting

### Backend won't start
- Check `MONGODB_URI` is correct
- Verify Node.js 22+ is installed
- Check port 5000 is not in use

### Frontend can't connect to backend
- Ensure backend is running on port 5000
- Check `VITE_API_URL` environment variable
- Verify CORS is configured correctly

### Cosmos DB connection fails
- Verify connection string format
- Check firewall/network rules
- Ensure `retryWrites=false` is in connection string

## Support

For issues or questions, check the existing Next.js codebase for reference implementation details.
