CREATE TABLE `siteSettings` (
	`id` text PRIMARY KEY NOT NULL,
	`siteName` text DEFAULT 'N8N MARKETING' NOT NULL,
	`logoUrl` text,
	`accentColor` text DEFAULT 'gold' NOT NULL,
	`bgPattern` text DEFAULT 'pattern1' NOT NULL,
	`updatedAt` text NOT NULL
);
