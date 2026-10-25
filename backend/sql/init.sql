CREATE DATABASE IF NOT EXISTS `GiriPremi`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `GiriPremi`;

CREATE TABLE IF NOT EXISTS `store` (
  `id` BIGINT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `contact_person` VARCHAR(100),
  `contact_number` VARCHAR(20),
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_store_name` (`name`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `category` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `parent_category_type` VARCHAR(50),
  `tracking_type` VARCHAR(50) NOT NULL,
  `requires_inspection` BOOLEAN DEFAULT FALSE,
  `inspection_frequency_months` INT,
  `product_life_year` DECIMAL(3,1),
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_category_name` (`name`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `user_details` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(100),
  `password` VARCHAR(255),
  `full_name` VARCHAR(200) NOT NULL,
  `contact_number` VARCHAR(20),
  `user_type` VARCHAR(50) NOT NULL,
  `address` TEXT,
  `type` VARCHAR(50),
  `id_proof_type` VARCHAR(50),
  `id_proof_number` VARCHAR(100),
  `total_issues` INT NOT NULL DEFAULT 0,
  `total_penalties` INT NOT NULL DEFAULT 0,
  `total_penalty_amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_email` (`email`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `equipment` (
  `id` VARCHAR(36) NOT NULL,
  `equipment_name` VARCHAR(200) NOT NULL,
  `category_id` INT NOT NULL,
  `date_of_manufacturing` DATE,
  `date_of_expiry` DATE,
  `purchase_date` DATE,
  `brand` VARCHAR(100),
  `description` TEXT,
  `current_store_id` BIGINT,
  `is_available` BOOLEAN DEFAULT TRUE,
  `general_remark` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_equipment_category` (`category_id`),
  KEY `idx_equipment_store` (`current_store_id`),
  CONSTRAINT `fk_equipment_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_equipment_store` FOREIGN KEY (`current_store_id`) REFERENCES `store` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `equipment_qty` (
  `id` VARCHAR(36) NOT NULL,
  `equipment_id` VARCHAR(36) NOT NULL,
  `store_id` BIGINT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  `curr_condition` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_equipment_qty_equipment` (`equipment_id`),
  KEY `idx_equipment_qty_store` (`store_id`),
  CONSTRAINT `fk_equipment_qty_equipment` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_equipment_qty_store` FOREIGN KEY (`store_id`) REFERENCES `store` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `order_details` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT,
  `approved_by_user_id` INT,
  `issued_to_name` VARCHAR(100),
  `approved_by_name` VARCHAR(100),
  `issue_date` DATE NOT NULL,
  `expected_return_date` DATE,
  `purpose` VARCHAR(50),
  `purpose_details` TEXT,
  `status` VARCHAR(50) DEFAULT 'PENDING',
  `actual_return_date` DATE,
  `remarks` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_user` (`user_id`),
  KEY `idx_order_approver` (`approved_by_user_id`),
  CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `user_details` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_approver` FOREIGN KEY (`approved_by_user_id`) REFERENCES `user_details` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `order_id` INT NOT NULL,
  `equipment_id` VARCHAR(36) NOT NULL,
  `store_id` BIGINT NOT NULL,
  `return_condition` VARCHAR(50),
  `quantity_issued` INT DEFAULT 0,
  `quantity_returned` INT DEFAULT 0,
  `quantity_pending` INT DEFAULT 0,
  `quantity_lost` INT DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order` (`order_id`),
  KEY `idx_order_items_equipment` (`equipment_id`),
  KEY `idx_order_items_store` (`store_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `order_details` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_equipment` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_store` FOREIGN KEY (`store_id`) REFERENCES `store` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;
