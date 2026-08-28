CREATE TABLE `purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`postId` text NOT NULL,
	`stripeSessionId` text NOT NULL,
	`amount` integer NOT NULL,
	`purchasedAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`postId`) REFERENCES `blogPosts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `user` ADD `noteId` text;--> statement-breakpoint
ALTER TABLE `user` ADD `xId` text;--> statement-breakpoint
ALTER TABLE `user` ADD `themePreference` text DEFAULT 'dark' NOT NULL;