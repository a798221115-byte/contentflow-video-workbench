CREATE INDEX `idx_content_items_account_stage` ON `content_items` (`account_id`,`stage`);--> statement-breakpoint
CREATE INDEX `idx_content_items_updated_at` ON `content_items` (`updated_at`);