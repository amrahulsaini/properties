SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(32) NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'agent',
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  avatar_url VARCHAR(255) NULL,
  signature_url VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY ux_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(180) NOT NULL,
  code VARCHAR(64) NULL,
  type VARCHAR(32) NOT NULL DEFAULT 'plot',
  village VARCHAR(140) NULL,
  location VARCHAR(255) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_projects_type (type),
  KEY idx_projects_village (village)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS plots (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NULL,
  village VARCHAR(140) NOT NULL,
  survey_number VARCHAR(120) NOT NULL,
  area_sqft DECIMAL(14,2) NOT NULL DEFAULT 0,
  price DECIMAL(14,2) NOT NULL DEFAULT 0,
  location_text VARCHAR(255) NULL,
  map_url VARCHAR(255) NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'available',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_plots_project (project_id),
  KEY idx_plots_status (status),
  KEY idx_plots_village (village)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  plot_id BIGINT UNSIGNED NULL,
  project_id BIGINT UNSIGNED NULL,
  transaction_type VARCHAR(32) NOT NULL,
  counterparty_name VARCHAR(180) NOT NULL,
  counterparty_phone VARCHAR(32) NULL,
  counterparty_email VARCHAR(190) NULL,
  counterparty_photo_url VARCHAR(255) NULL,
  counterparty_signature_url VARCHAR(255) NULL,
  village VARCHAR(140) NOT NULL,
  survey_number VARCHAR(120) NOT NULL,
  area_sqft DECIMAL(14,2) NULL,
  payment_mode VARCHAR(32) NULL,
  base_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  expense_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  gst_enabled TINYINT(1) NOT NULL DEFAULT 0,
  gst_rate DECIMAL(6,2) NOT NULL DEFAULT 0,
  gst_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  profit_loss DECIMAL(14,2) NOT NULL DEFAULT 0,
  transacted_at DATETIME NULL,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_transactions_plot (plot_id),
  KEY idx_transactions_project (project_id),
  KEY idx_transactions_type (transaction_type),
  KEY idx_transactions_village (village),
  CONSTRAINT fk_transactions_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS advance_bookings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  plot_id BIGINT UNSIGNED NULL,
  project_id BIGINT UNSIGNED NULL,
  customer_name VARCHAR(180) NOT NULL,
  customer_phone VARCHAR(32) NULL,
  customer_email VARCHAR(190) NULL,
  village VARCHAR(140) NOT NULL,
  survey_number VARCHAR(120) NOT NULL,
  area_sqft DECIMAL(14,2) NULL,
  total_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  advance_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  remaining_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  payment_mode VARCHAR(32) NULL,
  payment_at DATETIME NULL,
  customer_signature_url VARCHAR(255) NULL,
  company_signature_url VARCHAR(255) NULL,
  gst_enabled TINYINT(1) NOT NULL DEFAULT 0,
  gst_number VARCHAR(64) NULL,
  memo_number VARCHAR(80) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'confirmed',
  message_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  pdf_url VARCHAR(255) NULL,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bookings_plot (plot_id),
  KEY idx_bookings_project (project_id),
  KEY idx_bookings_customer (customer_name),
  CONSTRAINT fk_bookings_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS advance_agreements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  plot_id BIGINT UNSIGNED NULL,
  project_id BIGINT UNSIGNED NULL,
  owner_name VARCHAR(180) NOT NULL,
  owner_phone VARCHAR(32) NULL,
  owner_email VARCHAR(190) NULL,
  village VARCHAR(140) NOT NULL,
  survey_number VARCHAR(120) NOT NULL,
  area_sqft DECIMAL(14,2) NULL,
  total_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  remaining_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  payment_mode VARCHAR(32) NULL,
  refundable TINYINT(1) NOT NULL DEFAULT 0,
  agreement_duration_days INT NOT NULL DEFAULT 0,
  conditions_text TEXT NULL,
  inspection_rights TEXT NULL,
  agreement_at DATETIME NULL,
  pdf_url VARCHAR(255) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_agreements_plot (plot_id),
  KEY idx_agreements_project (project_id),
  CONSTRAINT fk_agreements_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS agents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  name VARCHAR(180) NOT NULL,
  phone VARCHAR(32) NULL,
  email VARCHAR(190) NULL,
  photo_url VARCHAR(255) NULL,
  signature_url VARCHAR(255) NULL,
  bank_name VARCHAR(140) NULL,
  account_number VARCHAR(80) NULL,
  ifsc_code VARCHAR(32) NULL,
  upi_id VARCHAR(120) NULL,
  commission_percent DECIMAL(8,2) NOT NULL DEFAULT 0,
  commission_fixed DECIMAL(14,2) NOT NULL DEFAULT 0,
  address TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_agents_user (user_id),
  CONSTRAINT fk_agents_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS agent_commissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  agent_id BIGINT UNSIGNED NOT NULL,
  transaction_id BIGINT UNSIGNED NULL,
  project_id BIGINT UNSIGNED NULL,
  month_label VARCHAR(32) NULL,
  commission_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  pending_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_agent_commissions_agent (agent_id),
  CONSTRAINT fk_agent_commissions_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  CONSTRAINT fk_agent_commissions_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
  CONSTRAINT fk_agent_commissions_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employees (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  name VARCHAR(180) NOT NULL,
  role_title VARCHAR(120) NOT NULL,
  phone VARCHAR(32) NULL,
  email VARCHAR(190) NULL,
  salary_type VARCHAR(32) NULL,
  monthly_salary DECIMAL(14,2) NOT NULL DEFAULT 0,
  joining_date DATE NULL,
  photo_url VARCHAR(255) NULL,
  signature_url VARCHAR(255) NULL,
  address TEXT NULL,
  location_tracking_enabled TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_employees_user (user_id),
  CONSTRAINT fk_employees_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_employees_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance_entries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_id BIGINT UNSIGNED NOT NULL,
  attendance_date DATE NOT NULL,
  check_in_at DATETIME NULL,
  check_out_at DATETIME NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  location_label VARCHAR(255) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'present',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_attendance_employee (employee_id),
  KEY idx_attendance_date (attendance_date),
  CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS salary_entries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_id BIGINT UNSIGNED NOT NULL,
  month_label VARCHAR(32) NOT NULL,
  base_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  bonus_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  deduction_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  net_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  paid_at DATETIME NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_salary_employee (employee_id),
  CONSTRAINT fk_salary_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_salary_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS performance_entries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_id BIGINT UNSIGNED NOT NULL,
  review_period VARCHAR(64) NOT NULL,
  score DECIMAL(6,2) NOT NULL DEFAULT 0,
  highlights TEXT NULL,
  concerns TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_performance_employee (employee_id),
  CONSTRAINT fk_performance_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_performance_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS message_templates (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(180) NOT NULL,
  occasion VARCHAR(120) NULL,
  channel VARCHAR(32) NOT NULL,
  style VARCHAR(32) NOT NULL,
  language VARCHAR(24) NOT NULL DEFAULT 'mr-IN',
  subject_template VARCHAR(255) NULL,
  body_template TEXT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY ux_message_templates_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS communication_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  related_type VARCHAR(64) NULL,
  related_id BIGINT UNSIGNED NULL,
  contact_name VARCHAR(180) NOT NULL,
  contact_phone VARCHAR(32) NULL,
  contact_email VARCHAR(190) NULL,
  channel VARCHAR(32) NOT NULL DEFAULT 'whatsapp',
  style VARCHAR(32) NULL,
  subject VARCHAR(255) NULL,
  body TEXT NOT NULL,
  direction VARCHAR(32) NOT NULL DEFAULT 'outbound',
  sent_at DATETIME NULL,
  follow_up_at DATETIME NULL,
  reminder_at DATETIME NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_communication_contact (contact_name),
  KEY idx_communication_status (status),
  CONSTRAINT fk_communication_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finance_entries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NULL,
  category VARCHAR(120) NOT NULL,
  entry_type VARCHAR(32) NOT NULL,
  subcategory VARCHAR(120) NULL,
  description TEXT NULL,
  amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  gst_enabled TINYINT(1) NOT NULL DEFAULT 0,
  gst_rate DECIMAL(6,2) NOT NULL DEFAULT 0,
  gst_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  bill_type VARCHAR(32) NOT NULL DEFAULT 'non-gst',
  payment_mode VARCHAR(32) NULL,
  entry_date DATE NULL,
  reference_no VARCHAR(120) NULL,
  vendor_name VARCHAR(180) NULL,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_finance_project (project_id),
  KEY idx_finance_type (entry_type),
  CONSTRAINT fk_finance_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS construction_sites (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NULL,
  name VARCHAR(180) NOT NULL,
  location VARCHAR(255) NULL,
  engineer_name VARCHAR(180) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  start_date DATE NULL,
  end_date DATE NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_construction_sites_project (project_id),
  CONSTRAINT fk_construction_sites_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS construction_entries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  site_id BIGINT UNSIGNED NOT NULL,
  category VARCHAR(32) NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(14,2) NOT NULL DEFAULT 0,
  rate DECIMAL(14,2) NOT NULL DEFAULT 0,
  amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  supplier_name VARCHAR(180) NULL,
  bill_number VARCHAR(120) NULL,
  payment_mode VARCHAR(32) NULL,
  entry_date DATE NULL,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_construction_entries_site (site_id),
  CONSTRAINT fk_construction_entries_site FOREIGN KEY (site_id) REFERENCES construction_sites(id) ON DELETE CASCADE,
  CONSTRAINT fk_construction_entries_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS development_sites (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NULL,
  name VARCHAR(180) NOT NULL,
  location VARCHAR(255) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_development_sites_project (project_id),
  CONSTRAINT fk_development_sites_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS development_entries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  site_id BIGINT UNSIGNED NOT NULL,
  work_type VARCHAR(120) NOT NULL,
  category VARCHAR(32) NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(14,2) NOT NULL DEFAULT 0,
  rate DECIMAL(14,2) NOT NULL DEFAULT 0,
  amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  vendor_name VARCHAR(180) NULL,
  bill_number VARCHAR(120) NULL,
  payment_mode VARCHAR(32) NULL,
  entry_date DATE NULL,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_development_entries_site (site_id),
  CONSTRAINT fk_development_entries_site FOREIGN KEY (site_id) REFERENCES development_sites(id) ON DELETE CASCADE,
  CONSTRAINT fk_development_entries_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS document_folders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  client_name VARCHAR(180) NOT NULL,
  client_type VARCHAR(64) NULL,
  project_id BIGINT UNSIGNED NULL,
  aadhar_url VARCHAR(500) NULL,
  pan_url VARCHAR(500) NULL,
  agreement_url VARCHAR(500) NULL,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_document_folders_project (project_id),
  CONSTRAINT fk_document_folders_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS documents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  folder_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  document_type VARCHAR(64) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(140) NULL,
  file_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
  uploaded_by BIGINT UNSIGNED NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_documents_folder (folder_id),
  CONSTRAINT fk_documents_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS branding_settings (
  id TINYINT UNSIGNED NOT NULL DEFAULT 1,
  company_name VARCHAR(180) NOT NULL,
  app_name VARCHAR(120) NOT NULL,
  gstin VARCHAR(64) NULL,
  location TEXT NULL,
  logo_url VARCHAR(255) NULL,
  theme_primary VARCHAR(32) NOT NULL DEFAULT '#111111',
  theme_accent VARCHAR(32) NOT NULL DEFAULT '#F26A1B',
  invoice_header VARCHAR(255) NULL,
  digital_signature_url VARCHAR(255) NULL,
  support_email VARCHAR(190) NULL,
  support_phone VARCHAR(64) NULL,
  whatsapp_number VARCHAR(64) NULL,
  locale_default VARCHAR(24) NOT NULL DEFAULT 'en-IN',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reminders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(190) NOT NULL,
  related_type VARCHAR(64) NULL,
  related_id BIGINT UNSIGNED NULL,
  remind_at DATETIME NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_reminders_time (remind_at),
  CONSTRAINT fk_reminders_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_user_id BIGINT UNSIGNED NULL,
  module_name VARCHAR(120) NOT NULL,
  action_name VARCHAR(120) NOT NULL,
  reference_id BIGINT UNSIGNED NULL,
  payload_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_actor (actor_user_id),
  CONSTRAINT fk_audit_user FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
