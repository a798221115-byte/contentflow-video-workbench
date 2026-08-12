CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`positioning` text NOT NULL,
	`color` text NOT NULL,
	`weekly_target` integer DEFAULT 4 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `content_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`title` text NOT NULL,
	`topic` text DEFAULT '' NOT NULL,
	`stage` text DEFAULT 'idea' NOT NULL,
	`hook` text DEFAULT '' NOT NULL,
	`script` text DEFAULT '' NOT NULL,
	`shot_notes` text DEFAULT '' NOT NULL,
	`publish_copy` text DEFAULT '' NOT NULL,
	`publish_date` text DEFAULT '' NOT NULL,
	`owner` text DEFAULT '我' NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`likes` integer DEFAULT 0 NOT NULL,
	`comments` integer DEFAULT 0 NOT NULL,
	`shares` integer DEFAULT 0 NOT NULL,
	`follows` integer DEFAULT 0 NOT NULL,
	`review` text DEFAULT '' NOT NULL,
	`next_action` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
