-- ============================================================
-- Migration: 2026-05-08 Feature Updates
-- ============================================================
-- Run this file on your server BEFORE deploying the new code.
-- All statements use IF NOT EXISTS / IGNORE-safe patterns.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. development_entries — Add Labor fields
-- ──────────────────────────────────────────────────────────────

ALTER TABLE `development_entries`
  ADD COLUMN IF NOT EXISTS `labor_name` varchar(180) DEFAULT NULL COMMENT 'Labor-category: labor name',
  ADD COLUMN IF NOT EXISTS `labor_aadhaar_number` varchar(32) DEFAULT NULL COMMENT 'Labor-category: Aadhaar number',
  ADD COLUMN IF NOT EXISTS `labor_work_type` varchar(120) DEFAULT NULL COMMENT 'Labor-category: work type description',
  ADD COLUMN IF NOT EXISTS `attendance_type` varchar(32) DEFAULT NULL COMMENT 'Labor-category: full_day | half_day | overtime',
  ADD COLUMN IF NOT EXISTS `overtime_charges` decimal(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Labor-category: overtime pay',
  ADD COLUMN IF NOT EXISTS `total_salary` decimal(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Labor-category: total_days*rate_per_day + overtime_charges',
  ADD COLUMN IF NOT EXISTS `food_expense` decimal(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Labor-category: food expense',
  ADD COLUMN IF NOT EXISTS `travel_expense` decimal(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Labor-category: travel expense',
  ADD COLUMN IF NOT EXISTS `other_expense` decimal(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Labor-category: other miscellaneous expense',
  ADD COLUMN IF NOT EXISTS `labor_photo_url` varchar(500) DEFAULT NULL COMMENT 'Labor-category: labor photo',
  ADD COLUMN IF NOT EXISTS `aadhaar_upload_url` varchar(500) DEFAULT NULL COMMENT 'Labor-category: Aadhaar scan upload';

-- ──────────────────────────────────────────────────────────────
-- 2. document_folders — Add second identifier + PAN columns
-- ──────────────────────────────────────────────────────────────

ALTER TABLE `document_folders`
  ADD COLUMN IF NOT EXISTS `witness_1_pan_number` varchar(32) DEFAULT NULL COMMENT 'Witness 1 PAN card number',
  ADD COLUMN IF NOT EXISTS `witness_2_pan_number` varchar(32) DEFAULT NULL COMMENT 'Witness 2 PAN card number',
  ADD COLUMN IF NOT EXISTS `identifier_pan_number` varchar(32) DEFAULT NULL COMMENT 'Identifier 1 PAN card number',
  ADD COLUMN IF NOT EXISTS `identifier_2_name` varchar(180) DEFAULT NULL COMMENT 'Identifier 2 name',
  ADD COLUMN IF NOT EXISTS `identifier_2_aadhaar_number` varchar(32) DEFAULT NULL COMMENT 'Identifier 2 Aadhaar number',
  ADD COLUMN IF NOT EXISTS `identifier_2_pan_number` varchar(32) DEFAULT NULL COMMENT 'Identifier 2 PAN card number';

-- ──────────────────────────────────────────────────────────────
-- End of migration
-- ──────────────────────────────────────────────────────────────
