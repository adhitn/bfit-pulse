CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`area` text NOT NULL,
	`level` integer NOT NULL,
	`source` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `reports_time_idx` ON `reports` (`created_at`);--> statement-breakpoint
CREATE INDEX `reports_user_idx` ON `reports` (`user_id`);