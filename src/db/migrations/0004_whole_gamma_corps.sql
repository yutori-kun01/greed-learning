CREATE TABLE `courseCategories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courseCategories_slug_unique` ON `courseCategories` (`slug`);--> statement-breakpoint
CREATE TABLE `planCourses` (
	`planId` text NOT NULL,
	`courseId` text NOT NULL,
	FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `planCourses_idx` ON `planCourses` (`planId`,`courseId`);--> statement-breakpoint
CREATE TABLE `plans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` integer DEFAULT 0 NOT NULL,
	`stripeProductId` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `resources` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`imageUrl` text,
	`fileUrl` text,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`courseId` text,
	FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `userAccessGrants` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`courseId` text,
	`planId` text,
	`grantedAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `userAccessGrants_user_idx` ON `userAccessGrants` (`userId`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_courses` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`thumbnailUrl` text,
	`categoryId` text,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`badge` text,
	`totalDuration` integer DEFAULT 0 NOT NULL,
	`lessonCount` integer DEFAULT 0 NOT NULL,
	`isFreeForMembers` integer DEFAULT false NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`categoryId`) REFERENCES `courseCategories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_courses`("id", "number", "title", "description", "thumbnailUrl", "categoryId", "status", "badge", "totalDuration", "lessonCount", "createdAt", "updatedAt") SELECT "id", "number", "title", "description", "thumbnailUrl", "categoryId", "status", "badge", "totalDuration", "lessonCount", "createdAt", "updatedAt" FROM `courses`;--> statement-breakpoint
DROP TABLE `courses`;--> statement-breakpoint
ALTER TABLE `__new_courses` RENAME TO `courses`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `courses_status_idx` ON `courses` (`status`);--> statement-breakpoint
ALTER TABLE `lessons` ADD `thumbnailUrl` text;