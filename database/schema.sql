-- ===========================================
-- Agencies Master
-- ===========================================

CREATE TABLE agencies (
    agency_id INT AUTO_INCREMENT PRIMARY KEY,
    agency_name VARCHAR(200) NOT NULL,
    gst_number VARCHAR(20),
    mobile_no VARCHAR(15),
    email VARCHAR(100),
    address TEXT,
    status ENUM('Active','Inactive') DEFAULT 'Active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- ===========================================
-- TP Scheme Master
-- ===========================================

CREATE TABLE tp_schemes (

    tp_scheme_id INT AUTO_INCREMENT PRIMARY KEY,

    tp_scheme_code VARCHAR(20) NOT NULL UNIQUE,

    tp_scheme_name VARCHAR(255) NOT NULL,

    zone_name VARCHAR(150),

    display_order INT DEFAULT 0,

    status ENUM('Active','Inactive') DEFAULT 'Active',

    created_by VARCHAR(100),

    updated_by VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_tp_scheme_code
ON tp_schemes(tp_scheme_code);

CREATE INDEX idx_agency_name
ON agencies(agency_name);
-- ===========================================
-- HOARDINGS MASTER
-- ===========================================

CREATE TABLE hoardings (

    hoarding_id INT AUTO_INCREMENT PRIMARY KEY,

    agency_id INT NOT NULL,

    tp_scheme_id INT NOT NULL,

    financial_year VARCHAR(20) NOT NULL,

    hoarding_number VARCHAR(50),

    final_plot_no VARCHAR(100),

    property_owner_name VARCHAR(255),

    hoarding_location TEXT,

    hoarding_type ENUM(
        'Single Side Hoarding',
        'Double Side Hoarding',
        'Computerized Hoarding',
        'LED Board'
    ) NOT NULL,

    permission_date DATE,

    width DECIMAL(10,2) DEFAULT 0,

    height DECIMAL(10,2) DEFAULT 0,

    area DECIMAL(12,2) DEFAULT 0,

    rate DECIMAL(12,2) DEFAULT 0,

    annual_license_fee DECIMAL(12,2) DEFAULT 0,

    quarterly_license_fee DECIMAL(12,2) DEFAULT 0,

    status ENUM(
        'Active',
        'Inactive',
        'Cancelled'
    ) DEFAULT 'Active',

    cancellation_date DATE NULL,

    cancellation_reason TEXT,

    cancelled_by VARCHAR(150),

    cancellation_financial_year VARCHAR(20),

    latitude DECIMAL(10,7),

    longitude DECIMAL(10,7),

    remarks TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_hoarding_agency
        FOREIGN KEY (agency_id)
        REFERENCES agencies(agency_id)
        ON UPDATE CASCADE,

    CONSTRAINT fk_hoarding_tp
        FOREIGN KEY (tp_scheme_id)
        REFERENCES tp_schemes(tp_scheme_id)
        ON UPDATE CASCADE

);

CREATE INDEX idx_hoarding_agency
ON hoardings(agency_id);

CREATE INDEX idx_hoarding_tp
ON hoardings(tp_scheme_id);

CREATE INDEX idx_hoarding_status
ON hoardings(status);

CREATE INDEX idx_hoarding_year
ON hoardings(financial_year);

receipt_id
hoarding_id
agency_id
financial_year
quarter
receipt_number
receipt_date
license_fee
interest
miscellaneous_charges
cgst
sgst
grand_total
remarks
created_at
updated_at

certificate_id
hoarding_id
agency_id
certificate_number
issue_date
valid_till_date
engineer_name
engineer_mobile
remarks
created_at
updated_at

audit_id
tp_scheme_id
action
old_data
new_data
performed_by
created_at

user_id
username
password_hash
role
zone
status

setting_key
setting_value

backup_id
filename
backup_date
created_by