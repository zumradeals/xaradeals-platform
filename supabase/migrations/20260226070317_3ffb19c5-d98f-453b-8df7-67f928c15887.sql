
-- Drop old check constraints
ALTER TABLE products DROP CONSTRAINT products_brand_check;
ALTER TABLE products DROP CONSTRAINT products_delivery_mode_check;
ALTER TABLE products DROP CONSTRAINT products_product_family_check;

-- Add updated check constraints with more brands and delivery modes
ALTER TABLE products ADD CONSTRAINT products_brand_check 
CHECK (brand = ANY (ARRAY['Autodesk', 'Adobe', 'LinkedIn', 'Microsoft', 'Lumion', 'Notion', 'n8n', 'Replit', 'Bolt.new', 'Kaspersky', 'Amazon', 'OpenAI', 'Coursera', 'edX', 'Canva', 'XaraDeals', 'Other']));

ALTER TABLE products ADD CONSTRAINT products_delivery_mode_check 
CHECK (delivery_mode = ANY (ARRAY['INSTANT', 'MANUAL', 'DIGITAL', 'SERVICE']));

ALTER TABLE products ADD CONSTRAINT products_product_family_check 
CHECK (product_family = ANY (ARRAY['SOFTWARE', 'SUBSCRIPTION', 'ACCOUNT', 'Notion Plus', 'n8n Cloud', 'Replit Core', 'Bolt.new Pro', 'Kaspersky Premium', 'Office 2021', 'Project 2019', 'Prime Video', 'LinkedIn Premium', 'Société UK', 'ChatGPT Plus', 'Office 365 Enterprise', 'Coursera Plus', 'edX Premium', 'Autodesk All Apps', 'Lumion Edu Pro', 'Adobe Creative Cloud', 'Office 365 Personnel', 'Canva Pro', 'Office 365 Pro']));
