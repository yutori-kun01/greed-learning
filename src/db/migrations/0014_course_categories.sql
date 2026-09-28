CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
-- The three categories that used to be hard-coded, under the same ids, so
-- existing courses keep their category.
INSERT OR IGNORE INTO `categories` (`id`, `name`, `sortOrder`, `createdAt`) VALUES
  ('strategy', '戦略・思考', 1, '2026-09-28T00:00:00.000Z'),
  ('traffic', '集客・リスト', 2, '2026-09-28T00:00:00.000Z'),
  ('content', 'コンテンツ', 3, '2026-09-28T00:00:00.000Z');
