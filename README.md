# KTI Assets - Asset Management System

A custom asset management platform to track, control, and report on physical assets across various locations (TT, ITEC, Site, Labs). This system ensures proper asset visibility, movement traceability, user accountability, and provides management insights via dashboards and reports.

## Tech Stack
This application is built with Next.js, React, ShadCN UI, Tailwind CSS, and Genkit.

## Getting Started

To get started, ensure you have Node.js and npm installed. Then:
1. Install dependencies: `npm install`
2. Run the development server: `npm run dev`

The main application pages can be explored starting from `/src/app/(app)/dashboard/page.tsx`.
Login is available at the root `/` path.

---

## Core Modules

### 1. Dashboard
- **Purpose**: Provide quick, role-based visibility of asset status, movements, and alerts.
- **Features**:
  - **Team/Department View**: Asset summary by Team, Tribe, and Department.
  - **Category/Classification View**: Asset counts by type, classification, and usage status.
  - **Status Snapshot**: View counts of Active, Reserved, Calibration, Scrap, and Verification pending assets.
  - **Movements Monitor**: Track transfers (TT ↔ ITEC, ITEC → Site, Calibration, Scrap) in the current week.
  - **Alerts & Notifications**:
    - Assets due for return.
    - Calibration and verification reminders.
    - Overdue returns.
  - **Quick Links**: Easy access to create assets, initiate transfers, start audits, and view reports.

### 2. Masters
- **Purpose**: Central repository for core asset and organizational reference data.
- **Components**:
  - **Asset Master**: Contains all data fields for an asset, including attachments like invoices, warranty documents, calibration certificates, and photos.
  - **Movement Master**: Tracks all asset transfers with details like DC numbers, locations, responsible persons, dates, and reasons.
  - **Verification Master**: Logs verification status, dates, photos, and asset condition.
  - **Ownership Request Master**: Manages requests for changing asset ownership between departments.
  - **User & Role Master**: Defines user roles (Admin, SPOC, User) and their access permissions based on an access matrix.

### 3. Transactions
- **Asset Lifecycle Management**: Full CRUD (Create, Read, Update, Display) functionality for assets, including marking them for scrap.
- **Check-in / Check-out & Reservation**: Manage temporary asset usage.
- **Transfer Movements**: Handle all types of asset transfers between locations.
- **Ownership Change Request**: A workflow for raising and approving ownership changes.
- **Verification/Audit**: A mobile-friendly interface for verifying assets, including mandatory photo capture.
- **Feedback**: A system for users to submit issues or remarks for any asset.

### 4. Reports
- **Asset Register Report**: A complete, filterable list of all assets.
- **Movement Report**: Detailed report on asset movements.
- **Verification Report**: Tracks verification history and pending verifications.
- **Depreciation/Finance Report**: Provides financial data for assets.
- **Scrap Register Report**: A log of all scrapped assets.
- **Utilization Report**: Insights into asset usage frequency.
- **Exception Reports**: Highlights issues like overdue returns, missing photos, and inactive assets.

---

## Functional Requirements

- **Role-based Access Control**:
  - **Admin**: Full control over all modules.
  - **SPOC (Single Point of Contact)**: Read-only access within their department, can raise ownership requests and provide feedback.
  - **User**: Read-only access within their department.
- **Asset Movements Tracking**: All transfers are tracked with mandatory DC numbers. Different statuses (e.g., Scrap, Calibration) affect asset availability.
- **Notifications & Alerts**: Automated email alerts for key events.
- **Responsive UI**: The application is designed to be fully responsive and optimized for web, tablet, and mobile devices.
- **Audit Trail**: All significant actions (create, edit, move, verify) are logged with user and timestamp details.
