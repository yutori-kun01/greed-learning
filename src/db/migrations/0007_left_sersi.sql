CREATE TABLE `pointEvents` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`points` integer NOT NULL,
	`courseId` text,
	`lessonId` text,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pointEvents_userId_createdAt_idx` ON `pointEvents` (`userId`,`createdAt`);--> statement-breakpoint
CREATE TABLE `userBadges` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`badgeId` text NOT NULL,
	`earnedAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `userBadges_userId_badgeId_unique` ON `userBadges` (`userId`,`badgeId`);--> statement-breakpoint
ALTER TABLE `user` ADD `totalPoints` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Nothing stopped duplicate rows from being written before these indexes
-- existed (the progress upsert in particular reads then writes, so two
-- concurrent toggles could each insert). A unique index cannot be created
-- over duplicates, so collapse them first, keeping the earliest row.
DELETE FROM `bookmarks` WHERE `rowid` NOT IN (
	SELECT MIN(`rowid`) FROM `bookmarks` GROUP BY `userId`,`courseId`
);--> statement-breakpoint
CREATE UNIQUE INDEX `bookmarks_userId_courseId_unique` ON `bookmarks` (`userId`,`courseId`);--> statement-breakpoint
CREATE INDEX `courseResources_courseId_idx` ON `courseResources` (`courseId`);--> statement-breakpoint
-- Nothing stopped duplicate rows from being written before these indexes
-- existed (the progress upsert in particular reads then writes, so two
-- concurrent toggles could each insert). A unique index cannot be created
-- over duplicates, so collapse them first, keeping the earliest row.
DELETE FROM `enrollments` WHERE `rowid` NOT IN (
	SELECT MIN(`rowid`) FROM `enrollments` GROUP BY `userId`,`courseId`
);--> statement-breakpoint
CREATE UNIQUE INDEX `enrollments_userId_courseId_unique` ON `enrollments` (`userId`,`courseId`);--> statement-breakpoint
-- Nothing stopped duplicate rows from being written before these indexes
-- existed (the progress upsert in particular reads then writes, so two
-- concurrent toggles could each insert). A unique index cannot be created
-- over duplicates, so collapse them first, keeping the earliest row.
DELETE FROM `lessonProgress` WHERE `rowid` NOT IN (
	SELECT MIN(`rowid`) FROM `lessonProgress` GROUP BY `userId`,`lessonId`
);--> statement-breakpoint
CREATE UNIQUE INDEX `lessonProgress_userId_lessonId_unique` ON `lessonProgress` (`userId`,`lessonId`);--> statement-breakpoint
CREATE INDEX `lessons_courseId_idx` ON `lessons` (`courseId`);--> statement-breakpoint
CREATE INDEX `purchases_userId_postId_idx` ON `purchases` (`userId`,`postId`);