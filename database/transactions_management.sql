-- SQL: Create money_transactions table and add GST columns to advance_agreements

-- 1) Create new table for transaction management
CREATE TABLE IF NOT EXISTS money_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  created_by BIGINT UNSIGNED NULL,
  name VARCHAR(180) NOT NULL,
  mobile_number VARCHAR(32) NULL,
  transaction_type ENUM('income','expense','lent','borrowed') NOT NULL,
  amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  payment_mode ENUM('cash','bank','upi') NOT NULL DEFAULT 'cash',
  bank_name VARCHAR(140) NULL,
  account_number VARCHAR(64) NULL,
  transaction_id VARCHAR(128) NULL,
  date DATE NULL,
  due_date DATE NULL,
  description TEXT NULL,
  notes TEXT NULL,
  status ENUM('pending','paid') NOT NULL DEFAULT 'pending',
  reminder_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_money_transactions_type (transaction_type),
  KEY idx_money_transactions_status (status),
  KEY idx_money_transactions_date (date),
  CONSTRAINT fk_money_transactions_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) Alter advance_agreements to store GST details used in PDF memo
ALTER TABLE advance_agreements
  ADD COLUMN IF NOT EXISTS gst_enabled TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_number VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS owner_photo_url VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS owner_signature_url VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS company_signature_url VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(6,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_with_gst DECIMAL(14,2) NOT NULL DEFAULT 0;

-- Notes:
-- After running the ALTER statements, ensure your application logic sets `gst_enabled`, `gst_rate`, and
-- `gst_amount` (gst_amount = (total_amount * gst_rate) / 100) and `total_with_gst = total_amount + gst_amount`.
-- The `money_transactions` table is intentionally standalone to avoid disturbing existing `transactions` logic.
