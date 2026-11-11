-- TeesZone Database Price & Name Synchronization
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

