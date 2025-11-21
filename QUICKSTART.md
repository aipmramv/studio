# Quick Setup Guide - KTI Assets (React + Node 24 + Azure)

## 📋 Prerequisites

- Node.js 22+ installed ([download](https://nodejs.org/))
- npm 9+ (comes with Node.js)
- Git installed
- Azure account (free tier available)
- Code editor (VS Code recommended)

## 🚀 5-Minute Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd /workspaces/studio/backend

# Create environment file
cp .env.example .env

# Edit .env with your settings (use defaults for local development)
# nano .env

# Install dependencies
npm install

# Start backend
npm run dev
```

✅ Backend running at `http://localhost:5000`

### 2. Frontend Setup (New Terminal)

```bash
# Navigate to frontend directory
cd /workspaces/studio/frontend

# Create environment file
cp .env.example .env

# Install dependencies
npm install

# Start frontend
npm run dev
```

✅ Frontend running at `http://localhost:5173`

### 3. Access Application

Open browser: `http://localhost:5173`

**Test Login Credentials** (when database is initialized):
- Email: `admin@example.com`
- Password: `admin123`

## 🐳 Docker Quick Start (Alternative)

```bash
# Navigate to project root
cd /workspaces/studio

# Start all services
docker-compose up --build

# Verify services
# Backend: http://localhost:5000/health
# Frontend: http://localhost:5173
# MongoDB: localhost:27017
```

## ⚙️ Configuration

### Azure Cosmos DB

1. Create account on [portal.azure.com](https://portal.azure.com)
2. Get connection string from "Connection String" tab
3. Update `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@account.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retryWrites=false&maxIdleTimeMS=120000
   ```

### Azure Blob Storage (Optional)

1. Create storage account on Azure Portal
2. Get connection string from "Access keys"
3. Update `backend/.env`:
   ```env
   AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
   AZURE_STORAGE_ACCOUNT_NAME=yourstorageaccount
   AZURE_STORAGE_CONTAINER_NAME=kti-assets
   ```

## 📁 Project Structure

```
backend/
  src/
    index.ts           → Main Express app
    routes/            → API endpoints
    services/          → Business logic
    middleware/        → Express middleware
    lib/              → Utilities

frontend/
  src/
    App.tsx           → Root component
    pages/            → Page components
    components/       → UI components
    services/api.ts   → API client
    context/          → Auth context
```

## 🔌 API Quick Reference

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/login` | No | Login user |
| POST | `/api/auth/logout` | Yes | Logout user |
| GET | `/api/auth/profile` | Yes | Get user profile |
| GET | `/api/assets` | Yes | List assets |
| POST | `/api/assets` | Admin | Create asset |
| GET | `/api/assets/:id` | Yes | Get asset |
| PUT | `/api/assets/:id` | Admin | Update asset |
| DELETE | `/api/assets/:id` | Admin | Delete asset |
| POST | `/api/uploads/file` | Yes | Upload file |

## 🧪 Testing the API

### Using cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Response will contain token
# Use token for authenticated requests:

curl -X GET http://localhost:5000/api/assets \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman

1. Import API collection
2. Set `{{baseUrl}}` to `http://localhost:5000`
3. Set `{{token}}` from login response
4. Test endpoints

## 🛠️ Development Commands

### Backend

```bash
cd backend

npm run dev      # Start with auto-reload
npm run build    # Build TypeScript
npm start        # Run production build
npm test         # Run tests
npm run lint     # Check code quality
```

### Frontend

```bash
cd frontend

npm run dev      # Start with hot reload
npm run build    # Build for production
npm run preview  # Preview production build
npm test         # Run tests
npm run lint     # Check code quality
```

## 🐛 Common Issues & Solutions

### "Port already in use"

```bash
# Kill process using port 5000
lsof -i :5000
kill -9 <PID>

# Or change PORT in .env
```

### "Cannot find module 'express'"

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### "Connection refused to MongoDB"

- Check `MONGODB_URI` is correct
- Verify Cosmos DB firewall allows your IP
- Ensure `retryWrites=false` in connection string

### "Frontend can't connect to backend"

- Verify backend is running: `curl http://localhost:5000/health`
- Check `VITE_API_URL` in `frontend/.env`
- Check browser console for CORS errors

### "CORS errors"

- Backend must have `CORS_ORIGIN=http://localhost:5173`
- Check `backend/.env` CORS_ORIGIN setting
- Restart backend if just changed

## 📊 Database Initialization

To set up database with initial data:

```bash
# Backend will auto-create collections on first connection
# To add test data, use API endpoints or MongoDB client

# Using MongoDB shell
mongosh "mongodb+srv://..."

# Use database
use kti_assets

# Check collections
show collections
```

## 📱 Frontend Features

| Feature | Status | Notes |
|---------|--------|-------|
| Login | ✅ | JWT-based auth |
| Dashboard | ✅ | Welcome screen |
| Asset List | 🔄 | Ready for implementation |
| Asset Create/Edit | 🔄 | Ready for implementation |
| Reports | 🔄 | Ready for implementation |
| File Upload | ✅ | Azure Blob Storage ready |

## 🚀 Deployment Checklist

### Before Deploying

- [ ] Set strong `JWT_SECRET_KEY`
- [ ] Configure all Azure resources
- [ ] Set `NODE_ENV=production`
- [ ] Update all URLs (.env files)
- [ ] Run security checks
- [ ] Test authentication flow
- [ ] Verify file upload works
- [ ] Test database connectivity

### Deployment Options

**Option 1: Azure App Service**
```bash
az webapp up --name kti-assets-backend
```

**Option 2: Docker Container**
```bash
docker build -t kti-assets-backend:latest backend/
docker run -p 5000:5000 -e MONGODB_URI=... kti-assets-backend:latest
```

**Option 3: Kubernetes**
```bash
# Create namespace
kubectl create namespace kti-assets

# Apply deployments
kubectl apply -f k8s-backend.yaml -n kti-assets
kubectl apply -f k8s-frontend.yaml -n kti-assets
```

## 📚 Learning Resources

- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Azure Cosmos DB](https://learn.microsoft.com/en-us/azure/cosmos-db/)
- [Azure Blob Storage](https://learn.microsoft.com/en-us/azure/storage/blobs/)

## 📞 Support & Help

1. Check `MIGRATION_GUIDE.md` for detailed info
2. Check `IMPLEMENTATION_SUMMARY.md` for architecture details
3. Review error logs in console
4. Check database connectivity
5. Verify environment variables

## 🎯 Next Development Steps

After getting the app running:

1. **Add more routes** - Study existing routes, add new ones
2. **Create pages** - Look at LoginPage.tsx as template
3. **Build components** - Extend components/ directory
4. **Connect API** - Use apiClient from services/api.ts
5. **Style UI** - Use Tailwind CSS classes
6. **Add features** - Implement workflows, reports, etc.

## ✅ Verification Checklist

After setup, verify:

- [ ] Backend starts without errors: `npm run dev`
- [ ] Frontend starts without errors: `npm run dev`
- [ ] Can access login page: `http://localhost:5173`
- [ ] Backend health check works: `http://localhost:5000/health`
- [ ] Can view browser console without errors
- [ ] API responses are formatted correctly

## 🎉 You're Ready!

Your KTI Assets application is now set up and ready for development. Start by exploring the existing code and then begin implementing the remaining features.

For questions, refer to the comprehensive documentation files or check the codebase comments.

---

**Happy Coding! 🚀**

*Last Updated: November 21, 2025*
