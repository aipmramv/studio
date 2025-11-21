# Quick Reference: Error Handling & Stability

## Backend Quick Start

### Error Recovery
```typescript
import { ErrorRecovery, CircuitBreaker } from './lib/error-recovery';

// Retry with backoff
const result = await ErrorRecovery.retryWithBackoff(() => operation(), 3, 1000);

// Safe execute with fallback
const value = await ErrorRecovery.safeExecute(() => risky(), defaultVal, 'op-name');

// Circuit breaker for external APIs
const breaker = new CircuitBreaker(5, 2);
await breaker.execute(() => externalAPI());
```

### Request Validation
```typescript
import { validateBody, validateQuery } from './middleware/validation';
import { LoginSchema, AssetSchema } from './lib/validators';

router.post('/login', validateBody(LoginSchema), handler);
router.get('/assets', validateQuery(PaginationSchema), handler);
```

### Error Handling
```typescript
import { asyncHandler, errorHandler } from './middleware/error-handler';

router.get('/:id', asyncHandler(async (req, res) => {
  // Errors automatically caught
}));

app.use(errorHandler);
```

### Data Access
```typescript
import { AssetRepository } from './lib/repository';

const repo = new AssetRepository();
const asset = await repo.findById(id);
const assets = await repo.findByDepartment('IT', 0, 10);
const results = await repo.searchAssets('query', 0, 10);
```

### Logging
```typescript
import { logger } from './lib/logger';

logger.info('User created', { userId: user.id });
logger.warn('Slow query', { duration: 5000 });
logger.error('Failed', error);
```

---

## Frontend Quick Start

### Error Handling
```typescript
import { errorHandler, getErrorMessage, isNetworkError, isAuthError } from './lib/error-handler';

const error = errorHandler.handle(err, 'error');
const msg = getErrorMessage(err);

if (isNetworkError(err)) { /* retry */ }
if (isAuthError(err)) { /* redirect */ }
```

### API Client
```typescript
import { apiClient } from './services/api-client';

const assets = await apiClient.getAssets(1, 10);
const user = await apiClient.login(email, password);
const result = await apiClient.uploadFile('/upload', file);
```

### Auth
```typescript
import { useAuth } from './context/AuthContext';

const { user, isLoading, error, login, logout } = useAuth();

if (error) showError(error);
await login(email, password);
```

### Notifications
```typescript
import { useToast } from './hooks/useToast';

const { success, error, warning } = useToast();
success('Done!');
error('Failed');
warning('Be careful');
```

### Logging
```typescript
import { logger } from './lib/logger';

logger.info('User action', { action: 'login' });
logger.error('API error', error);
const logs = logger.exportLogs();
```

---

## Common Patterns

### Safe API Call with Retry
```typescript
// Backend
const data = await ErrorRecovery.retryWithBackoff(
  () => externalAPI.fetch(),
  3,
  1000
);

// Frontend
try {
  const assets = await apiClient.getAssets();
} catch (err) {
  if (isNetworkError(err)) {
    // Already retried by apiClient
    toast.error('Network error, try again');
  }
}
```

### Validate and Process
```typescript
router.post('/assets', 
  validateBody(AssetSchema), 
  asyncHandler(async (req, res) => {
    // req.body is validated
    const asset = await assetRepo.create(req.body);
    res.json(asset);
  })
);
```

### User Feedback
```typescript
try {
  await apiClient.createAsset(data);
  toast.success('Asset created!');
} catch (err) {
  toast.error(getErrorMessage(err));
  logger.error('Creation failed', err, 'assets');
}
```

---

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DATABASE_URL=mongodb://...
JWT_SECRET=your-secret
CORS_ORIGIN=http://localhost:5173
AZURE_STORAGE_CONNECTION_STRING=...
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

---

## Build & Test

```bash
# Build backend
cd backend && npm run build

# Build frontend
cd frontend && npm run build

# Verify all
./verify-builds.sh
```

---

## File Organization

```
src/
├── Backend
│   ├── lib/
│   │   ├── error-recovery.ts (retry, circuit breaker)
│   │   ├── validators.ts (Zod schemas)
│   │   ├── repository.ts (data access)
│   │   └── logger.ts (logging)
│   └── middleware/
│       ├── error-handler.ts (global error handling)
│       └── validation.ts (request validation)
│
└── Frontend
    ├── lib/
    │   ├── error-handler.ts (error management)
    │   └── logger.ts (client logging)
    ├── services/
    │   └── api-client.ts (API with retry)
    ├── context/
    │   ├── AuthContext.tsx (auth state)
    │   └── ToastContext.tsx (notifications)
    ├── hooks/
    │   └── useToast.ts (notification hook)
    └── types/
        └── index.ts (type definitions)
```

---

## Error Codes

### HTTP Status Codes
- 400: Validation error
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 500: Server error

### Custom Error Codes
- `VALIDATION_ERROR`: Request validation failed
- `UNAUTHORIZED`: Missing/invalid token
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `DATABASE_ERROR`: Database operation failed
- `INTERNAL_SERVER_ERROR`: Unexpected error

---

## Tips & Best Practices

✅ **DO:**
- Always use `asyncHandler` for route handlers
- Validate all user input with schemas
- Log errors with context
- Retry network operations
- Check error types before handling
- Use proper TypeScript types

❌ **DON'T:**
- Throw errors without catching in async handlers
- Skip validation for "trusted" input
- Log sensitive data (passwords, tokens)
- Ignore network errors
- Use generic `any` types
- Forget to handle auth failures

---

## Resources

- [ERROR_HANDLING_GUIDE.md](./ERROR_HANDLING_GUIDE.md) - Comprehensive guide
- [STABILITY_IMPROVEMENTS.md](./STABILITY_IMPROVEMENTS.md) - All improvements
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)

---

Last Updated: 2024-12-19
All builds passing ✓
