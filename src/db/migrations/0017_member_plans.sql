CREATE TABLE `memberPlans` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`planId` text NOT NULL,
	`grantedAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `memberPlans_userId_planId_unique` ON `memberPlans` (`userId`,`planId`);--> statement-breakpoint
CREATE INDEX `memberPlans_planId_idx` ON `memberPlans` (`planId`);--> statement-breakpoint
-- Move plans granted by hand (an ACTIVE plan with no Stripe subscription
-- behind it) from user.planId into memberPlans, so every member keeps the
-- access they had. user.planId is left to Stripe from here on.
INSERT INTO `memberPlans` (`id`, `userId`, `planId`, `grantedAt`)
SELECT lower(hex(randomblob(16))), `id`, `planId`, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM `user`
WHERE `planId` IS NOT NULL AND `subscriptionStatus` = 'ACTIVE' AND `stripeSubscriptionId` IS NULL;--> statement-breakpoint
UPDATE `user` SET `planId` = NULL, `subscriptionStatus` = 'NONE'
WHERE `planId` IS NOT NULL AND `subscriptionStatus` = 'ACTIVE' AND `stripeSubscriptionId` IS NULL;
