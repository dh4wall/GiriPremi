USE `GiriPremi`;

-- Demo/admin users. Password hashes correspond to the documented demo credentials.
INSERT INTO `user_details`
  (`email`, `password`, `full_name`, `contact_number`, `user_type`, `is_active`)
SELECT 'demo.admin@giripremi.com', '$2b$12$GljkC1iOgC0ZVLawIMaRe.9I4ks.wPX.DxPUQ/7bJpSeBJJqJhx/6', 'Demo Super Admin', '', 'superAdmin', TRUE
WHERE NOT EXISTS (SELECT 1 FROM `user_details` WHERE `email` = 'demo.admin@giripremi.com');

INSERT INTO `user_details`
  (`email`, `password`, `full_name`, `contact_number`, `user_type`, `is_active`)
SELECT 'demo.store@giripremi.com', '$2b$12$hDHkiLN2tgdflD21scz41uglyDc8Rs.Zk4Et.2X/Hp2uQbXBb0urC', 'Demo Store Admin', '', 'storeAdmin', TRUE
WHERE NOT EXISTS (SELECT 1 FROM `user_details` WHERE `email` = 'demo.store@giripremi.com');

INSERT INTO `user_details`
  (`email`, `full_name`, `contact_number`, `user_type`, `id_proof_type`, `id_proof_number`, `total_issues`, `total_penalties`, `total_penalty_amount`, `is_active`)
SELECT 'arjun.patil@example.com', 'Arjun Patil', '+91 9876543210', 'member', 'Aadhaar', 'XXXX-XXXX-1201', 0, 0, 0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM `user_details` WHERE `email` = 'arjun.patil@example.com');

INSERT INTO `user_details`
  (`email`, `full_name`, `contact_number`, `user_type`, `id_proof_type`, `id_proof_number`, `total_issues`, `total_penalties`, `total_penalty_amount`, `is_active`)
SELECT 'neha.sharma@example.com', 'Neha Sharma', '+91 9876543211', 'member', 'Aadhaar', 'XXXX-XXXX-1202', 0, 0, 0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM `user_details` WHERE `email` = 'neha.sharma@example.com');

INSERT INTO `user_details`
  (`email`, `full_name`, `contact_number`, `user_type`, `id_proof_type`, `id_proof_number`, `total_issues`, `total_penalties`, `total_penalty_amount`, `is_active`)
SELECT 'rohan.kulkarni@example.com', 'Rohan Kulkarni', '+91 9876543212', 'member', 'Passport', 'P-XXXX1203', 0, 0, 0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM `user_details` WHERE `email` = 'rohan.kulkarni@example.com');

INSERT INTO `store` (`id`, `name`, `contact_person`, `contact_number`, `is_active`)
SELECT 11, 'Demo Equipment Store', 'Maya Joshi', '+91 9876500001', TRUE
WHERE NOT EXISTS (SELECT 1 FROM `store` WHERE `id` = 11);

INSERT INTO `store` (`id`, `name`, `contact_person`, `contact_number`, `is_active`)
SELECT 12, 'Demo Base Camp', 'Vikram More', '+91 9876500002', TRUE
WHERE NOT EXISTS (SELECT 1 FROM `store` WHERE `id` = 12);

INSERT INTO `category`
  (`id`, `name`, `parent_category_type`, `tracking_type`, `requires_inspection`, `inspection_frequency_months`, `product_life_year`, `description`)
SELECT 101, 'Climbing Ropes', 'Climbing', 'QUANTITY', TRUE, 6, 5.0, 'Dynamic and static ropes for climbing and rescue.'
WHERE NOT EXISTS (SELECT 1 FROM `category` WHERE `id` = 101);

INSERT INTO `category`
  (`id`, `name`, `parent_category_type`, `tracking_type`, `requires_inspection`, `inspection_frequency_months`, `product_life_year`, `description`)
SELECT 102, 'Safety Helmets', 'Safety', 'QUANTITY', TRUE, 12, 5.0, 'Protective helmets for climbing and field operations.'
WHERE NOT EXISTS (SELECT 1 FROM `category` WHERE `id` = 102);

INSERT INTO `category`
  (`id`, `name`, `parent_category_type`, `tracking_type`, `requires_inspection`, `inspection_frequency_months`, `product_life_year`, `description`)
SELECT 103, 'Harnesses', 'Climbing', 'QUANTITY', TRUE, 6, 5.0, 'Sit and chest harnesses for mountaineering activities.'
WHERE NOT EXISTS (SELECT 1 FROM `category` WHERE `id` = 103);

INSERT INTO `category`
  (`id`, `name`, `parent_category_type`, `tracking_type`, `requires_inspection`, `inspection_frequency_months`, `product_life_year`, `description`)
SELECT 104, 'Camp Equipment', 'Camping', 'QUANTITY', FALSE, NULL, 8.0, 'Tents, stoves, and other expedition equipment.'
WHERE NOT EXISTS (SELECT 1 FROM `category` WHERE `id` = 104);

INSERT INTO `equipment`
  (`id`, `equipment_name`, `category_id`, `date_of_manufacturing`, `date_of_expiry`, `purchase_date`, `brand`, `description`, `current_store_id`, `is_available`, `general_remark`)
SELECT 'seed-rope-001', 'Dynamic Climbing Rope 60m', 101, '2024-01-15', '2029-01-15', '2024-02-10', 'Mammut', 'Blue 60 metre dynamic rope.', 11, TRUE, 'Demo stock'
WHERE NOT EXISTS (SELECT 1 FROM `equipment` WHERE `id` = 'seed-rope-001');

INSERT INTO `equipment`
  (`id`, `equipment_name`, `category_id`, `date_of_manufacturing`, `date_of_expiry`, `purchase_date`, `brand`, `description`, `current_store_id`, `is_available`, `general_remark`)
SELECT 'seed-helmet-001', 'Mountaineering Helmet', 102, '2023-08-20', '2028-08-20', '2023-10-01', 'Petzl', 'Adjustable white safety helmet.', 11, TRUE, 'Demo stock'
WHERE NOT EXISTS (SELECT 1 FROM `equipment` WHERE `id` = 'seed-helmet-001');

INSERT INTO `equipment`
  (`id`, `equipment_name`, `category_id`, `date_of_manufacturing`, `date_of_expiry`, `purchase_date`, `brand`, `description`, `current_store_id`, `is_available`, `general_remark`)
SELECT 'seed-harness-001', 'Adjustable Sit Harness', 103, '2024-03-12', '2029-03-12', '2024-04-02', 'Black Diamond', 'Adjustable harness for training and expeditions.', 12, TRUE, 'Demo stock'
WHERE NOT EXISTS (SELECT 1 FROM `equipment` WHERE `id` = 'seed-harness-001');

INSERT INTO `equipment`
  (`id`, `equipment_name`, `category_id`, `date_of_manufacturing`, `date_of_expiry`, `purchase_date`, `brand`, `description`, `current_store_id`, `is_available`, `general_remark`)
SELECT 'seed-tent-001', 'Four Person Expedition Tent', 104, '2023-05-10', '2031-05-10', '2023-06-18', 'MSR', 'Four person high-altitude expedition tent.', 12, TRUE, 'Demo stock'
WHERE NOT EXISTS (SELECT 1 FROM `equipment` WHERE `id` = 'seed-tent-001');

INSERT INTO `equipment_qty` (`id`, `equipment_id`, `store_id`, `quantity`, `curr_condition`)
SELECT 'seed-qty-001', 'seed-rope-001', 11, 8, 'NEW'
WHERE NOT EXISTS (SELECT 1 FROM `equipment_qty` WHERE `id` = 'seed-qty-001');

INSERT INTO `equipment_qty` (`id`, `equipment_id`, `store_id`, `quantity`, `curr_condition`)
SELECT 'seed-qty-002', 'seed-rope-001', 12, 3, 'MODERATE'
WHERE NOT EXISTS (SELECT 1 FROM `equipment_qty` WHERE `id` = 'seed-qty-002');

INSERT INTO `equipment_qty` (`id`, `equipment_id`, `store_id`, `quantity`, `curr_condition`)
SELECT 'seed-qty-003', 'seed-helmet-001', 11, 12, 'NEW'
WHERE NOT EXISTS (SELECT 1 FROM `equipment_qty` WHERE `id` = 'seed-qty-003');

INSERT INTO `equipment_qty` (`id`, `equipment_id`, `store_id`, `quantity`, `curr_condition`)
SELECT 'seed-qty-004', 'seed-harness-001', 12, 6, 'NEW'
WHERE NOT EXISTS (SELECT 1 FROM `equipment_qty` WHERE `id` = 'seed-qty-004');

INSERT INTO `equipment_qty` (`id`, `equipment_id`, `store_id`, `quantity`, `curr_condition`)
SELECT 'seed-qty-005', 'seed-tent-001', 12, 4, 'MODERATE'
WHERE NOT EXISTS (SELECT 1 FROM `equipment_qty` WHERE `id` = 'seed-qty-005');

INSERT INTO `order_details`
  (`id`, `user_id`, `approved_by_user_id`, `issued_to_name`, `approved_by_name`, `issue_date`, `expected_return_date`, `purpose`, `purpose_details`, `status`, `remarks`)
SELECT 1001,
  (SELECT `id` FROM `user_details` WHERE `email` = 'arjun.patil@example.com'),
  (SELECT `id` FROM `user_details` WHERE `email` = 'demo.store@giripremi.com'),
  'Arjun Patil', 'Demo Store Admin', '2026-10-18', '2026-10-25', 'Training', 'Weekend climbing practice at the local crag.', 'ISSUED', 'Demo active issue'
WHERE NOT EXISTS (SELECT 1 FROM `order_details` WHERE `id` = 1001);

INSERT INTO `order_details`
  (`id`, `user_id`, `approved_by_user_id`, `issued_to_name`, `approved_by_name`, `issue_date`, `expected_return_date`, `purpose`, `purpose_details`, `status`, `actual_return_date`, `remarks`)
SELECT 1002,
  (SELECT `id` FROM `user_details` WHERE `email` = 'neha.sharma@example.com'),
  (SELECT `id` FROM `user_details` WHERE `email` = 'demo.admin@giripremi.com'),
  'Neha Sharma', 'Demo Super Admin', '2026-10-05', '2026-10-10', 'Expedition', 'Equipment issued for a completed training expedition.', 'COMPLETED', '2026-10-09', 'Demo completed issue'
WHERE NOT EXISTS (SELECT 1 FROM `order_details` WHERE `id` = 1002);

INSERT INTO `order_items`
  (`id`, `order_id`, `equipment_id`, `store_id`, `quantity_issued`, `quantity_returned`, `quantity_pending`, `quantity_lost`, `return_condition`)
SELECT 1001, 1001, 'seed-rope-001', 11, 1, 0, 1, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM `order_items` WHERE `id` = 1001);

INSERT INTO `order_items`
  (`id`, `order_id`, `equipment_id`, `store_id`, `quantity_issued`, `quantity_returned`, `quantity_pending`, `quantity_lost`, `return_condition`)
SELECT 1002, 1002, 'seed-helmet-001', 11, 1, 1, 0, 0, 'NEW'
WHERE NOT EXISTS (SELECT 1 FROM `order_items` WHERE `id` = 1002);
