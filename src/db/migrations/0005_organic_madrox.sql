CREATE TABLE `rateLimit` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`count` integer NOT NULL,
	`lastRequest` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `operatorName` text;--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `operatorRepresentative` text;--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `operatorAddress` text;--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `operatorPhone` text;--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `operatorEmail` text;--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `tokushohoExtra` text;--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `termsContent` text;--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `privacyContent` text;