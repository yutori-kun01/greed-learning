CREATE TABLE `webhookEvents` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`receivedAt` text NOT NULL
);
--> statement-breakpoint
-- The index below cannot be created while duplicates exist, and duplicates are
-- expected: until now nothing stopped a redelivered checkout.session.completed
-- from inserting the same Checkout Session twice. Keep the earliest row of each
-- session and drop the repeats — they granted no access the first row doesn't.
DELETE FROM `purchases` WHERE `rowid` NOT IN (
	SELECT MIN(`rowid`) FROM `purchases` GROUP BY `stripeSessionId`
);--> statement-breakpoint
CREATE UNIQUE INDEX `purchases_stripeSessionId_unique` ON `purchases` (`stripeSessionId`);