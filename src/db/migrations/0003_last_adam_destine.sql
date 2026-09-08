CREATE INDEX `blogPosts_status_idx` ON `blogPosts` (`status`);--> statement-breakpoint
CREATE INDEX `blogPosts_slug_idx` ON `blogPosts` (`slug`);--> statement-breakpoint
CREATE INDEX `courses_status_idx` ON `courses` (`status`);--> statement-breakpoint
CREATE INDEX `lessonProgress_userId_lessonId_idx` ON `lessonProgress` (`userId`,`lessonId`);--> statement-breakpoint
CREATE UNIQUE INDEX `purchases_stripeSessionId_unique` ON `purchases` (`stripeSessionId`);