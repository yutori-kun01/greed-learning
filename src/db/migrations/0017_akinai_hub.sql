CREATE TABLE `akinaiGrants` (
	`orderId` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`productId` text NOT NULL,
	`status` text NOT NULL,
	`eventAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `akinaiGrants_email_idx` ON `akinaiGrants` (`email`);--> statement-breakpoint
ALTER TABLE `courses` ADD `akinaiProductIds` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `purchaseUrl` text;