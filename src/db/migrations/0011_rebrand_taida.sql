-- Correct the rebrand: the name is 怠惰 (TAIDA), not TIDER. Renames a stored
-- site name that is still either default; a customised name is left alone.
UPDATE `siteSettings` SET `siteName` = 'TAIDA MARKETING' WHERE `siteName` IN ('TIDER MARKETING', 'N8N MARKETING');
