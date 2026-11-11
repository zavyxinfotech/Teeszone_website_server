-- TeesZone Database Price, Name, and 3D Model Synchronization
-- Updates all products to prepend 'Customized ' if missing
UPDATE `Product` 
SET `name` = CONCAT('Customized ', TRIM(`name`)) 
WHERE `name` NOT LIKE 'Customized %';

-- Core Product 1: Aerosoft Polo (200 GSM)
-- Selling Price: ₹830, MRP: ₹1,999, Offer: 17%
UPDATE `Product` 
SET `price` = 830, `mrp` = 1999 
WHERE `slug` = 'aerosoft-polo-200';

-- Core Product 2: Men's Polo – Half Sleeve (240–250 GSM)
-- Selling Price: ₹925, MRP: ₹2,399, Offer: 23%
UPDATE `Product` 
SET `price` = 925, `mrp` = 2399 
WHERE `slug` = 'mens-polo-half-sleeve-240';

-- Core Product 3: Men's Ecoblend Polo (240 GSM)
-- Selling Price: ₹975, MRP: ₹1,199, Offer: 23%
UPDATE `Product` 
SET `price` = 975, `mrp` = 1199 
WHERE `slug` = 'ecoblend-polo-neck-240';

-- Create product_color_model table if not exists
CREATE TABLE IF NOT EXISTS `product_color_model` (
  `id` VARCHAR(191) NOT NULL,
  `product_id` VARCHAR(191) NOT NULL,
  `product_colour_id` VARCHAR(191) NULL,
  `colour_name` VARCHAR(64) NOT NULL,
  `colour_hex` VARCHAR(9) NOT NULL,
  `model_image_url` TEXT NOT NULL,
  `model_back_image_url` TEXT NULL,
  `s3_object_key` VARCHAR(255) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_color_model_product_id_colour_name_key` (`product_id`, `colour_name`),
  KEY `product_color_model_product_id_idx` (`product_id`),
  CONSTRAINT `product_color_model_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed AeroSoft Polo 200 3D Models
INSERT INTO `product_color_model` (`id`, `product_id`, `colour_name`, `colour_hex`, `model_image_url`, `model_back_image_url`, `s3_object_key`, `is_active`)
VALUES
  ('pcm-aerosoft-black', 'p-aerosoft-polo-200', 'Black', '#26282D', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/black/front.png', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/black/back.png', 'products/aerosoft-polo-200/3d-models/black/front.png', 1),
  ('pcm-aerosoft-white', 'p-aerosoft-polo-200', 'White', '#FFFFFF', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/white/front.png', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/white/back.png', 'products/aerosoft-polo-200/3d-models/white/front.png', 1),
  ('pcm-aerosoft-true-navy', 'p-aerosoft-polo-200', 'True Navy', '#3F5277', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/true-navy/front.png', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/true-navy/back.png', 'products/aerosoft-polo-200/3d-models/true-navy/front.png', 1),
  ('pcm-aerosoft-light-grey', 'p-aerosoft-polo-200', 'Light Grey Melange', '#CCCAC9', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/light-grey-melange/front.png', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/light-grey-melange/back.png', 'products/aerosoft-polo-200/3d-models/light-grey-melange/front.png', 1)
ON DUPLICATE KEY UPDATE
  `colour_hex` = VALUES(`colour_hex`),
  `model_image_url` = VALUES(`model_image_url`),
  `model_back_image_url` = VALUES(`model_back_image_url`),
  `s3_object_key` = VALUES(`s3_object_key`),
  `is_active` = VALUES(`is_active`);
