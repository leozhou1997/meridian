ALTER TABLE `nextActions` ADD `snapshotId` int;--> statement-breakpoint
ALTER TABLE `nextActions` ADD `status` enum('pending','accepted','rejected','later','in_progress','done','blocked') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `nextActions` ADD `source` enum('manual','ai_suggested') DEFAULT 'manual' NOT NULL;