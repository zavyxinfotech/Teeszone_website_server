-- TeesZone Database Price, Name, and 3D Model Synchronization
-- Updates all products to prepend 'Customized ' if missing
UPDATE `Product` 
SET `name` = CONCAT('Customized ', TRIM(`name`)) 
WHERE `name` NOT LIKE 'Customized %';

-- Core Product 1: Aerosoft Polo (200 GSM)
-- Selling Price: ₹549, MRP: ₹1,499, Offer: 63.38%
UPDATE `Product` 
SET `price` = 549, `mrp` = 1499 
WHERE `slug` = 'aerosoft-polo-200' OR `id` = 'p-aerosoft-polo-200';

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
  ('pcm-aerosoft-light-grey', 'p-aerosoft-polo-200', 'Light Grey Melange', '#CCCAC9', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/light-grey-melange/front.png', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/light-grey-melange/back.png', 'products/aerosoft-polo-200/3d-models/light-grey-melange/front.png', 1),
  -- Men's Polo Half Sleeve (240-250 GSM)
  ('pcm-mens240-white', 'p-mens-polo-half-sleeve-240', 'White', '#FFFFFF', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/white/front.png', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/white/back.png', 'products/aerosoft-polo-200/3d-models/white/front.png', 1),
  ('pcm-mens240-navy', 'p-mens-polo-half-sleeve-240', 'Navy Blue', '#1E3A5F', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/true-navy/front.png', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/true-navy/back.png', 'products/aerosoft-polo-200/3d-models/true-navy/front.png', 1),
  ('pcm-mens240-charcoal', 'p-mens-polo-half-sleeve-240', 'Charcoal', '#3A3F46', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/black/front.png', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/black/back.png', 'products/aerosoft-polo-200/3d-models/black/front.png', 1),
  -- Men's Ecoblend Polo (240 GSM)
  ('pcm-eco240-white', 'p-ecoblend-polo-neck-240', 'White', '#FFFFFF', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/white/front.png', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/white/back.png', 'products/aerosoft-polo-200/3d-models/white/front.png', 1),
  ('pcm-eco240-navy', 'p-ecoblend-polo-neck-240', 'Navy Blue', '#1E3A5F', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/true-navy/front.png', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/true-navy/back.png', 'products/aerosoft-polo-200/3d-models/true-navy/front.png', 1),
  ('pcm-eco240-black', 'p-ecoblend-polo-neck-240', 'Black', '#26282D', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/black/front.png', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/black/back.png', 'products/aerosoft-polo-200/3d-models/black/front.png', 1),
  ('pcm-eco240-grey', 'p-ecoblend-polo-neck-240', 'Grey Melange', '#9AA0A8', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/light-grey-melange/front.png', 'http://localhost:4010/api/upload/media/products/aerosoft-polo-200/3d-models/light-grey-melange/back.png', 'products/aerosoft-polo-200/3d-models/light-grey-melange/front.png', 1)
ON DUPLICATE KEY UPDATE
  `colour_hex` = VALUES(`colour_hex`),
  `model_image_url` = VALUES(`model_image_url`),
  `model_back_image_url` = VALUES(`model_back_image_url`),
  `s3_object_key` = VALUES(`s3_object_key`),
  `is_active` = VALUES(`is_active`);
-- TeesZone Customization 3D Color Models Migration
CREATE TABLE IF NOT EXISTS `customization_color_model` (
  `id` VARCHAR(191) NOT NULL,
  `colour_name` VARCHAR(64) NOT NULL UNIQUE,
  `colour_slug` VARCHAR(64) NOT NULL UNIQUE,
  `colour_hex` VARCHAR(9) NOT NULL,
  `model_image_url` TEXT NOT NULL,
  `model_back_image_url` TEXT NULL,
  `s3_front_key` VARCHAR(255) NULL,
  `s3_back_key` VARCHAR(255) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `customization_color_model_colour_slug_idx` (`colour_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `customization_color_model` (`id`, `colour_name`, `colour_slug`, `colour_hex`, `model_image_url`, `model_back_image_url`, `s3_front_key`, `s3_back_key`, `is_active`, `sort_order`)
VALUES
  ('ccm-white', 'White', 'white', '#FFFFFF', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/white/front.png', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/white/back.png', 'teeszone/customization/tshirts/white/front.png', 'teeszone/customization/tshirts/white/back.png', 1, 0),
  ('ccm-black', 'Black', 'black', '#26282D', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/black/front.png', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/black/back.png', 'teeszone/customization/tshirts/black/front.png', 'teeszone/customization/tshirts/black/back.png', 1, 1),
  ('ccm-light-grey-melange', 'Light Grey Melange', 'light-grey-melange', '#CCCAC9', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/light-grey-melange/front.png', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/light-grey-melange/back.png', 'teeszone/customization/tshirts/light-grey-melange/front.png', 'teeszone/customization/tshirts/light-grey-melange/back.png', 1, 2),
  ('ccm-carbon-grey-melange', 'Carbon Grey Melange', 'carbon-grey-melange', '#767873', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/carbon-grey-melange/front.png', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/carbon-grey-melange/back.png', 'teeszone/customization/tshirts/carbon-grey-melange/front.png', 'teeszone/customization/tshirts/carbon-grey-melange/back.png', 1, 3),
  ('ccm-olive', 'Olive', 'olive', '#808000', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/olive/front.png', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/olive/back.png', 'teeszone/customization/tshirts/olive/front.png', 'teeszone/customization/tshirts/olive/back.png', 1, 4),
  ('ccm-pine-green', 'Pine Green', 'pine-green', '#01796F', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/pine-green/front.png', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/pine-green/back.png', 'teeszone/customization/tshirts/pine-green/front.png', 'teeszone/customization/tshirts/pine-green/back.png', 1, 5),
  ('ccm-arrow-red', 'Arrow Red', 'arrow-red', '#FF0000', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/arrow-red/front.png', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/arrow-red/back.png', 'teeszone/customization/tshirts/arrow-red/front.png', 'teeszone/customization/tshirts/arrow-red/back.png', 1, 6),
  ('ccm-imperial-blue', 'Imperial Blue', 'imperial-blue', '#002395', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/imperial-blue/front.png', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/imperial-blue/back.png', 'teeszone/customization/tshirts/imperial-blue/front.png', 'teeszone/customization/tshirts/imperial-blue/back.png', 1, 7),
  ('ccm-rama-blue', 'Rama Blue', 'rama-blue', '#4290F6', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/rama-blue/front.png', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/rama-blue/back.png', 'teeszone/customization/tshirts/rama-blue/front.png', 'teeszone/customization/tshirts/rama-blue/back.png', 1, 8),
  ('ccm-black-melange', 'Black Melange', 'black-melange', '#1C1C1C', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/black-melange/front.png', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/black-melange/back.png', 'teeszone/customization/tshirts/black-melange/front.png', 'teeszone/customization/tshirts/black-melange/back.png', 1, 9),
  ('ccm-berige', 'Berige', 'berige', '#C0362D', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/berige/front.png', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/berige/back.png', 'teeszone/customization/tshirts/berige/front.png', 'teeszone/customization/tshirts/berige/back.png', 1, 10),
  ('ccm-aluminium', 'Aluminium', 'aluminium', '#848789', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/aluminium/front.png', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/aluminium/back.png', 'teeszone/customization/tshirts/aluminium/front.png', 'teeszone/customization/tshirts/aluminium/back.png', 1, 11),
  ('ccm-mint', 'Mint', 'mint', '#3EB489', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/mint/front.png', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/mint/back.png', 'teeszone/customization/tshirts/mint/front.png', 'teeszone/customization/tshirts/mint/back.png', 1, 12),
  ('ccm-french-wine', 'French Wine', 'french-wine', '#AC1E44', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/french-wine/front.png', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/french-wine/back.png', 'teeszone/customization/tshirts/french-wine/front.png', 'teeszone/customization/tshirts/french-wine/back.png', 1, 13),
  ('ccm-emerald-green', 'Emerald Green', 'emerald-green', '#50C878', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/emerald-green/front.png', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/emerald-green/back.png', 'teeszone/customization/tshirts/emerald-green/front.png', 'teeszone/customization/tshirts/emerald-green/back.png', 1, 14),
  ('ccm-chrome-yellow', 'Chrome Yellow', 'chrome-yellow', '#FFA700', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/chrome-yellow/front.png', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/chrome-yellow/back.png', 'teeszone/customization/tshirts/chrome-yellow/front.png', 'teeszone/customization/tshirts/chrome-yellow/back.png', 1, 15),
  ('ccm-woody-orange', 'Woody Orange', 'woody-orange', '#B74D20', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/woody-orange/front.png', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/woody-orange/back.png', 'teeszone/customization/tshirts/woody-orange/front.png', 'teeszone/customization/tshirts/woody-orange/back.png', 1, 16),
  ('ccm-blue-melange', 'Blue Melange', 'blue-melange', '#3B5998', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/blue-melange/front.png', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/blue-melange/back.png', 'teeszone/customization/tshirts/blue-melange/front.png', 'teeszone/customization/tshirts/blue-melange/back.png', 1, 17),
  ('ccm-navy-melange', 'Navy Melange', 'navy-melange', '#28334A', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/navy-melange/front.png', 'https://teeszone-catalogue-images-2026.s3.ap-southeast-2.amazonaws.com/teeszone/customization/tshirts/navy-melange/back.png', 'teeszone/customization/tshirts/navy-melange/front.png', 'teeszone/customization/tshirts/navy-melange/back.png', 1, 18)
ON DUPLICATE KEY UPDATE
  `colour_hex` = VALUES(`colour_hex`),
  `model_image_url` = VALUES(`model_image_url`),
  `model_back_image_url` = VALUES(`model_back_image_url`),
  `s3_front_key` = VALUES(`s3_front_key`),
  `s3_back_key` = VALUES(`s3_back_key`),
  `is_active` = VALUES(`is_active`),
  `sort_order` = VALUES(`sort_order`);
