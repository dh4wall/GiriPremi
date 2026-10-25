-- =========================================================================
-- GiriPremi Cloud Database Seed Script
-- Compatible with MySQL 8.0 & TiDB Cloud Serverless
-- Target Database: giripremi
-- =========================================================================

USE `giripremi`;

-- 1. STORES
INSERT INTO `store` (`id`, `name`, `contact_person`, `contact_number`, `is_active`)
VALUES
  (1, 'Store 1 - HQ Pune', 'Dhawal Joshi', '+91 98220 11001', TRUE),
  (2, 'Store 2 - Shivaji Nagar', 'Sanjay Rao', '+91 98220 11002', TRUE),
  (3, 'Base Camp Warehouse - Lonavala', 'Vikram More', '+91 98220 11003', TRUE)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `contact_person` = VALUES(`contact_person`),
  `contact_number` = VALUES(`contact_number`);

-- 2. CATEGORIES
INSERT INTO `category` (`id`, `name`, `parent_category_type`, `tracking_type`, `requires_inspection`, `inspection_frequency_months`, `product_life_year`, `description`)
VALUES
  (101, 'Climbing Ropes', 'Climbing', 'QUANTITY', TRUE, 6, 5.0, 'Dynamic and static certified kernmantle ropes for rock climbing, glacier crossings, and rescue.'),
  (102, 'Safety Helmets', 'Safety', 'QUANTITY', TRUE, 12, 5.0, 'EN 12492 / UIAA 106 rated mountaineering and climbing helmets for impact protection.'),
  (103, 'Harnesses & Slings', 'Climbing', 'QUANTITY', TRUE, 6, 7.0, 'Adjustable sit harnesses, full-body rigs, tubular webbing slings, and daisy chains.'),
  (104, 'Carabiners & Hardware', 'Hardware', 'QUANTITY', TRUE, 12, 10.0, 'Screwgate locking carabiners, auto-locks, ATC belay devices, and Figure-8 descenders.'),
  (105, 'High-Altitude Tents', 'Camping', 'QUANTITY', FALSE, 12, 8.0, '4-season geodesic expedition assault tents with snow skirts and DAC featherlight poles.'),
  (106, 'Sleeping Gear & Mats', 'Camping', 'QUANTITY', FALSE, 12, 6.0, 'Down sleeping bags rated to -20°C and insulated high R-value puncture-resistant ground pads.'),
  (107, 'Snow & Ice Gear', 'Alpine', 'QUANTITY', TRUE, 6, 10.0, 'Crampons with anti-balling plates, technical ice axes, snow stakes, and ice screws.'),
  (108, 'Navigation & Radio', 'Electronics', 'QUANTITY', TRUE, 3, 4.0, 'Satellite communicators, high-range VHF/UHF walkie-talkies, GPS units, and compasses.')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `description` = VALUES(`description`);

-- 3. USERS (Password hashes correspond to Admin@123, Store@123, Member@123)
INSERT INTO `user_details` (`id`, `email`, `password`, `full_name`, `contact_number`, `user_type`, `id_proof_type`, `id_proof_number`, `total_issues`, `total_penalties`, `total_penalty_amount`, `is_active`)
VALUES
  (1, 'admin@giripremi.com', '$2b$12$K.zM2032/K8/GljkC1iOgC0ZVLawIMaRe.9I4ks.wPX.DxPUQ/7bJpSe', 'Super Admin', '+91 98220 00001', 'superAdmin', 'Passport', 'P-IND001', 0, 0, 0, TRUE),
  (2, 'store@giripremi.com', '$2b$12$7k/3M2k40M12hDHkiLN2tgdflD21scz41uglyDc8Rs.Zk4Et.2X/H', 'Store Manager', '+91 98220 00002', 'storeAdmin', 'Aadhaar', 'XXXX-0002', 0, 0, 0, TRUE),
  (3, 'member@giripremi.com', '$2b$12$K.zM2032/K8/GljkC1iOgC0ZVLawIMaRe.9I4ks.wPX.DxPUQ/7bJpSe', 'Club Member', '+91 98220 00003', 'member', 'Aadhaar', 'XXXX-0003', 0, 0, 0, TRUE),
  (4, 'demo.admin@giripremi.com', '$2b$12$GljkC1iOgC0ZVLawIMaRe.9I4ks.wPX.DxPUQ/7bJpSeBJJqJhx/6', 'Demo Super Admin', '+91 98220 00004', 'superAdmin', 'Passport', 'P-IND004', 0, 0, 0, TRUE),
  (5, 'demo.store@giripremi.com', '$2b$12$hDHkiLN2tgdflD21scz41uglyDc8Rs.Zk4Et.2X/Hp2uQbXBb0urC', 'Demo Store Admin', '+91 98220 00005', 'storeAdmin', 'Aadhaar', 'XXXX-0005', 0, 0, 0, TRUE),
  (6, 'arjun.patil@giripremi.org', '$2b$12$K.zM2032/K8/GljkC1iOgC0ZVLawIMaRe.9I4ks.wPX.DxPUQ/7bJpSe', 'Arjun Patil', '+91 98765 43210', 'member', 'Aadhaar', 'XXXX-XXXX-1201', 4, 0, 0, TRUE),
  (7, 'neha.sharma@giripremi.org', '$2b$12$K.zM2032/K8/GljkC1iOgC0ZVLawIMaRe.9I4ks.wPX.DxPUQ/7bJpSe', 'Neha Sharma', '+91 98765 43211', 'member', 'Aadhaar', 'XXXX-XXXX-1202', 3, 0, 0, TRUE),
  (8, 'rohan.kulkarni@giripremi.org', '$2b$12$K.zM2032/K8/GljkC1iOgC0ZVLawIMaRe.9I4ks.wPX.DxPUQ/7bJpSe', 'Rohan Kulkarni', '+91 98765 43212', 'member', 'Passport', 'P-XXXX1203', 6, 1, 250.00, TRUE),
  (9, 'priya.deshmukh@giripremi.org', '$2b$12$K.zM2032/K8/GljkC1iOgC0ZVLawIMaRe.9I4ks.wPX.DxPUQ/7bJpSe', 'Priya Deshmukh', '+91 98765 43213', 'member', 'Driving License', 'MH-12-XXXXX99', 2, 0, 0, TRUE),
  (10, 'anita.joshi@giripremi.org', '$2b$12$K.zM2032/K8/GljkC1iOgC0ZVLawIMaRe.9I4ks.wPX.DxPUQ/7bJpSe', 'Anita Joshi', '+91 98765 43214', 'member', 'Passport', 'P-XXXX9804', 5, 0, 0, TRUE)
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`), `contact_number` = VALUES(`contact_number`);

-- 4. EQUIPMENT ITEMS
INSERT INTO `equipment` (`id`, `equipment_name`, `category_id`, `date_of_manufacturing`, `date_of_expiry`, `purchase_date`, `brand`, `description`, `current_store_id`, `is_available`, `general_remark`)
VALUES
  ('EQ-ROPE-001', 'Mammut 9.8mm Crag Classic Dynamic Rope (60m)', 101, DATE_SUB(CURDATE(), INTERVAL 260 DAY), DATE_ADD(CURDATE(), INTERVAL 1200 DAY), DATE_SUB(CURDATE(), INTERVAL 220 DAY), 'Mammut', 'Premium dynamic single rope for sport and traditional climbing.', 1, TRUE, 'Certified UIAA 101. Standard team climbing stock.'),
  ('EQ-ROPE-002', 'Beal Opera 8.5mm Golden Dry Alpine Rope (70m)', 101, DATE_SUB(CURDATE(), INTERVAL 450 DAY), DATE_ADD(CURDATE(), INTERVAL 35 DAY), DATE_SUB(CURDATE(), INTERVAL 400 DAY), 'Beal', 'Ultralight triple-rated rope with Golden Dry water-repellent treatment.', 3, TRUE, 'Scheduled for semi-annual elongation and sheath inspection.'),
  ('EQ-HLMT-001', 'Petzl Sirocco Ultra-Light Climbing Helmet', 102, DATE_SUB(CURDATE(), INTERVAL 180 DAY), DATE_ADD(CURDATE(), INTERVAL 1600 DAY), DATE_SUB(CURDATE(), INTERVAL 150 DAY), 'Petzl', 'Hybrid construction with EPP foam shell and rigid EPS crown plate. 170g design.', 1, TRUE, 'Prime condition. Zero impact marks.'),
  ('EQ-HLMT-002', 'Black Diamond Half Dome Workhorse Helmet', 102, DATE_SUB(CURDATE(), INTERVAL 360 DAY), DATE_ADD(CURDATE(), INTERVAL 1400 DAY), DATE_SUB(CURDATE(), INTERVAL 320 DAY), 'Black Diamond', 'Durable ABS outer shell with co-molded EPS foam.', 2, TRUE, 'Training fleet stock with slight cosmetic scuffs.'),
  ('EQ-HARN-001', 'Black Diamond Momentum Adjustable Harness', 103, DATE_SUB(CURDATE(), INTERVAL 210 DAY), DATE_ADD(CURDATE(), INTERVAL 1500 DAY), DATE_SUB(CURDATE(), INTERVAL 180 DAY), 'Black Diamond', 'Dual-core construction waistbelt with trakFIT leg loops and 4 gear loops.', 1, TRUE, 'Includes tie-in point wear indicators.'),
  ('EQ-HARN-002', 'Petzl Corax Multi-Purpose Climbing Harness', 103, DATE_SUB(CURDATE(), INTERVAL 540 DAY), DATE_ADD(CURDATE(), INTERVAL 25 DAY), DATE_SUB(CURDATE(), INTERVAL 500 DAY), 'Petzl', 'Versatile all-season harness with doubleback buckles.', 2, TRUE, 'Due for annual safety stitch audit.'),
  ('EQ-CRBN-001', 'Petzl Attache Screw-Lock HMS Carabiner', 104, DATE_SUB(CURDATE(), INTERVAL 120 DAY), DATE_ADD(CURDATE(), INTERVAL 3000 DAY), DATE_SUB(CURDATE(), INTERVAL 90 DAY), 'Petzl', 'Pear-shaped screw-lock carabiner with visual red unlock indicator. 22kN strength.', 1, TRUE, 'Flawless gate action, clean anodized finish.'),
  ('EQ-CRBN-002', 'Black Diamond ATC-Guide Belay & Rappel Device', 104, DATE_SUB(CURDATE(), INTERVAL 280 DAY), DATE_ADD(CURDATE(), INTERVAL 2800 DAY), DATE_SUB(CURDATE(), INTERVAL 250 DAY), 'Black Diamond', 'Multiple friction modes with auto-blocking guide mode.', 1, TRUE, 'Hard anodized alloy, minimal groove wear.'),
  ('EQ-TENT-001', 'MSR Access 2 Four-Season Alpine Tent', 105, DATE_SUB(CURDATE(), INTERVAL 140 DAY), DATE_ADD(CURDATE(), INTERVAL 2400 DAY), DATE_SUB(CURDATE(), INTERVAL 110 DAY), 'MSR', 'Central-support frame stands up to heavy snow loading.', 3, TRUE, 'Complete pole set, rainfly sealed, heavy stakes included.'),
  ('EQ-TENT-002', 'The North Face Mountain 25 Expedition Tent', 105, DATE_SUB(CURDATE(), INTERVAL 460 DAY), DATE_ADD(CURDATE(), INTERVAL 1800 DAY), DATE_SUB(CURDATE(), INTERVAL 420 DAY), 'The North Face', 'Dual doors, front poled vestibule, high-strength nylon fly for Himalayan extreme conditions.', 3, TRUE, 'Field deployed twice in Leh sector. Clean and dry.'),
  ('EQ-SLEP-001', 'Mountain Hardwear Phantom -20F Expedition Sleeping Bag', 106, DATE_SUB(CURDATE(), INTERVAL 220 DAY), DATE_ADD(CURDATE(), INTERVAL 1900 DAY), DATE_SUB(CURDATE(), INTERVAL 190 DAY), 'Mountain Hardwear', '850-fill RDS certified goose down with waterproof Pertex Quantum shell.', 3, TRUE, 'Stored uncompressed in cotton storage sacks.'),
  ('EQ-SLEP-002', 'Therm-a-Rest NeoAir XTherm Insulated Sleeping Pad', 106, DATE_SUB(CURDATE(), INTERVAL 340 DAY), DATE_ADD(CURDATE(), INTERVAL 1600 DAY), DATE_SUB(CURDATE(), INTERVAL 310 DAY), 'Therm-a-Rest', 'Reflective ThermaCapture technology with 7.3 R-value.', 1, TRUE, 'Pressure tested, zero leaks, pump sack included.'),
  ('EQ-ICEA-001', 'Grivel G12 New-Matic 12-Point Crampons', 107, DATE_SUB(CURDATE(), INTERVAL 310 DAY), DATE_ADD(CURDATE(), INTERVAL 2500 DAY), DATE_SUB(CURDATE(), INTERVAL 280 DAY), 'Grivel', 'Chromoly steel 12-point crampons with active anti-balling plates.', 3, TRUE, 'Points razor-sharp. Binding webbing in prime condition.'),
  ('EQ-ICEA-002', 'Petzl Summit Evo Technical Mountaineering Axe (66cm)', 107, DATE_SUB(CURDATE(), INTERVAL 170 DAY), DATE_ADD(CURDATE(), INTERVAL 2800 DAY), DATE_SUB(CURDATE(), INTERVAL 140 DAY), 'Petzl', 'Hydroformed curved aluminum shaft with hot-forged steel pick.', 3, TRUE, 'Rubber grip handle clean and intact.'),
  ('EQ-COMM-001', 'Garmin inReach Mini 2 Satellite Communicator', 108, DATE_SUB(CURDATE(), INTERVAL 110 DAY), DATE_ADD(CURDATE(), INTERVAL 1300 DAY), DATE_SUB(CURDATE(), INTERVAL 80 DAY), 'Garmin', 'Two-way global satellite messaging with interactive SOS and TracBack routing.', 1, TRUE, 'Firmware updated, battery health 100%.'),
  ('EQ-COMM-002', 'Motorola T82 Extreme Weatherproof Walkie-Talkies (Pair)', 108, DATE_SUB(CURDATE(), INTERVAL 410 DAY), DATE_ADD(CURDATE(), INTERVAL 18 DAY), DATE_SUB(CURDATE(), INTERVAL 380 DAY), 'Motorola', 'IPX4 weatherproof two-way radios with 10km range.', 2, TRUE, 'Rechargeable NiMH battery packs due for capacity test.')
ON DUPLICATE KEY UPDATE `equipment_name` = VALUES(`equipment_name`);

-- 5. STOCK QUANTITIES & CONDITIONS
INSERT INTO `equipment_qty` (`id`, `equipment_id`, `store_id`, `quantity`, `curr_condition`)
VALUES
  ('QTY-ST1-001', 'EQ-ROPE-001', 1, 14, 'NEW'),
  ('QTY-ST1-002', 'EQ-HLMT-001', 1, 18, 'NEW'),
  ('QTY-ST1-003', 'EQ-HARN-001', 1, 12, 'NEW'),
  ('QTY-ST1-004', 'EQ-CRBN-001', 1, 40, 'NEW'),
  ('QTY-ST1-005', 'EQ-CRBN-002', 1, 16, 'NEW'),
  ('QTY-ST1-006', 'EQ-SLEP-002', 1, 10, 'NEW'),
  ('QTY-ST1-007', 'EQ-COMM-001', 1, 5, 'NEW'),
  ('QTY-ST2-001', 'EQ-ROPE-001', 2, 6, 'MODERATE'),
  ('QTY-ST2-002', 'EQ-HLMT-002', 2, 15, 'MODERATE'),
  ('QTY-ST2-003', 'EQ-HARN-002', 2, 8, 'MODERATE'),
  ('QTY-ST2-004', 'EQ-CRBN-001', 2, 20, 'MODERATE'),
  ('QTY-ST2-005', 'EQ-COMM-002', 2, 6, 'MODERATE'),
  ('QTY-BC-001', 'EQ-ROPE-002', 3, 8, 'MODERATE'),
  ('QTY-BC-002', 'EQ-TENT-001', 3, 6, 'NEW'),
  ('QTY-BC-003', 'EQ-TENT-002', 3, 4, 'MODERATE'),
  ('QTY-BC-004', 'EQ-SLEP-001', 3, 8, 'NEW'),
  ('QTY-BC-005', 'EQ-ICEA-001', 3, 12, 'NEW'),
  ('QTY-BC-006', 'EQ-ICEA-002', 3, 10, 'NEW')
ON DUPLICATE KEY UPDATE `quantity` = VALUES(`quantity`), `curr_condition` = VALUES(`curr_condition`);

-- 6. ORDER DETAILS
INSERT INTO `order_details` (`id`, `user_id`, `approved_by_user_id`, `issued_to_name`, `approved_by_name`, `issue_date`, `expected_return_date`, `purpose`, `purpose_details`, `status`, `actual_return_date`, `remarks`)
VALUES
  (1001, 6, 2, 'Arjun Patil', 'Store Manager', DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_ADD(CURDATE(), INTERVAL 4 DAY), 'Training', 'Basic Rock Climbing Course at Plus Valley crag.', 'ISSUED', NULL, 'Issue authorized with standard gear waiver.'),
  (1002, 10, 2, 'Anita Joshi', 'Store Manager', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 12 DAY), 'Expedition', 'Mount Stok Kangri alpine acclimatization assault.', 'ISSUED', NULL, 'High altitude cold weather gear checked and logged.'),
  (1003, 7, 2, 'Neha Sharma', 'Store Manager', DATE_SUB(CURDATE(), INTERVAL 14 DAY), DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'Trek', 'Rajmachi Fort weekend trekking trail.', 'COMPLETED', DATE_SUB(CURDATE(), INTERVAL 8 DAY), 'Returned on time in pristine condition.'),
  (1004, 8, 2, 'Rohan Kulkarni', 'Store Manager', DATE_SUB(CURDATE(), INTERVAL 24 DAY), DATE_SUB(CURDATE(), INTERVAL 18 DAY), 'Expedition', 'Sahyadri range ridge traverse.', 'COMPLETED', DATE_SUB(CURDATE(), INTERVAL 17 DAY), 'All gear verified and safely restocked.'),
  (1005, 9, 2, 'Priya Deshmukh', 'Store Manager', DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'Personal Use', 'Torna to Rajgad high ridge trek.', 'ISSUED', NULL, 'Sleeping mat and tent dispatch from Base Camp.')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

-- 7. ORDER ITEMS
INSERT INTO `order_items` (`id`, `order_id`, `equipment_id`, `store_id`, `quantity_issued`, `quantity_returned`, `quantity_pending`, `quantity_lost`, `return_condition`)
VALUES
  (5001, 1001, 'EQ-ROPE-001', 1, 1, 0, 1, 0, NULL),
  (5002, 1001, 'EQ-HLMT-001', 1, 1, 0, 1, 0, NULL),
  (5003, 1001, 'EQ-HARN-001', 1, 1, 0, 1, 0, NULL),
  (5004, 1002, 'EQ-TENT-001', 3, 1, 0, 1, 0, NULL),
  (5005, 1002, 'EQ-ICEA-001', 3, 1, 0, 1, 0, NULL),
  (5006, 1002, 'EQ-ICEA-002', 3, 1, 0, 1, 0, NULL),
  (5007, 1002, 'EQ-COMM-001', 1, 1, 0, 1, 0, NULL),
  (5008, 1003, 'EQ-HLMT-002', 2, 2, 2, 0, 0, 'NEW'),
  (5009, 1003, 'EQ-COMM-002', 2, 2, 2, 0, 0, 'MODERATE'),
  (5010, 1004, 'EQ-ROPE-001', 1, 2, 2, 0, 0, 'MODERATE'),
  (5011, 1004, 'EQ-HARN-001', 1, 2, 2, 0, 0, 'NEW'),
  (5012, 1005, 'EQ-TENT-002', 3, 1, 0, 1, 0, NULL),
  (5013, 1005, 'EQ-SLEP-001', 3, 1, 0, 1, 0, NULL)
ON DUPLICATE KEY UPDATE `quantity_issued` = VALUES(`quantity_issued`);
