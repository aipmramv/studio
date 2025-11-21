# Error Handling & Stability Guide

## Overview

This guide documents the comprehensive error handling, validation, and recovery systems implemented to improve application stability.

## Backend Error Handling

### 1. Error Recovery Utilities

Located in `src/lib/error-recovery.ts`, provides:

- **ErrorRecovery.retryWithBackoff()**: Retry operations with exponential backoff
  ```typescript
  const result = await ErrorRecovery.retryWithBackoff(
    () => fetchData(),
    3,      // maxRetries
    1000    // baseDelay
  );
  ```

- **ErrorRecovery.safeExecute()**: Execute with fallback value
  ```typescript
  const data = await ErrorRecovery.safeExecute(
    () => apiCall(),
    defaultValue,
    'operation name'
  );
  ```

- **ErrorRecovery.validateEnvVars()**: Validate required environment variables
  ```typescript
  ErrorRecovery.validateEnvVars(['DATABASE_URL', 'JWT_SECRET']);
  ```

- **CircuitBreaker**: Prevents cascading failures
  ```typescript
  const breaker = new CircuitBreaker(5, 2);
  await breaker.execute(() => operation());
  ```

### 2. Request Validation

Middleware in `src/middleware/validation.ts`:

```typescript
import { validateBody, validateQuery } from './middleware/validation';
import { LoginSchema } from './lib/validators';

// In routes
router.post('/login', validateBody(LoginSchema), handler);
router.get('/assets', validateQuery(PaginationSchema), handler);
```

Validation schemas defined in `src/lib/validators.ts`:
- `LoginSchema`
- `RegisterSchema`
- `AssetSchema`
- `PaginationSchema`
- `FileUploadSchema`

### 3. Error Handling Middleware

Located in `src/middleware/error-handler.ts`:

- **errorHandler()**: Global error handling with proper status codes
- **asyncHandler()**: Wraps async route handlers to catch errors
- **validationErrorHandler()**: Handles Zod validation errors
- **notFoundHandler()**: Handles undefined routes

Usage:
```typescript
import { asyncHandler } from './middleware/error-handler';

router.get('/:id', asyncHandler(async (req, res) => {
  // Errors automatically caught and passed to errorHandler
}));
```

### 4. Logging

Enhanced logger in `src/lib/logger.ts`:

```typescript
logger.info('User logged in', { userId: user.id });
logger.warn('Slow query detected', { duration: 5000 });
logger.error('Database connection failed', error);
```

### 5. Repository Pattern

Data access layer in `src/lib/repository.ts`:

```typescript
class AssetRepository extends BaseRepository<Asset> {
  async findByDepartment(dept: string) { ... }
  async searchAssets(query: string) { ... }
}

const assetRepo = new AssetRepository();
const asset = await assetRepo.findById(id);
```

## Frontend Error Handling

### 1. Error Handler Utility

Located in `src/lib/error-handler.ts`:

```typescript
import { errorHandler, getErrorMessage, isNetworkError, isAuthError } from './lib/error-handler';

// Handle errors
const error = errorHandler.handle(err, 'error');

// Check error types
if (isNetworkError(err)) { /* retry logic */ }
if (isAuthError(err)) { /* redirect to login */ }

// Get user-friendly messages
const msg = getErrorMessage(err);

// View error history
const errors = errorHandler.getErrors();
errorHandler.clearErrors();
```

### 2. API Client with Retry Logic

Located in `src/services/api-client.ts`:

```typescript
import { apiClient } from './services/api-client';

// Automatic retry on network/5xx errors
const assets = await apiClient.getAssets(1, 10);

// File upload with automatic retry
const result = await apiClient.uploadFile('/upload', file);

// Custom retry options
await apiClient.get('/data', { retries: 5 });
```

### 3. Enhanced Auth Context

Located in `src/context/AuthContext.tsx`:

```typescript
import { useAuth } from './context/AuthContext';

const { user, isLoading, error, login, logout } = useAuth();

if (error) {
  // Display error message
}

try {
  await login(email, password);
} catch (err) {
  // Error is also in context.error
}
```

### 4. Toast Notifications

Two implementations:

**Option 1: Hook-based**
```typescript
import { useToast } from './hooks/useToast';

const { toasts, success, error, warning } = useToast();
success('Action completed!');
error('Something went wrong');
```

**Option 2: Context-based**
```typescript
import { useToastContext } from './context/ToastContext';

const { addToast } = useToastContext();
addToast('Message', 'success', 3000);
```

### 5. Frontend Logger

Located in `src/lib/logger.ts`:

```typescript
import { logger } from './lib/logger';

logger.debug('Debug info', { data: ... });
logger.info('User action', { action: 'login' });
logger.warn('Rate limit approaching');
logger.error('API call failed', error);

// Retrieve logs
const logs = logger.getLogs();
logger.exportLogs(); // JSON string
```

## Type Safety

All types defined in `src/types/index.ts`:

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'spoc' | 'user';
}

interface Asset {
  id?: string;
  assetNumber: string;
  assetDescription: string;
  department: string;
  // ... more fields
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}
```

## Best Practices

### 1. Always Validate Input
```typescript
// Use middleware for automatic validation
router.post('/assets', validateBody(AssetSchema), handler);

// Or manually validate
try {
  const data = AssetSchema.parse(req.body);
} catch (err) {
  // Handle validation error
}
```

### 2. Handle Async Operations with Retry
```typescript
const data = await ErrorRecovery.retryWithBackoff(
  () => fetchFromExternalAPI(),
  3,
  1000
);
```

### 3. Catch Async Route Errors
```typescript
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.getUser(req.params.id);
  res.json(user);
}));
```

### 4. Use Circuit Breaker for External Services
```typescript
const breaker = new CircuitBreaker();
try {
  const data = await breaker.execute(() => externalAPI.call());
} catch (err) {
  // Circuit is open, fallback logic
}
```

### 5. Log All Errors with Context
```typescript
try {
  // operation
} catch (err) {
  logger.error('Operation failed', err, 'asset-creation');
}
```

### 6. Check Error Types Before Handling
```typescript
try {
  // operation
} catch (err) {
  if (isNetworkError(err)) {
    // Retry or offline mode
  } else if (isAuthError(err)) {
    // Redirect to login
  } else if (isValidationError(err)) {
    // Show validation errors to user
  }
}
```

## Environment Configuration

Required environment variables (.env):

**Backend**
```
NODE_ENV=production
PORT=5000
DATABASE_URL=mongodb://...
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
AZURE_STORAGE_CONNECTION_STRING=...
```

**Frontend**
```
VITE_API_URL=http://localhost:5000/api
```

## Testing Error Scenarios

```typescript
// Simulate network error
await ErrorRecovery.retryWithBackoff(
  async () => { throw new Error('Network error'); },
  3,
  100
);

// Circuit breaker opens after failures
const breaker = new CircuitBreaker(2, 1);
try {
  for (let i = 0; i < 3; i++) {
    await breaker.execute(() => Promise.reject('error'));
  }
} catch (err) {
  // Circuit is now OPEN
}
```

## Monitoring & Debugging

### View Logs
```typescript
// Browser console (frontend)
logger.getLogs()
logger.exportLogs()

// Server logs (backend)
// Check logs/ directory or console output
```

### Check Circuit Breaker Status
```typescript
console.log(breaker.getState()); // 'OPEN', 'CLOSED', 'HALF_OPEN'
```

### Export User Session
```typescript
const errors = errorHandler.getErrors();
console.log(JSON.stringify(errors)); // Share for debugging
```

## Troubleshooting

### Issue: "Circuit breaker is OPEN"
**Cause**: Too many consecutive failures in external service
**Solution**: Check external service health, increase failureThreshold

### Issue: "Validation failed"
**Cause**: Request data doesn't match schema
**Solution**: Check API request format, refer to schema definitions

### Issue: "401 Unauthorized"
**Cause**: Token expired or invalid
**Solution**: Logout and login again, or implement token refresh

### Issue: "Request timeout"
**Cause**: Server or network too slow
**Solution**: Increase timeout option, check network connectivity

## Future Enhancements

- [ ] Implement request deduplication
- [ ] Add metrics collection (Prometheus)
- [ ] Implement request caching
- [ ] Add automatic error reporting (Sentry)
- [ ] Implement request rate limiting
- [ ] Add health check dashboard
- [ ] Implement graceful degradation
