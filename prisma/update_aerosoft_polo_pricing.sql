-- =========================================================================
-- TeesZone Migration: Update Customized Men's AeroSoft Polo Product Pricing
-- Product: Customized Men's AeroSoft Polo (200 GSM)
-- Product ID: p-aerosoft-polo-200
-- Product Slug: aerosoft-polo-200
-- Intended Pricing:
--   MRP: ₹1,499
--   Selling Price: ₹549
--   Offer Discount: 63.38% OFF ((1499 - 549) / 1499 * 100 = 63.38%)
-- =========================================================================

START TRANSACTION;

-- 1. Update Product price and MRP
UPDATE `Product`
SET 
  `price` = 549,
  `mrp` = 1499,
  `updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `slug` = 'aerosoft-polo-200' OR `id` = 'p-aerosoft-polo-200';

-- 2. Verify record post-update
SELECT 
  `id`,
  `slug`,
  `name`,
  `price` AS `selling_price`,
  `mrp` AS `original_mrp`,
  ROUND(((mrp - price) / mrp) * 100, 2) AS `discount_pct`
FROM `Product`
WHERE `slug` = 'aerosoft-polo-200';

COMMIT;

