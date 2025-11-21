# KTI Asset Management System - UI Package

This package contains all the UI components and pages for the KTI Asset Management System. It is designed to be a self-contained module that can be integrated into a larger application.

## Contents

This package includes the following features:

### 1. Core Asset Management
- **Asset List (`/list`):** A comprehensive interface to view, search, filter, and manage all registered assets.
- **New Asset (`/new`):** A form to create and add new assets to the system.

### 2. Asset Transactions
A suite of modules to handle the entire asset lifecycle:
- **Asset Requests & Approvals (`/requests`)**
- **Asset Transfers/Movements (`/transfers`)**
- **Asset Check-in / Check-out (`/check-in-out`)**
- **Asset Verification / Audit (`/audit`)**
- **Scrap Disposal (`/scrap-disposal`)**
- **Asset Feedback & Issue Log (`/feedback`)**

### 3. Asset-Related Reports
A collection of detailed reports for analysis, compliance, and financial auditing:
- **Asset Register Report (`/reports/asset-register`)**
- **Movement Report (`/reports/movement-report`)**
- **Verification Report (`/reports/verification-report`)**
- **Depreciation/Finance Report (`/reports/finance-report`)**
- **Scrap Register Report (`/reports/scrap-report`)**
- **Utilization Report (`/reports/utilization-report`)**
- **Asset Value Summary Report (`/reports/asset-value-summary`)**
- **Incomplete Records Report (`/reports/incomplete-records`)**

### 4. Administration & Masters
A restricted area for administrators to manage the foundational data for the asset system:
- **User Management & Audit Logs**
- **Master Data Management:**
  - Asset Classifications
  - Asset Groupings
  - Locations
  - Departments & Teams
  - Coordinator Mappings
  - Movement Types
  - Reason Codes
  - Asset Statuses & Conditions
  - Audit & Notification Rules

### 5. Components
- **AssetForm:** The primary form used for creating and editing assets, located in the `/components` directory.
