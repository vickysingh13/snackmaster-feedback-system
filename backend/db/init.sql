-- SnackMaster Database Schema
-- Run: psql $DATABASE_URL -f db/init.sql

-- Drop existing tables
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS weekly_config CASCADE;
DROP TABLE IF EXISTS form_configs CASCADE;
DROP TABLE IF EXISTS machines CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- Machines table
CREATE TABLE machines (
  id SERIAL PRIMARY KEY,
  machine_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  location VARCHAR(255) NOT NULL,
  area VARCHAR(100),
  qr_code_url VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Submissions table
CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  machine_id INTEGER REFERENCES machines(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('complaint', 'refund', 'feedback', 'suggestion', 'rating')),
  data JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(30) DEFAULT 'pending',
  whatsapp_status VARCHAR(30) DEFAULT 'not_contacted' CHECK (whatsapp_status IN ('not_contacted', 'in_progress', 'done')),
  admin_notes TEXT,
  refund_status VARCHAR(30) DEFAULT 'pending' CHECK (refund_status IN ('pending', 'processing', 'completed')),
  admin_remarks TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Form configurations table
CREATE TABLE form_configs (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  fields JSONB NOT NULL DEFAULT '[]',
  display_order INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Weekly feedback config
CREATE TABLE weekly_config (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin users
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) DEFAULT 'Admin',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_submissions_machine_id ON submissions(machine_id);
CREATE INDEX idx_submissions_type ON submissions(type);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);

-- =====================
-- SEED DATA
-- =====================

-- Insert real machine master data
INSERT INTO machines (machine_code, name, location, area, status) VALUES
  ('2143', 'WIPRO GOPANPALLY', 'GROUND FLOOR', NULL, 'active'),
  ('2144', 'WIPRO MANIKONDA 5', 'GROUND FLOOR', NULL, 'active'),
  ('2145', 'WIPRO MANIKONDA 4', 'GROUND FLOOR', NULL, 'active'),
  ('2632', 'WIPRO GOPANPALLY 1', 'GROUND FLOOR', NULL, 'active'),
  ('2633', 'WIPRO GOPANPALLY 2', 'GROUND FLOOR', NULL, 'active'),
  ('2634', 'WIPRO GOPANPALLY 3', 'GROUND FLOOR', NULL, 'active'),
  ('2642', 'WIPRO MANIKONDA 1', '9TH FLOOR', NULL, 'active'),
  ('2643', 'WIPRO MANIKONDA 2', '3RD FLOOR', NULL, 'active'),
  ('2644', 'WIPRO MANIKONDA 3', 'GROUND FLOOR', NULL, 'active'),
  ('2645', 'WIPRO MANIKONDA 6', 'GROUND FLOOR', NULL, 'active'),
  ('4772', 'DRAPER STARTUP HOUSE', 'GACHIBOWLI', NULL, 'active'),
  ('VV00006', 'HOTEL SAYINN', 'GROUND FLOOR', NULL, 'active'),
  ('vv00001', 'BOB', 'BANK OF BARODA GACHIBOWLI', NULL, 'active'),
  ('vv00002', 'IIRM', 'IIRM FINANCIAL DIST', NULL, 'active'),
  ('vv00003', 'UOH', 'UNIVERSITY OF HYDERABAD GACHIBOWLI', NULL, 'active');

-- Insert form configurations
INSERT INTO form_configs (type, label, is_enabled, display_order, fields) VALUES
(
  'complaint',
  'Report a Problem',
  true,
  1,
  '[
    {"name": "name", "label": "Your Name", "type": "text", "required": true, "placeholder": "Enter your name"},
    {"name": "phone", "label": "Phone Number", "type": "tel", "required": false, "placeholder": "Optional - for follow-up"},
    {"name": "issue_type", "label": "Issue Type", "type": "select", "required": true, "options": ["Not dispensing product", "Payment deducted but no product", "Product stuck", "Machine not working", "Poor quality", "Wrong product", "Others"]},
    {"name": "description", "label": "Describe the Issue", "type": "textarea", "required": false, "placeholder": "Tell us more about the problem..."}
  ]'
),
(
  'refund',
  'Request a Refund',
  true,
  2,
  '[
    {"name": "name", "label": "Your Name", "type": "text", "required": true, "placeholder": "Enter your full name"},
    {"name": "phone", "label": "Phone Number", "type": "tel", "required": true, "placeholder": "Required for refund processing"},
    {"name": "amount", "label": "Amount Paid (₹)", "type": "number", "required": true, "placeholder": "e.g. 30"},
    {"name": "description", "label": "What Happened?", "type": "textarea", "required": false, "placeholder": "Briefly describe the issue..."}
  ]'
),
(
  'feedback',
  'Weekly Feedback',
  true,
  3,
  '[
    {"name": "rating", "label": "Overall Rating", "type": "star_rating", "required": true},
    {"name": "comment", "label": "Your Comments", "type": "textarea", "required": false, "placeholder": "Share your thoughts..."}
  ]'
),
(
  'suggestion',
  'Suggest a Product',
  true,
  4,
  '[
    {"name": "product", "label": "Product Name / Type", "type": "text", "required": true, "placeholder": "e.g. Lay''s Classic Salted, Green Tea"},
    {"name": "preference", "label": "Would you buy this?", "type": "like_dislike", "required": true},
    {"name": "comments", "label": "Additional Comments", "type": "textarea", "required": false, "placeholder": "Tell us more about why you want this product..."}
  ]'
),
(
  'rating',
  'Rate Our Service',
  true,
  5,
  '[
    {"name": "service", "label": "Service Quality", "type": "star_rating", "required": true},
    {"name": "refill_timing", "label": "Refill Timing", "type": "star_rating", "required": true},
    {"name": "product_availability", "label": "Product Availability", "type": "star_rating", "required": true},
    {"name": "cleanliness", "label": "Cleanliness", "type": "star_rating", "required": true},
    {"name": "comment", "label": "Additional Comments", "type": "textarea", "required": false, "placeholder": "Any other feedback?"}
  ]'
);

-- Insert weekly config
INSERT INTO weekly_config (title, start_date, end_date, is_active) VALUES
  ('Mar 31 – Apr 6, 2025', '2025-03-31', '2025-04-06', true);

-- Insert default admin user (password: SnackMaster@2024)
-- This hash is for 'SnackMaster@2024' - change in production!
INSERT INTO admin_users (email, password_hash, name) VALUES
  ('admin@snackmaster.io', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'SnackMaster Admin');

-- Note: The password hash above is a placeholder. Run the backend setup script to generate proper hash.
-- Or use: node -e "const b=require('bcryptjs');b.hash('SnackMaster@2024',10).then(h=>console.log(h))"
