CREATE TABLE `coursePrerequisites` (
	`id` text PRIMARY KEY NOT NULL,
	`courseId` text NOT NULL,
	`requiredCourseId` text NOT NULL,
	FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`requiredCourseId`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coursePrerequisites_courseId_requiredCourseId_unique` ON `coursePrerequisites` (`courseId`,`requiredCourseId`);--> statement-breakpoint
CREATE TABLE `courseTags` (
	`id` text PRIMARY KEY NOT NULL,
	`courseId` text NOT NULL,
	`tagId` text NOT NULL,
	FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courseTags_courseId_tagId_unique` ON `courseTags` (`courseId`,`tagId`);--> statement-breakpoint
CREATE INDEX `courseTags_tagId_idx` ON `courseTags` (`tagId`);--> statement-breakpoint
CREATE TABLE `rewardClaims` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`rewardId` text NOT NULL,
	`claimedAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`rewardId`) REFERENCES `rewards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rewardClaims_userId_rewardId_unique` ON `rewardClaims` (`userId`,`rewardId`);--> statement-breakpoint
CREATE TABLE `rewards` (
	`id` text PRIMARY KEY NOT NULL,
	`icon` text DEFAULT '🎁' NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`content` text,
	`url` text,
	`requiredCompletedCourses` integer,
	`requiredPoints` integer,
	`isHidden` integer DEFAULT false NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
ALTER TABLE `courses` ADD `unlockCompletedCourses` integer;--> statement-breakpoint
ALTER TABLE `courses` ADD `unlockPoints` integer;--> statement-breakpoint
ALTER TABLE `courses` ADD `isHidden` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `lastLoginBonusDate` text;