ALTER TABLE `content_items` ADD `source_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_items` ADD `source_script` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_items` ADD `structure_template` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_items` ADD `adaptation_notes` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_items` ADD `estimated_minutes` integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE `content_items` ADD `image_count` integer DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE `content_items` ADD `visual_plan` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_items` ADD `opening_animation` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_items` ADD `voice_profile` text DEFAULT '历史讲解固定音色' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_items` ADD `voice_status` text DEFAULT 'not_configured' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_items` ADD `voice_reference_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_items` ADD `audio_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_items` ADD `edit_tool` text DEFAULT '待确认' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_items` ADD `edit_plan` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_items` ADD `metrics_screenshot_url` text DEFAULT '' NOT NULL;