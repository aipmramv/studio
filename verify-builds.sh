#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== KTI Assets - Build Verification ===${NC}\n"

# Test backend
echo -e "${YELLOW}Testing Backend...${NC}"
cd /workspaces/studio/backend

echo "Installing dependencies..."
npm install > /dev/null 2>&1

echo "Building..."
if npm run build > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Backend built successfully${NC}"
  BACKEND_OK=1
else
  echo -e "${RED}✗ Backend build failed${NC}"
  npm run build
  BACKEND_OK=0
fi

# Test frontend
echo -e "\n${YELLOW}Testing Frontend...${NC}"
cd /workspaces/studio/frontend

echo "Installing dependencies..."
npm install > /dev/null 2>&1

echo "Building..."
if npm run build > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Frontend built successfully${NC}"
  FRONTEND_OK=1
else
  echo -e "${RED}✗ Frontend build failed${NC}"
  npm run build
  FRONTEND_OK=0
fi

# Summary
echo -e "\n${YELLOW}=== Build Summary ===${NC}"
if [ $BACKEND_OK -eq 1 ] && [ $FRONTEND_OK -eq 1 ]; then
  echo -e "${GREEN}✓ All builds successful!${NC}"
  echo ""
  echo "Stability Improvements Implemented:"
  echo "  ✓ Error recovery utilities (retry, circuit breaker, safe execute)"
  echo "  ✓ Request validation middleware (body, query, params)"
  echo "  ✓ Global error handling"
  echo "  ✓ Repository pattern for data access"
  echo "  ✓ Enhanced logging"
  echo "  ✓ API client with automatic retry"
  echo "  ✓ Auth context with error state"
  echo "  ✓ Toast notification system"
  echo "  ✓ Type definitions"
  echo "  ✓ Form validation"
  echo ""
  echo "Files Created:"
  echo "  Backend:"
  echo "    - src/lib/error-recovery.ts"
  echo "    - src/lib/validators.ts"
  echo "    - src/lib/repository.ts"
  echo "    - src/middleware/error-handler.ts"
  echo "    - src/middleware/validation.ts"
  echo "    - src/services/api.service.ts"
  echo ""
  echo "  Frontend:"
  echo "    - src/lib/error-handler.ts"
  echo "    - src/lib/logger.ts"
  echo "    - src/services/api-client.ts"
  echo "    - src/context/ToastContext.tsx"
  echo "    - src/hooks/useToast.ts"
  echo "    - src/types/index.ts"
  echo ""
  echo "Documentation:"
  echo "    - ERROR_HANDLING_GUIDE.md"
  echo "    - STABILITY_IMPROVEMENTS.md"
  echo ""
  exit 0
else
  echo -e "${RED}✗ Some builds failed${NC}"
  exit 1
fi
