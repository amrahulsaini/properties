-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 09, 2026 at 11:00 AM
-- Server version: 10.11.15-MariaDB-ubu2204
-- PHP Version: 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `loop_properties`
--

-- --------------------------------------------------------

--
-- Table structure for table `advance_agreements`
--

CREATE TABLE `advance_agreements` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `plot_id` bigint(20) UNSIGNED DEFAULT NULL,
  `project_id` bigint(20) UNSIGNED DEFAULT NULL,
  `owner_name` varchar(180) NOT NULL,
  `owner_phone` varchar(32) DEFAULT NULL,
  `owner_email` varchar(190) DEFAULT NULL,
  `village` varchar(140) NOT NULL,
  `survey_number` varchar(120) NOT NULL,
  `area_sqft` decimal(14,2) DEFAULT NULL,
  `total_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `paid_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `remaining_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `payment_mode` varchar(32) DEFAULT NULL,
  `refundable` tinyint(1) NOT NULL DEFAULT 0,
  `agreement_duration_days` int(11) NOT NULL DEFAULT 0,
  `conditions_text` text DEFAULT NULL,
  `inspection_rights` text DEFAULT NULL,
  `agreement_at` datetime DEFAULT NULL,
  `pdf_url` varchar(255) DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `gst_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `gst_number` varchar(64) DEFAULT NULL,
  `gst_rate` decimal(6,2) NOT NULL DEFAULT 0.00,
  `gst_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total_with_gst` decimal(14,2) NOT NULL DEFAULT 0.00,
  `owner_photo_url` varchar(255) DEFAULT NULL,
  `owner_signature_url` varchar(255) DEFAULT NULL,
  `company_signature_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `advance_bookings`
--

CREATE TABLE `advance_bookings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `plot_id` bigint(20) UNSIGNED DEFAULT NULL,
  `project_id` bigint(20) UNSIGNED DEFAULT NULL,
  `customer_name` varchar(180) NOT NULL,
  `seller_name` varchar(180) DEFAULT NULL,
  `customer_phone` varchar(32) DEFAULT NULL,
  `customer_email` varchar(190) DEFAULT NULL,
  `village` varchar(140) NOT NULL,
  `survey_number` varchar(120) NOT NULL,
  `area_sqft` decimal(14,2) DEFAULT NULL,
  `total_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `advance_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `remaining_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `payment_mode` varchar(32) DEFAULT NULL,
  `payment_at` datetime DEFAULT NULL,
  `customer_signature_url` varchar(255) DEFAULT NULL,
  `company_signature_url` varchar(255) DEFAULT NULL,
  `gst_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `gst_number` varchar(64) DEFAULT NULL,
  `memo_number` varchar(80) DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'confirmed',
  `message_status` varchar(32) NOT NULL DEFAULT 'pending',
  `pdf_url` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `agents`
--

CREATE TABLE `agents` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(180) NOT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `email` varchar(190) DEFAULT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `signature_url` varchar(255) DEFAULT NULL,
  `bank_name` varchar(140) DEFAULT NULL,
  `account_number` varchar(80) DEFAULT NULL,
  `ifsc_code` varchar(32) DEFAULT NULL,
  `upi_id` varchar(120) DEFAULT NULL,
  `commission_percent` decimal(8,2) NOT NULL DEFAULT 0.00,
  `commission_fixed` decimal(14,2) NOT NULL DEFAULT 0.00,
  `address` text DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `agent_commissions`
--

CREATE TABLE `agent_commissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `agent_id` bigint(20) UNSIGNED NOT NULL,
  `transaction_id` bigint(20) UNSIGNED DEFAULT NULL,
  `project_id` bigint(20) UNSIGNED DEFAULT NULL,
  `month_label` varchar(32) DEFAULT NULL,
  `commission_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `paid_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `pending_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `status` varchar(32) NOT NULL DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance_entries`
--

CREATE TABLE `attendance_entries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `attendance_date` date NOT NULL,
  `check_in_at` datetime DEFAULT NULL,
  `check_out_at` datetime DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `location_label` varchar(255) DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'present',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `actor_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `module_name` varchar(120) NOT NULL,
  `action_name` varchar(120) NOT NULL,
  `reference_id` bigint(20) UNSIGNED DEFAULT NULL,
  `payload_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload_json`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `branding_settings`
--

CREATE TABLE `branding_settings` (
  `id` tinyint(3) UNSIGNED NOT NULL DEFAULT 1,
  `company_name` varchar(180) NOT NULL,
  `app_name` varchar(120) NOT NULL,
  `gstin` varchar(64) DEFAULT NULL,
  `location` text DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `theme_primary` varchar(32) NOT NULL DEFAULT '#111111',
  `theme_accent` varchar(32) NOT NULL DEFAULT '#F26A1B',
  `invoice_header` varchar(255) DEFAULT NULL,
  `digital_signature_url` varchar(255) DEFAULT NULL,
  `support_email` varchar(190) DEFAULT NULL,
  `support_phone` varchar(64) DEFAULT NULL,
  `whatsapp_number` varchar(64) DEFAULT NULL,
  `locale_default` varchar(24) NOT NULL DEFAULT 'en-IN',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `communication_logs`
--

CREATE TABLE `communication_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `related_type` varchar(64) DEFAULT NULL,
  `related_id` bigint(20) UNSIGNED DEFAULT NULL,
  `contact_name` varchar(180) NOT NULL,
  `contact_phone` varchar(32) DEFAULT NULL,
  `contact_email` varchar(190) DEFAULT NULL,
  `channel` varchar(32) NOT NULL DEFAULT 'whatsapp',
  `style` varchar(32) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `body` text NOT NULL,
  `direction` varchar(32) NOT NULL DEFAULT 'outbound',
  `sent_at` datetime DEFAULT NULL,
  `follow_up_at` datetime DEFAULT NULL,
  `reminder_at` datetime DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `construction_entries`
--

CREATE TABLE `construction_entries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED NOT NULL,
  `category` varchar(32) NOT NULL,
  `description` text NOT NULL,
  `quantity` decimal(14,2) NOT NULL DEFAULT 0.00,
  `rate` decimal(14,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `supplier_name` varchar(180) DEFAULT NULL,
  `bill_number` varchar(120) DEFAULT NULL,
  `payment_mode` varchar(32) DEFAULT NULL,
  `entry_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `construction_sites`
--

CREATE TABLE `construction_sites` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(180) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `engineer_name` varchar(180) DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `development_entries`
--

CREATE TABLE `development_entries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `site_id` bigint(20) UNSIGNED NOT NULL,
  `jcb_number` varchar(120) DEFAULT NULL,
  `tractor_number` varchar(120) DEFAULT NULL,
  `damper_number` varchar(120) DEFAULT NULL,
  `owner_name` varchar(180) DEFAULT NULL,
  `driver_name` varchar(180) DEFAULT NULL,
  `mobile_number` varchar(32) DEFAULT NULL,
  `rent_type` varchar(32) DEFAULT NULL,
  `amount_mode` varchar(32) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `stop_time` time DEFAULT NULL,
  `total_days` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_trips` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `rate_per_day` decimal(14,2) NOT NULL DEFAULT 0.00,
  `rate_per_hour` decimal(14,2) NOT NULL DEFAULT 0.00,
  `rate_per_trip` decimal(14,2) NOT NULL DEFAULT 0.00,
  `advance_diesel` decimal(14,2) NOT NULL DEFAULT 0.00,
  `diesel_given` decimal(14,2) NOT NULL DEFAULT 0.00,
  `diesel_cost` decimal(14,2) NOT NULL DEFAULT 0.00,
  `advance_paid` decimal(14,2) NOT NULL DEFAULT 0.00,
  `remaining_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `payment_status` varchar(32) NOT NULL DEFAULT 'pending',
  `work_type` varchar(120) DEFAULT NULL,
  `construction_material` varchar(180) DEFAULT NULL,
  `work_location` varchar(255) DEFAULT NULL,
  `gps_location` varchar(255) DEFAULT NULL,
  `loading_point` varchar(255) DEFAULT NULL,
  `unloading_point` varchar(255) DEFAULT NULL,
  `work_description` text DEFAULT NULL,
  `working_photo_url` varchar(500) DEFAULT NULL,
  `before_photo_url` varchar(500) DEFAULT NULL,
  `after_photo_url` varchar(500) DEFAULT NULL,
  `signature_url` varchar(500) DEFAULT NULL,
  `category` varchar(32) NOT NULL,
  `description` text DEFAULT NULL,
  `quantity` decimal(14,2) NOT NULL DEFAULT 0.00,
  `rate` decimal(14,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `vendor_name` varchar(180) DEFAULT NULL,
  `bill_number` varchar(120) DEFAULT NULL,
  `payment_mode` varchar(32) DEFAULT NULL,
  `entry_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `development_sites`
--

CREATE TABLE `development_sites` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(180) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `folder_id` bigint(20) UNSIGNED NOT NULL,
  `section` varchar(64) DEFAULT NULL,
  `party_name` varchar(180) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `title` varchar(180) NOT NULL,
  `document_type` varchar(64) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `mime_type` varchar(140) DEFAULT NULL,
  `file_size` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
  `uploaded_by` bigint(20) UNSIGNED DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `document_folders`
--

CREATE TABLE `document_folders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `client_name` varchar(180) NOT NULL,
  `client_type` varchar(64) DEFAULT NULL,
  `project_id` bigint(20) UNSIGNED DEFAULT NULL,
  `folder_code` varchar(64) DEFAULT NULL,
  `folder_label` varchar(255) DEFAULT NULL,
  `plot_number` varchar(120) DEFAULT NULL,
  `buyer_name` varchar(180) DEFAULT NULL,
  `buyer_mobile_number` varchar(32) DEFAULT NULL,
  `buyer_aadhaar_number` varchar(32) DEFAULT NULL,
  `buyer_pan_number` varchar(32) DEFAULT NULL,
  `seller_name` varchar(180) DEFAULT NULL,
  `seller_mobile_number` varchar(32) DEFAULT NULL,
  `seller_aadhaar_number` varchar(32) DEFAULT NULL,
  `seller_pan_number` varchar(32) DEFAULT NULL,
  `witness_1_name` varchar(180) DEFAULT NULL,
  `witness_1_aadhaar_number` varchar(32) DEFAULT NULL,
  `witness_2_name` varchar(180) DEFAULT NULL,
  `witness_2_aadhaar_number` varchar(32) DEFAULT NULL,
  `identifier_name` varchar(180) DEFAULT NULL,
  `identifier_mobile_number` varchar(32) DEFAULT NULL,
  `identifier_aadhaar_number` varchar(32) DEFAULT NULL,
  `print_layout` varchar(32) NOT NULL DEFAULT 'a4',
  `aadhaar_layout` varchar(32) NOT NULL DEFAULT 'single-page',
  `page_orientation` varchar(16) NOT NULL DEFAULT 'portrait',
  `dpi_quality` varchar(32) NOT NULL DEFAULT 'standard',
  `color_mode` varchar(32) NOT NULL DEFAULT 'color',
  `export_type` varchar(32) NOT NULL DEFAULT 'pdf',
  `admin_lock` tinyint(1) NOT NULL DEFAULT 0,
  `is_hidden` tinyint(1) NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(180) NOT NULL,
  `role_title` varchar(120) NOT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `email` varchar(190) DEFAULT NULL,
  `salary_type` varchar(32) DEFAULT NULL,
  `monthly_salary` decimal(14,2) NOT NULL DEFAULT 0.00,
  `joining_date` date DEFAULT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `signature_url` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `location_tracking_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `finance_entries`
--

CREATE TABLE `finance_entries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED DEFAULT NULL,
  `category` varchar(120) NOT NULL,
  `entry_type` varchar(32) NOT NULL,
  `subcategory` varchar(120) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `gst_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `gst_rate` decimal(6,2) NOT NULL DEFAULT 0.00,
  `gst_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `bill_type` varchar(32) NOT NULL DEFAULT 'non-gst',
  `payment_mode` varchar(32) DEFAULT NULL,
  `entry_date` date DEFAULT NULL,
  `reference_no` varchar(120) DEFAULT NULL,
  `vendor_name` varchar(180) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `message_templates`
--

CREATE TABLE `message_templates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(180) NOT NULL,
  `occasion` varchar(120) DEFAULT NULL,
  `channel` varchar(32) NOT NULL,
  `style` varchar(32) NOT NULL,
  `language` varchar(24) NOT NULL DEFAULT 'mr-IN',
  `subject_template` varchar(255) DEFAULT NULL,
  `body_template` text NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `money_transactions`
--

CREATE TABLE `money_transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(180) NOT NULL,
  `mobile_number` varchar(32) DEFAULT NULL,
  `transaction_type` enum('income','expense','lent','borrowed') NOT NULL,
  `amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `payment_mode` enum('cash','bank','upi') NOT NULL DEFAULT 'cash',
  `bank_name` varchar(140) DEFAULT NULL,
  `account_number` varchar(64) DEFAULT NULL,
  `transaction_id` varchar(128) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `description` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('pending','paid') NOT NULL DEFAULT 'pending',
  `reminder_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `performance_entries`
--

CREATE TABLE `performance_entries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `review_period` varchar(64) NOT NULL,
  `score` decimal(6,2) NOT NULL DEFAULT 0.00,
  `highlights` text DEFAULT NULL,
  `concerns` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `plots`
--

CREATE TABLE `plots` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED DEFAULT NULL,
  `village` varchar(140) NOT NULL,
  `survey_number` varchar(120) NOT NULL,
  `area_sqft` decimal(14,2) NOT NULL DEFAULT 0.00,
  `price` decimal(14,2) NOT NULL DEFAULT 0.00,
  `location_text` varchar(255) DEFAULT NULL,
  `map_url` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'available',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(180) NOT NULL,
  `code` varchar(64) DEFAULT NULL,
  `type` varchar(32) NOT NULL DEFAULT 'plot',
  `village` varchar(140) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reminders`
--

CREATE TABLE `reminders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(190) NOT NULL,
  `related_type` varchar(64) DEFAULT NULL,
  `related_id` bigint(20) UNSIGNED DEFAULT NULL,
  `remind_at` datetime NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `salary_entries`
--

CREATE TABLE `salary_entries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `month_label` varchar(32) NOT NULL,
  `base_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `bonus_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `deduction_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `net_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `paid_at` datetime DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `plot_id` bigint(20) UNSIGNED DEFAULT NULL,
  `project_id` bigint(20) UNSIGNED DEFAULT NULL,
  `transaction_type` varchar(32) NOT NULL,
  `counterparty_name` varchar(180) NOT NULL,
  `counterparty_phone` varchar(32) DEFAULT NULL,
  `counterparty_email` varchar(190) DEFAULT NULL,
  `counterparty_photo_url` varchar(255) DEFAULT NULL,
  `counterparty_signature_url` varchar(255) DEFAULT NULL,
  `village` varchar(140) NOT NULL,
  `survey_number` varchar(120) NOT NULL,
  `area_sqft` decimal(14,2) DEFAULT NULL,
  `payment_mode` varchar(32) DEFAULT NULL,
  `base_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `expense_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `gst_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `gst_rate` decimal(6,2) NOT NULL DEFAULT 0.00,
  `gst_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `profit_loss` decimal(14,2) NOT NULL DEFAULT 0.00,
  `transacted_at` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `gst_number` varchar(64) DEFAULT NULL,
  `bank_name` varchar(140) DEFAULT NULL,
  `account_number` varchar(64) DEFAULT NULL,
  `transaction_id` varchar(128) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `reminder_at` datetime DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'pending',
  `pdf_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `full_name` varchar(160) NOT NULL,
  `email` varchar(190) NOT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `role` varchar(32) NOT NULL DEFAULT 'agent',
  `password_hash` varchar(255) NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `avatar_url` varchar(255) DEFAULT NULL,
  `signature_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `advance_agreements`
--
ALTER TABLE `advance_agreements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_agreements_plot` (`plot_id`),
  ADD KEY `idx_agreements_project` (`project_id`),
  ADD KEY `fk_agreements_user` (`created_by`);

--
-- Indexes for table `advance_bookings`
--
ALTER TABLE `advance_bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_bookings_plot` (`plot_id`),
  ADD KEY `idx_bookings_project` (`project_id`),
  ADD KEY `idx_bookings_customer` (`customer_name`),
  ADD KEY `fk_bookings_user` (`created_by`),
  ADD KEY `idx_bookings_seller` (`seller_name`);

--
-- Indexes for table `agents`
--
ALTER TABLE `agents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_agents_user` (`user_id`);

--
-- Indexes for table `agent_commissions`
--
ALTER TABLE `agent_commissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_agent_commissions_agent` (`agent_id`),
  ADD KEY `fk_agent_commissions_transaction` (`transaction_id`),
  ADD KEY `fk_agent_commissions_project` (`project_id`);

--
-- Indexes for table `attendance_entries`
--
ALTER TABLE `attendance_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_attendance_employee` (`employee_id`),
  ADD KEY `idx_attendance_date` (`attendance_date`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_actor` (`actor_user_id`);

--
-- Indexes for table `branding_settings`
--
ALTER TABLE `branding_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `communication_logs`
--
ALTER TABLE `communication_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_communication_contact` (`contact_name`),
  ADD KEY `idx_communication_status` (`status`),
  ADD KEY `fk_communication_creator` (`created_by`);

--
-- Indexes for table `construction_entries`
--
ALTER TABLE `construction_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_construction_entries_site` (`site_id`),
  ADD KEY `fk_construction_entries_creator` (`created_by`);

--
-- Indexes for table `construction_sites`
--
ALTER TABLE `construction_sites`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_construction_sites_project` (`project_id`);

--
-- Indexes for table `development_entries`
--
ALTER TABLE `development_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_development_entries_site` (`site_id`),
  ADD KEY `fk_development_entries_creator` (`created_by`),
  ADD KEY `idx_development_entries_category` (`category`),
  ADD KEY `idx_development_entries_payment` (`payment_status`);

--
-- Indexes for table `development_sites`
--
ALTER TABLE `development_sites`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_development_sites_project` (`project_id`);

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_documents_folder` (`folder_id`),
  ADD KEY `fk_documents_user` (`uploaded_by`),
  ADD KEY `idx_documents_section` (`section`);

--
-- Indexes for table `document_folders`
--
ALTER TABLE `document_folders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ux_document_folders_code` (`folder_code`),
  ADD KEY `idx_document_folders_project` (`project_id`),
  ADD KEY `fk_document_folders_creator` (`created_by`),
  ADD KEY `idx_document_folders_plot` (`plot_number`),
  ADD KEY `idx_document_folders_buyer_mobile` (`buyer_mobile_number`),
  ADD KEY `idx_document_folders_buyer_aadhaar` (`buyer_aadhaar_number`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_employees_user` (`user_id`),
  ADD KEY `fk_employees_creator` (`created_by`);

--
-- Indexes for table `finance_entries`
--
ALTER TABLE `finance_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_finance_project` (`project_id`),
  ADD KEY `idx_finance_type` (`entry_type`),
  ADD KEY `fk_finance_creator` (`created_by`);

--
-- Indexes for table `message_templates`
--
ALTER TABLE `message_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ux_message_templates_title` (`title`);

--
-- Indexes for table `money_transactions`
--
ALTER TABLE `money_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_money_transactions_type` (`transaction_type`),
  ADD KEY `idx_money_transactions_status` (`status`),
  ADD KEY `idx_money_transactions_date` (`date`),
  ADD KEY `fk_money_transactions_creator` (`created_by`);

--
-- Indexes for table `performance_entries`
--
ALTER TABLE `performance_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_performance_employee` (`employee_id`),
  ADD KEY `fk_performance_creator` (`created_by`);

--
-- Indexes for table `plots`
--
ALTER TABLE `plots`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_plots_project` (`project_id`),
  ADD KEY `idx_plots_status` (`status`),
  ADD KEY `idx_plots_village` (`village`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_projects_type` (`type`),
  ADD KEY `idx_projects_village` (`village`);

--
-- Indexes for table `reminders`
--
ALTER TABLE `reminders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reminders_time` (`remind_at`),
  ADD KEY `fk_reminders_creator` (`created_by`);

--
-- Indexes for table `salary_entries`
--
ALTER TABLE `salary_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_salary_employee` (`employee_id`),
  ADD KEY `fk_salary_creator` (`created_by`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_transactions_plot` (`plot_id`),
  ADD KEY `idx_transactions_project` (`project_id`),
  ADD KEY `idx_transactions_type` (`transaction_type`),
  ADD KEY `idx_transactions_village` (`village`),
  ADD KEY `fk_transactions_user` (`created_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ux_users_email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `advance_agreements`
--
ALTER TABLE `advance_agreements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `advance_bookings`
--
ALTER TABLE `advance_bookings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `agents`
--
ALTER TABLE `agents`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `agent_commissions`
--
ALTER TABLE `agent_commissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendance_entries`
--
ALTER TABLE `attendance_entries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `communication_logs`
--
ALTER TABLE `communication_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `construction_entries`
--
ALTER TABLE `construction_entries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `construction_sites`
--
ALTER TABLE `construction_sites`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `development_entries`
--
ALTER TABLE `development_entries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `development_sites`
--
ALTER TABLE `development_sites`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `documents`
--
ALTER TABLE `documents`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `document_folders`
--
ALTER TABLE `document_folders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `finance_entries`
--
ALTER TABLE `finance_entries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `message_templates`
--
ALTER TABLE `message_templates`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `money_transactions`
--
ALTER TABLE `money_transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `performance_entries`
--
ALTER TABLE `performance_entries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `plots`
--
ALTER TABLE `plots`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reminders`
--
ALTER TABLE `reminders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `salary_entries`
--
ALTER TABLE `salary_entries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `advance_agreements`
--
ALTER TABLE `advance_agreements`
  ADD CONSTRAINT `fk_agreements_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `advance_bookings`
--
ALTER TABLE `advance_bookings`
  ADD CONSTRAINT `fk_bookings_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `agents`
--
ALTER TABLE `agents`
  ADD CONSTRAINT `fk_agents_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `agent_commissions`
--
ALTER TABLE `agent_commissions`
  ADD CONSTRAINT `fk_agent_commissions_agent` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_agent_commissions_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_agent_commissions_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `attendance_entries`
--
ALTER TABLE `attendance_entries`
  ADD CONSTRAINT `fk_attendance_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `fk_audit_user` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `communication_logs`
--
ALTER TABLE `communication_logs`
  ADD CONSTRAINT `fk_communication_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `construction_entries`
--
ALTER TABLE `construction_entries`
  ADD CONSTRAINT `fk_construction_entries_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_construction_entries_site` FOREIGN KEY (`site_id`) REFERENCES `construction_sites` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `construction_sites`
--
ALTER TABLE `construction_sites`
  ADD CONSTRAINT `fk_construction_sites_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `development_entries`
--
ALTER TABLE `development_entries`
  ADD CONSTRAINT `fk_development_entries_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_development_entries_site` FOREIGN KEY (`site_id`) REFERENCES `development_sites` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `development_sites`
--
ALTER TABLE `development_sites`
  ADD CONSTRAINT `fk_development_sites_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `fk_documents_user` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `document_folders`
--
ALTER TABLE `document_folders`
  ADD CONSTRAINT `fk_document_folders_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `fk_employees_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_employees_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `finance_entries`
--
ALTER TABLE `finance_entries`
  ADD CONSTRAINT `fk_finance_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `money_transactions`
--
ALTER TABLE `money_transactions`
  ADD CONSTRAINT `fk_money_transactions_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `performance_entries`
--
ALTER TABLE `performance_entries`
  ADD CONSTRAINT `fk_performance_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_performance_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reminders`
--
ALTER TABLE `reminders`
  ADD CONSTRAINT `fk_reminders_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `salary_entries`
--
ALTER TABLE `salary_entries`
  ADD CONSTRAINT `fk_salary_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_salary_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `fk_transactions_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;