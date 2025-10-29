-- More detailed database schema for the KTI Assets application

-- Master Data Tables

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE asset_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE asset_classifications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE asset_groupings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    industry VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    category VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE uom (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    abbreviation VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hsn_sac_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('HSN', 'SAC')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE store_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    location TEXT NOT NULL,
    type VARCHAR(100) NOT NULL,
    manager VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE department_budgets (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id),
    year VARCHAR(4) NOT NULL,
    q1_budget NUMERIC(15, 2),
    q2_budget NUMERIC(15, 2),
    q3_budget NUMERIC(15, 2),
    q4_budget NUMERIC(15, 2),
    UNIQUE (department_id, year),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cost_centers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE material_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scrap_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teams_and_tribes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE movement_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reason_codes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE request_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE request_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE material_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lifecycle_stages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Core Tables

CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    department_id INTEGER REFERENCES departments(id),
    phone VARCHAR(50),
    employee_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    require_password_change BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transaction Tables

CREATE TABLE assets (
    id VARCHAR(255) PRIMARY KEY,
    asset_number VARCHAR(255) UNIQUE NOT NULL,
    km_number VARCHAR(255),
    asset_description TEXT NOT NULL,
    asset_classification_id INTEGER REFERENCES asset_classifications(id),
    asset_grouping_id INTEGER REFERENCES asset_groupings(id),
    lifecycle_years INTEGER,
    capitalization_date DATE,
    eol_date DATE,
    purchase_value NUMERIC(15, 2),
    ledger_qty INTEGER NOT NULL,
    brand_name VARCHAR(255),
    model_no VARCHAR(255),
    product_serial_no VARCHAR(255),
    on_going_project VARCHAR(255),
    weekly_usage_frequency INTEGER,
    person_responsible VARCHAR(255),
    current_user VARCHAR(255),
    team_or_tribe_id INTEGER REFERENCES teams_and_tribes(id),
    department_id INTEGER REFERENCES departments(id),
    asset_coordinator VARCHAR(255),
    location_id INTEGER REFERENCES locations(id),
    floor VARCHAR(255),
    laboratory VARCHAR(255),
    verification_status VARCHAR(50),
    verified_on DATE,
    usable_condition VARCHAR(20),
    working_condition_status VARCHAR(50),
    comments TEXT,
    current_status_id INTEGER REFERENCES asset_statuses(id),
    status_changed_on DATE,
    lifecycle_stage_id INTEGER REFERENCES lifecycle_stages(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE material_movements (
    id SERIAL PRIMARY KEY,
    material_type_id INTEGER REFERENCES material_types(id),
    source_location_id INTEGER REFERENCES store_locations(id),
    destination_location_id INTEGER REFERENCES store_locations(id),
    quantity INTEGER NOT NULL,
    value NUMERIC(15, 2),
    is_returnable BOOLEAN,
    vehicle_number VARCHAR(50),
    e_way_bill VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scrap_movements (
    id SERIAL PRIMARY KEY,
    scrap_type_id INTEGER REFERENCES scrap_types(id),
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    weight NUMERIC(10, 2) NOT NULL,
    gate_pass_number VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE work_permits (
    id SERIAL PRIMARY KEY,
    building_id INTEGER REFERENCES store_locations(id),
    activity_type_id INTEGER REFERENCES activity_types(id),
    activity_details TEXT NOT NULL,
    specific_area_or_equipment VARCHAR(255) NOT NULL,
    permit_validity DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    po_category VARCHAR(255) NOT NULL,
    department_id INTEGER REFERENCES departments(id),
    vendor_id INTEGER REFERENCES vendors(id),
    km_kmg_code VARCHAR(255),
    cost_center_id INTEGER REFERENCES cost_centers(id),
    io_number VARCHAR(255) NOT NULL,
    po_date DATE NOT NULL,
    delivery_address TEXT NOT NULL,
    segment VARCHAR(255),
    payment_terms TEXT,
    remarks TEXT,
    sap_order_number VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    hsn_sac_code_id INTEGER REFERENCES hsn_sac_codes(id),
    gst_percentage NUMERIC(5, 2)
);

CREATE TABLE sale_orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    so_date DATE NOT NULL,
    project_or_cr_no VARCHAR(255) NOT NULL,
    sale_order_category VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    cost_center_id INTEGER REFERENCES cost_centers(id),
    io_number VARCHAR(255) NOT NULL,
    budget_amount NUMERIC(15, 2),
    material_required_date DATE NOT NULL,
    department_head_approval VARCHAR(255) NOT NULL,
    delivery_to VARCHAR(255) NOT NULL,
    shipping_address TEXT NOT NULL,
    billing_address TEXT,
    remarks TEXT,
    sap_order_number VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sale_order_items (
    id SERIAL PRIMARY KEY,
    sale_order_id INTEGER REFERENCES sale_orders(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    hsn_sac_code_id INTEGER REFERENCES hsn_sac_codes(id),
    gst_percentage NUMERIC(5, 2)
);

CREATE TABLE material_receipts (
    id SERIAL PRIMARY KEY,
    grn_number VARCHAR(255),
    po_number VARCHAR(255),
    vendor_id INTEGER REFERENCES vendors(id),
    receipt_date DATE NOT NULL,
    store_location_id INTEGER REFERENCES store_locations(id),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE material_receipt_items (
    id SERIAL PRIMARY KEY,
    material_receipt_id INTEGER REFERENCES material_receipts(id) ON DELETE CASCADE,
    material_id VARCHAR(255) NOT NULL, -- Assuming material_id is a string, adjust if it's a foreign key
    quantity INTEGER NOT NULL
);

CREATE TABLE material_issues (
    id SERIAL PRIMARY KEY,
    issue_id VARCHAR(255),
    request_code VARCHAR(255),
    issued_to_department_id INTEGER REFERENCES departments(id),
    issue_date DATE NOT NULL,
    store_location_id INTEGER REFERENCES store_locations(id),
    purpose TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE material_issue_items (
    id SERIAL PRIMARY KEY,
    material_issue_id INTEGER REFERENCES material_issues(id) ON DELETE CASCADE,
    material_id VARCHAR(255) NOT NULL, -- Assuming material_id is a string, adjust if it's a foreign key
    quantity INTEGER NOT NULL
);

CREATE TABLE material_returns (
    id SERIAL PRIMARY KEY,
    original_issue_id VARCHAR(255),
    returned_by_department_id INTEGER REFERENCES departments(id),
    return_date DATE NOT NULL,
    store_location_id INTEGER REFERENCES store_locations(id),
    reason TEXT NOT NULL,
    condition VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE material_return_items (
    id SERIAL PRIMARY KEY,
    material_return_id INTEGER REFERENCES material_returns(id) ON DELETE CASCADE,
    material_id VARCHAR(255) NOT NULL, -- Assuming material_id is a string, adjust if it's a foreign key
    quantity INTEGER NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_department_id ON users(department_id);

CREATE INDEX idx_assets_asset_number ON assets(asset_number);
CREATE INDEX idx_assets_classification_id ON assets(asset_classification_id);
CREATE INDEX idx_assets_grouping_id ON assets(asset_grouping_id);
CREATE INDEX idx_assets_department_id ON assets(department_id);
CREATE INDEX idx_assets_location_id ON assets(location_id);
CREATE INDEX idx_assets_current_status_id ON assets(current_status_id);
CREATE INDEX idx_assets_lifecycle_stage_id ON assets(lifecycle_stage_id);

CREATE INDEX idx_material_movements_material_type_id ON material_movements(material_type_id);
CREATE INDEX idx_material_movements_source_location_id ON material_movements(source_location_id);
CREATE INDEX idx_material_movements_destination_location_id ON material_movements(destination_location_id);

CREATE INDEX idx_scrap_movements_scrap_type_id ON scrap_movements(scrap_type_id);

CREATE INDEX idx_work_permits_building_id ON work_permits(building_id);
CREATE INDEX idx_work_permits_activity_type_id ON work_permits(activity_type_id);

CREATE INDEX idx_purchase_orders_department_id ON purchase_orders(department_id);
CREATE INDEX idx_purchase_orders_vendor_id ON purchase_orders(vendor_id);
CREATE INDEX idx_purchase_orders_cost_center_id ON purchase_orders(cost_center_id);

CREATE INDEX idx_sale_orders_customer_id ON sale_orders(customer_id);
CREATE INDEX idx_sale_orders_cost_center_id ON sale_orders(cost_center_id);

CREATE INDEX idx_material_receipts_vendor_id ON material_receipts(vendor_id);
CREATE INDEX idx_material_receipts_store_location_id ON material_receipts(store_location_id);

CREATE INDEX idx_material_issues_issued_to_department_id ON material_issues(issued_to_department_id);
CREATE INDEX idx_material_issues_store_location_id ON material_issues(store_location_id);

CREATE INDEX idx_material_returns_returned_by_department_id ON material_returns(returned_by_department_id);
CREATE INDEX idx_material_returns_store_location_id ON material_returns(store_location_id);

CREATE INDEX idx_department_budgets_department_id ON department_budgets(department_id);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
