CREATE TABLE `official_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`fetched_at` integer NOT NULL
);
