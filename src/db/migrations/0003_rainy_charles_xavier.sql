CREATE TABLE `bookmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`courseId` text NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `courseResources` (
	`id` text PRIMARY KEY NOT NULL,
	`courseId` text NOT NULL,
	`icon` text DEFAULT '📄' NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`fileUrl` text,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` integer DEFAULT 0 NOT NULL,
	`interval` text DEFAULT 'month' NOT NULL,
	`stripeProductId` text,
	`stripePriceId` text,
	`isActive` integer DEFAULT true NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plans_stripePriceId_unique` ON `plans` (`stripePriceId`);--> statement-breakpoint
ALTER TABLE `courses` ADD `requiredPlanId` text REFERENCES plans(id);--> statement-breakpoint
ALTER TABLE `user` ADD `status` text DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `planId` text REFERENCES plans(id);--> statement-breakpoint
ALTER TABLE `user` ADD `stripeSubscriptionId` text;--> statement-breakpoint
ALTER TABLE `user` ADD `subscriptionStatus` text DEFAULT 'NONE' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `currentPeriodEnd` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `user_stripeSubscriptionId_unique` ON `user` (`stripeSubscriptionId`);