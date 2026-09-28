-- Rebrand: rename the stored site name if it is still the old default. A name
-- the admin has already customised is left alone.
UPDATE `siteSettings` SET `siteName` = 'TIDER MARKETING' WHERE `siteName` = 'N8N MARKETING';
