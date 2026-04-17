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
  location VARCHAR(255) NOT NULL,
  area VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
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

-- Insert 17 vending machines
INSERT INTO machines (machine_code, location, area, status) VALUES
  ('SM-2101', 'Hitech City Metro Station - Gate 1', 'Hyderabad', 'active'),
  ('SM-2102', 'Madhapur Bus Stop - Bay 3', 'Hyderabad', 'active'),
  ('SM-2103', 'Gachibowli Stadium Entrance', 'Hyderabad', 'active'),
  ('SM-2104', 'Kondapur Junction - Reliance Fresh', 'Hyderabad', 'active'),
  ('SM-2105', 'Raidurg Metro Station - Exit B', 'Hyderabad', 'active'),
  ('SM-2106', 'DLF Cybercity Building 5 Lobby', 'Hyderabad', 'active'),
  ('SM-2107', 'Mindspace IT Park - Food Court', 'Hyderabad', 'active'),
  ('SM-2108', 'Jubilee Hills Road No. 36 - Forum Mall', 'Hyderabad', 'active'),
  ('SM-2109', 'Banjara Hills Road 10 - KFC Corner', 'Hyderabad', 'active'),
  ('SM-2110', 'Ameerpet Metro Station - Platform 2', 'Hyderabad', 'active'),
  ('SM-2111', 'Kukatpally Housing Board - Main Gate', 'Hyderabad', 'active'),
  ('SM-2112', 'JNTU Hyderabad - Main Block Corridor', 'Hyderabad', 'active'),
  ('SM-2113', 'Nallagandla Outer Ring Road - Petrol Pump', 'Hyderabad', 'active'),
  ('SM-2114', 'Manikonda Village Main Road', 'Hyderabad', 'active'),
  ('SM-2115', 'Financial District - Building 12 Lobby', 'Hyderabad', 'active'),
  ('SM-2116', 'Kokapet Growth Corridor - Parking Block A', 'Hyderabad', 'active'),
  ('SM-2117', 'Nanakramguda IT Hub - Reception', 'Hyderabad', 'active');

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
