# KTI Asset Management System - Product Specification Document

## 1. Introduction

This document outlines the features and functional specifications for the KTI Asset Management System. The platform is a custom-built, web-based application designed to track, control, and report on physical assets across various company locations (TT, ITEC, Site, Labs). It ensures complete asset visibility, movement traceability, user accountability, and provides management insights through comprehensive dashboards and reports.

## 2. Core Modules

The application is structured into five core modules:

1.  **Dashboard:** A high-level, role-based command center for at-a-glance visibility of key metrics, trends, and alerts.
2.  **Asset Management:** The central hub for viewing, searching, and managing the entire asset register.
3.  **Asset Transactions:** A collection of modules for executing all asset lifecycle events, from transfers to disposal.
4.  **Reports:** A suite of detailed, exportable reports for analysis, compliance, and financial auditing.
5.  **Administration:** A restricted area for system administrators to manage master data, users, and roles.

---

## 3. Detailed Features & Functionalities

### 3.1. Dashboard

The dashboard serves as the primary landing page, providing a consolidated view of the asset ecosystem.

-   **Global Filters:** Users can filter the entire dashboard view by Department, Team/Tribe, Location, and Asset Classification.
-   **KPI Cards:** A series of quick-access statistical cards displaying real-time metrics. Each card is a hyperlink to the relevant detailed page.
    -   Total Assets
    -   Assets in Use
    -   Assets Available (In Store)
    -   Assets in Calibration
    -   Scrapped Assets
    -   Verification Due
    -   Overdue Returns
-   **Visual Charts:**
    -   **Asset Distribution by Category:** A bar chart showing the number of assets in each classification (e.g., IT, Lab, Machinery).
    -   **Asset Distribution by Department:** A bar chart visualizing asset allocation across different departments.
    -   **Recent Asset Movements:** A line chart tracking the volume of different movement types (e.g., TT ↔ ITEC, Calibration, Scrap) over the last six months.
-   **Actionable Widgets:**
    -   **Pending Asset Requests:** A table listing asset-related requests (Transfers, Scrap, Ownership Changes) awaiting action.
    -   **Alerts & Exceptions:** A summary list of critical items requiring attention, such as assets due for return, expiring warranties, and those with incomplete data.

### 3.2. Asset Management

The command center for all asset-related data and actions.

-   **Advanced Data Grid:**
    -   **Comprehensive Search:** A powerful search box to instantly find assets by Asset No., KM No., Serial No., Description, etc.
    -   **Multi-Select Filters:** A dedicated panel to filter the asset list by Department, Location, Status, Classification, and other attributes.
    -   **Customizable Columns:** Includes key data points like Asset No., KM No., Description, Department, Location, Status, and Last Verified Date.
    -   **Pagination:** Efficiently handles large datasets by breaking them into manageable pages.
-   **Role-Based Views & Actions:**
    -   **Admin:** Full access to create, view, edit, and delete all assets.
    -   **SPOC/User:** View is restricted to assets within their own department.
-   **Asset Actions (per-row):**
    -   **View/Edit:** Opens a detailed modal/pane showing all asset master data. Admins have edit rights, while other users have a read-only view.
    -   **View Image:** Opens a dialog to display the primary photo of the asset.
    -   **View History:** Opens a dialog showing a mock timeline of the asset's key lifecycle events (creation, status changes, verification).
-   **Toolbar & Bulk Actions:**
    -   **Add New Asset:** (Admin Only) Navigates to a dedicated form for creating a new asset.
    -   **Bulk Upload:** (Admin Only) An option to upload an Excel/CSV file to add multiple assets at once.
    -   **Export:** Buttons to export the filtered grid data to Excel or PDF (mocked functionality).
    -   **Bulk Actions:** Checkboxes on each row enable selecting multiple assets for bulk operations like deletion or status updates (UI in place, backend logic pending).

### 3.3. Asset Transactions

This module facilitates all standard operations throughout an asset's lifecycle.

-   **Asset Request & Approve:** A workflow for requesting and approving ownership changes between departments.
-   **Transfer (Movement):** A form to initiate and log asset movements between different locations (e.g., ITEC to Site, or to a Calibration lab), requiring a mandatory DC (Delivery Challan) number.
-   **Check-in / Check-out:** A system for managing the temporary assignment of assets to users, tracking expected return dates, and checking them back into the store.
-   **Verification / Audit:** A dedicated interface for performing asset audits. Users can search for an asset and update its verification status, condition, and attach mandatory photo evidence.
-   **Scrap Disposal:** A final-step process to mark an asset as scrapped. This action is irreversible and requires Scrap DC details and proof of disposal.
-   **Feedback & Issue Log:** A system allowing any user to find an asset and submit feedback or report an issue (e.g., data inaccuracy, condition problem), which is then logged for review.

### 3.4. Reports

A comprehensive reporting engine for data analysis and compliance. All reports include options to export to Excel and PDF.

-   **Asset Register:** A complete, filterable master list of all assets with all their key data fields.
-   **Movement Report:** A detailed log of all asset movements, showing type, from/to locations, dates, and responsible persons.
-   **Verification Report:** Tracks the verification history and current status (Verified, Pending, Discrepancy) for all assets.
-   **Depreciation/Finance Report:** Provides a financial overview, including purchase value, capitalization date, asset life, and calculated annual/accumulated depreciation and WDV.
-   **Scrap Register:** A definitive log of all assets that have been formally scrapped.
-   **Utilization Report:** An analysis of asset usage frequency to identify under-utilized assets.
-   **Asset Value Summary:** A management-level report summarizing the total purchase value of assets, grouped by either Department or Category.
-   **Exception Reports:**
    -   **Incomplete Records:** Highlights assets with missing mandatory information (e.g., no serial number, no photo) to drive data quality improvements.

### 3.5. Administration (Admin Role Only)

This section provides system administrators with the tools to configure and maintain the application's foundational data.

-   **User Management:**
    -   View a list of all system users, their roles, and assigned departments.
    -   Invite new users via email and assign them a role.
    -   Edit existing users to change their role or department.
    -   Synchronize users from an SSO provider (mocked functionality).
-   **Masters Management:** A collection of pages to manage the core dropdown data used throughout the application, ensuring consistency and preventing free-text errors. This includes master lists for:
    -   Asset Classification
    -   Asset Grouping
    -   Locations (Sites, Buildings, Labs)
    -   Departments, Teams & Tribes
    -   Coordinator (SPOC) Mappings
    -   Movement Types
    -   Reason Codes
    -   Asset Statuses
    -   Asset Conditions
    -   Verification/Audit Plans
    -   Alert/Notification Rules
---
