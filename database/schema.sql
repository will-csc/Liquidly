/* ==========================================================================
   COMPANY TABLE
   Stores company information for multi-tenancy support
   ========================================================================== */
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* ==========================================================================
   USER TABLE
   Stores user credentials and profile information
   Linked to a specific Company
   ========================================================================== */
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    retrieve_code VARCHAR(50),
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* ==========================================================================
   PROJECTS TABLE
   Stores project details
   ========================================================================== */
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* ==========================================================================
   BILL OF MATERIALS (BOM) TABLE
   Stores the recipe or composition of items
   ========================================================================== */
CREATE TABLE boms (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    item_code VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    qntd NUMERIC(15, 4) NOT NULL DEFAULT 0,
    um_bom VARCHAR(20) NOT NULL,
    remaining_qntd NUMERIC(15, 4) NOT NULL DEFAULT 0,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* ==========================================================================
   CONVERSIONS TABLE
   Handles unit conversions between Invoice units and BOM units
   ========================================================================== */
CREATE TABLE conversions (
    id SERIAL PRIMARY KEY,
    item_code VARCHAR(100) NOT NULL,
    qntd_invoice NUMERIC(15, 4) NOT NULL,
    um_invoice VARCHAR(20) NOT NULL,
    qntd_bom NUMERIC(15, 4) NOT NULL,
    um_bom VARCHAR(20) NOT NULL,
    conversion_factor NUMERIC(15, 6) GENERATED ALWAYS AS (CASE WHEN qntd_invoice = 0 THEN 0 ELSE qntd_bom / qntd_invoice END) STORED,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE, -- Added for multi-tenancy isolation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* ==========================================================================
   INVOICES TABLE
   Stores incoming invoices data
   ========================================================================== */
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    item_code VARCHAR(100) NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    country VARCHAR(2) NOT NULL DEFAULT '',
    invoice_date_string VARCHAR(40) NOT NULL DEFAULT '',
    invoice_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    qntd_invoice NUMERIC(15, 4) NOT NULL,
    um_invoice VARCHAR(20) NOT NULL,
    remaining_qntd NUMERIC(15, 4) NOT NULL DEFAULT 0,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE, -- Added for multi-tenancy isolation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* ==========================================================================
   PURCHASE ORDERS (POS) TABLE
   Stores purchase orders linked to invoices
   ========================================================================== */
CREATE TABLE pos (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100), -- Textual reference or FK to invoices
    qntd_invoice NUMERIC(15, 4) NOT NULL,
    um_po VARCHAR(20) NOT NULL,
    remaining_qntd NUMERIC(15, 4) NOT NULL DEFAULT 0,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE, -- Added for multi-tenancy isolation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* ==========================================================================
   LIQUIDATION RESULTS TABLE
   Stores the final results of the liquidation process
   ========================================================================== */
CREATE TABLE liquidation_results (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL, -- Stored for historical reference or ease of access
    item VARCHAR(255) NOT NULL,
    
    -- BOM Details
    qntd_bom NUMERIC(15, 4) NOT NULL DEFAULT 0,
    um_bom VARCHAR(20) NOT NULL,
    qntd_consumed_bom NUMERIC(15, 4) NOT NULL DEFAULT 0,
    remaining_qntd NUMERIC(15, 4) NOT NULL DEFAULT 0,
    
    -- Invoice Details
    invoice_number VARCHAR(100),
    invoice_country VARCHAR(2) NOT NULL DEFAULT '',
    invoice_date_string VARCHAR(40) NOT NULL DEFAULT '',
    invoice_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    qntd_invoice NUMERIC(15, 4) NOT NULL DEFAULT 0,
    um_invoice VARCHAR(20),
    consumed_invoice_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    qntd_consumed_invoice NUMERIC(15, 4) NOT NULL DEFAULT 0,
    remaining_invoice_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    remaining_qntd_invoice NUMERIC(15, 4) NOT NULL DEFAULT 0,
    
    -- PO Details
    po_number VARCHAR(100),
    qntd_po NUMERIC(15, 4) NOT NULL DEFAULT 0,
    um_po VARCHAR(20),
    qntd_consumed_po NUMERIC(15, 4) NOT NULL DEFAULT 0,
    remaining_qntd_po NUMERIC(15, 4) NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* ==========================================================================
   PERFORMANCE INDEXES
   ========================================================================== */
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_boms_item_code ON boms(item_code);
CREATE INDEX idx_conversions_item_code ON conversions(item_code);
CREATE INDEX idx_invoices_item_code ON invoices(item_code);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
