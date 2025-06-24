# R&D Stores Flow

R&D Stores Flow is a comprehensive system for managing material movements, scrap requests, work permits, purchase orders, and sale orders with dynamic, multi-level approval workflows.

## Tech Stack
This application is built with Next.js, React, ShadCN UI, Tailwind CSS, and Genkit.

## Getting Started

To get started, ensure you have Node.js and npm installed. Then:
1. Install dependencies: `npm install`
2. Run the development server: `npm run dev`
3. If using Genkit for AI features, run the Genkit development server: `npm run genkit:dev`

The main application pages can be explored starting from `/src/app/(app)/dashboard/page.tsx`.
Login is available at the root `/` path.

---

## Core Concepts & Workflow

### 1. Authentication & Roles
Users log into the system through a dedicated login page, with an option for SSO (Single Sign-On). Each user is assigned a specific role (e.g., `requester`, `approver`, `department_head`, `admin`, `finance_team`) that dictates their permissions and what they can see or do within the application.

### 2. General Request Lifecycle
All request types follow a consistent lifecycle, providing a predictable user experience.

- **Creation:** Users initiate requests through dedicated forms accessible from the sidebar navigation. Each form is tailored to the specific information required for that request type.
- **Approval:** Once submitted, a request is automatically routed through a multi-step approval chain. These chains are dynamically configured in the **Administration > Workflow Config** section.
- **Tracking:** Users can track the real-time status of their submitted requests on dedicated list pages for each request type (e.g., "Purchase Order List"). These pages show the current step, the assigned approver, and a history of actions.
- **Management:** Requests can be viewed in detail, edited (if the current workflow status permits), or voided (which cancels the request without deleting the record).
- **Closure:** After a request successfully passes all approval steps and any subsequent operational actions (like SAP processing or receipt confirmation), it is marked as "Completed" or "Approved & Closed".

---

## Detailed Process Flows

### Material Movement
**Goal:** To track and authorize the movement of materials between various locations (e.g., Warehouse to Production Floor).

1.  **Raise Request:** The user fills out the Material Movement form, specifying the source, destination, material details, quantity, and value.
2.  **Approval Flow:** The request is routed to the **Department Head**, then the **Dispatch Team**, and finally to **Finance** if the material value exceeds a certain threshold.
3.  **Execution & DC Generation:** Once approved, the request becomes eligible for a **Delivery Challan (DC)** generation from the DC Management module, which facilitates the physical movement.
4.  **Receipt Confirmation:** The workflow concludes with a "Receipt Confirmation" step, where the receiving party acknowledges the delivery in the system.

### Scrap Disposal
**Goal:** To manage the disposal of unusable materials in an auditable manner.

1.  **Raise Request:** A user initiates a request using the Scrap Disposal form, detailing the scrap type, description, quantity, weight, and attaching photographic evidence.
2.  **Operational Steps:** Pre-approval steps like material segregation by housekeeping and weighing in the presence of security are assumed to occur. The user can capture the **Gate Pass Number** in the form if available.
3.  **Approval Flow:** The request is routed for approval to the **Department Head**, then **Finance**, and finally the **MM (Materials Management) Head**.
4.  **Dispatch & Closure:** After final approval, the scrap is dispatched, and the request is marked as completed in the system.

### Work Permit
**Goal:** To ensure safety protocols are followed for non-routine or hazardous tasks.

1.  **Raise Request:** A user fills out the Work Permit form, describing the activity, location, required safety precautions, and validity period.
2.  **Approval Flow:** The request is routed through a safety-focused workflow, typically involving the **Safety Team**, **Maintenance Team**, and the **Facility Head**.
3.  **Issuance & Printing:** Upon final approval, the permit is considered "Issued". The system allows the user to print the finalized permit using a pre-configured template (managed under **Administration > Work Permit Print Templates**).

### Purchase Order (PO) & Sale Order (SO)
**Goal:** To manage the internal approval process for procuring or selling goods and services before official creation in SAP.

1.  **Raise Internal Request:** A user initiates a **Purchase Order** or **Sale Order** request. This acts as a request for budget and formal approval.
2.  **Internal Approval Flow:** The request is routed to the relevant **Department Head** and then to the **Finance** team for budgetary and commercial approval.
3.  **SAP Processing:** Once fully approved within this system, the request is sent to the relevant team to create the official PO or SO in the main SAP system.
4.  **Sync & Tracking:** The official SAP PO/SO number can be updated against the request in this application. This links the internal request to the official document, allowing for continued status tracking (e.g., "Order Fulfilled," "Shipped").

### Administration & Configuration
Users with the `admin` role have access to the **Masters** and **Administration** sections to configure the system's core logic.

-   **Workflow Configuration:** Admins can define the approval steps, assigned roles, and routing logic for each request type.
-   **User Management:** Admins can invite new users and manage their roles and department assignments.
-   **Template Management:** Admins can customize the content of system-generated emails and the layout of printed Work Permits.
-   **Masters Data:** Admins manage the foundational data lists used in forms, such as vendors, customers, cost centers, departments, and material types.
