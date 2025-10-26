# Asset Management APIs Documentation

## Overview
The Asset Management API provides comprehensive endpoints for managing assets, transfers, and verifications in the KTI Assets Management System.

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Role-Based Access Control
- **Admin**: Full access to all assets and operations
- **SPOC**: Access to assets in their department, can create/update assets
- **User**: Read-only access to assets in their department

## Core Asset APIs

### 1. Asset CRUD Operations

#### GET /api/assets
Get assets with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `department` (string): Filter by department (admin only)
- `location` (string): Filter by location
- `status` (string): Filter by status
- `classification` (string): Filter by classification
- `search` (string): Search term for asset number/description

**Response:**
```json
{
  "success": true,
  "data": {
    "assets": [...],
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "userPermissions": {
      "canCreate": true,
      "canEdit": true,
      "canDelete": false,
      "departmentFilter": "IT"
    }
  }
}
```

#### POST /api/assets
Create a new asset (Admin/SPOC only).

**Request Body:**
```json
{
  "assetDescription": "Dell Laptop",
  "department": "IT",
  "location": "Office A",
  "ledgerQty": 1,
  "assetClassification": "Hardware",
  "purchaseValue": 50000,
  "brandName": "Dell",
  "modelNo": "Inspiron 15"
}
```

#### GET /api/assets/[id]
Get asset by ID.

#### PUT /api/assets/[id]
Update asset (Admin only).

#### DELETE /api/assets/[id]
Delete asset (Admin only).

### 2. Asset Search APIs

#### POST /api/assets/search
Advanced asset search with complex filtering.

**Request Body:**
```json
{
  "searchTerm": "laptop",
  "department": "IT",
  "location": "Office A",
  "status": "Active",
  "classification": "Hardware",
  "purchaseValueRange": {
    "min": 10000,
    "max": 100000
  },
  "capitalizationDateRange": {
    "start": "2023-01-01",
    "end": "2023-12-31"
  },
  "sortBy": "assetNumber",
  "sortOrder": "asc"
}
```

#### GET /api/assets/filters
Get available filter options for asset search.

**Response:**
```json
{
  "success": true,
  "data": {
    "departments": ["IT", "Finance", "HR"],
    "locations": ["Office A", "Office B", "Warehouse"],
    "statuses": ["Active", "Inactive", "Under Maintenance"],
    "classifications": ["Hardware", "Software", "Furniture"],
    "ranges": {
      "minPurchaseValue": 1000,
      "maxPurchaseValue": 500000,
      "avgPurchaseValue": 25000
    }
  }
}
```

### 3. Bulk Operations

#### POST /api/assets/bulk
Bulk create assets (Admin only).

**Request Body:**
```json
{
  "assets": [
    {
      "assetDescription": "Asset 1",
      "department": "IT",
      "location": "Office A",
      "ledgerQty": 1
    },
    // ... more assets
  ]
}
```

#### PUT /api/assets/bulk
Bulk update assets (Admin only).

#### DELETE /api/assets/bulk
Bulk delete assets (Admin only).

### 4. Asset Export

#### POST /api/assets/export
Export assets to CSV/Excel format.

**Request Body:**
```json
{
  "format": "csv",
  "filters": {
    "department": "IT",
    "status": "Active"
  },
  "fields": [
    "assetNumber",
    "assetDescription",
    "department",
    "location",
    "purchaseValue"
  ]
}
```

## Asset Transfer APIs

### 1. Transfer Operations

#### POST /api/assets/[id]/transfer
Transfer asset to new location.

**Request Body:**
```json
{
  "toLocation": "Office B",
  "dcNumber": "DC-2024-001",
  "reason": "Department relocation",
  "transferDate": "2024-01-15",
  "isTemporary": false,
  "notes": "Handle with care"
}
```

#### GET /api/assets/transfers
Get asset transfers with filtering.

#### POST /api/assets/transfers
Create bulk transfer.

#### GET /api/assets/transfers/[id]
Get transfer details.

#### PUT /api/assets/transfers/[id]
Update transfer status.

#### DELETE /api/assets/transfers/[id]
Cancel transfer.

## Asset Verification APIs

### 1. Verification Operations

#### POST /api/assets/[id]/verify
Verify asset condition.

**Request Body:**
```json
{
  "verificationStatus": "Verified",
  "usableCondition": "Good",
  "workingConditionStatus": "Working",
  "comments": "Asset in good condition",
  "photoUrl": "https://example.com/photo.jpg",
  "discrepancies": [],
  "recommendedActions": ["Clean keyboard"]
}
```

#### GET /api/assets/verifications
Get verification history.

#### POST /api/assets/verifications
Bulk verify assets.

#### GET /api/assets/verifications/pending
Get assets pending verification.

**Response:**
```json
{
  "success": true,
  "data": {
    "assets": [...],
    "statistics": {
      "totalAssets": 500,
      "verified": 350,
      "pending": 100,
      "discrepancy": 30,
      "overdue": 20
    }
  }
}
```

#### GET /api/assets/verifications/tasks
Get verification follow-up tasks.

#### PUT /api/assets/verifications/tasks
Update verification task status.

## Error Handling

All APIs return consistent error responses:

```json
{
  "error": {
    "message": "Asset not found",
    "code": "ASSET_NOT_FOUND",
    "statusCode": 404,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

## Rate Limiting

API requests are limited to 100 requests per minute per user. Exceeded limits return HTTP 429.

## Data Validation

All input data is validated using Zod schemas. Validation errors return detailed field-level error messages.

## Department-Based Filtering

Non-admin users automatically have their queries filtered to only show assets from their department. This ensures data isolation and security.

## Audit Trail

All asset operations (create, update, delete, transfer, verify) are automatically logged in the audit trail with:
- User who performed the action
- Timestamp
- Changes made
- Original and new values

## Performance Considerations

- Use pagination for large datasets
- Implement proper indexing on frequently queried fields
- Use bulk operations for multiple items
- Cache filter options for better performance
- Implement connection pooling for database operations

## Security Features

- JWT-based authentication
- Role-based access control
- Department-based data isolation
- Input sanitization and validation
- SQL injection prevention
- XSS protection
- Rate limiting
- Audit logging