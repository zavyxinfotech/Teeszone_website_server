const fs = require('fs');
const colors = require('./src/data/customizationColors.json');

let sql = '-- TeesZone Customization 3D Color Models Migration\n';
sql += 'CREATE TABLE IF NOT EXISTS `customization_color_model` (\n';
sql += '  `id` VARCHAR(191) NOT NULL,\n';
sql += '  `colour_name` VARCHAR(64) NOT NULL UNIQUE,\n';
sql += '  `colour_slug` VARCHAR(64) NOT NULL UNIQUE,\n';
sql += '  `colour_hex` VARCHAR(9) NOT NULL,\n';
sql += '  `model_image_url` TEXT NOT NULL,\n';
sql += '  `model_back_image_url` TEXT NULL,\n';
sql += '  `s3_front_key` VARCHAR(255) NULL,\n';
sql += '  `s3_back_key` VARCHAR(255) NULL,\n';
sql += '  `is_active` TINYINT(1) NOT NULL DEFAULT 1,\n';
sql += '  `sort_order` INT NOT NULL DEFAULT 0,\n';
sql += '  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n';
sql += '  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),\n';
sql += '  PRIMARY KEY (`id`),\n';
sql += '  KEY `customization_color_model_colour_slug_idx` (`colour_slug`)\n';
sql += ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n';

sql += 'INSERT INTO `customization_color_model` (`id`, `colour_name`, `colour_slug`, `colour_hex`, `model_image_url`, `model_back_image_url`, `s3_front_key`, `s3_back_key`, `is_active`, `sort_order`)\nVALUES\n';

const values = colors.map((c, i) => {
  return `  ('ccm-${c.slug}', '${c.name.replace(/'/g, "\\'")}', '${c.slug}', '${c.hex}', '${c.s3FrontUrl}', '${c.s3BackUrl}', '${c.s3FrontKey}', '${c.s3BackKey}', 1, ${i})`;
});

sql += values.join(',\n') + '\n';
sql += 'ON DUPLICATE KEY UPDATE\n';
sql += '  `colour_hex` = VALUES(`colour_hex`),\n';
sql += '  `model_image_url` = VALUES(`model_image_url`),\n';
sql += '  `model_back_image_url` = VALUES(`model_back_image_url`),\n';
sql += '  `s3_front_key` = VALUES(`s3_front_key`),\n';
sql += '  `s3_back_key` = VALUES(`s3_back_key`),\n';
sql += '  `is_active` = VALUES(`is_active`),\n';
sql += '  `sort_order` = VALUES(`sort_order`);\n';

fs.writeFileSync('prisma/customization_color_models.sql', sql);
console.log('Generated prisma/customization_color_models.sql with', colors.length, 'colors');
