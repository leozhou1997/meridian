ALTER TABLE `deals` MODIFY COLUMN `buyingStages` json;--> statement-breakpoint
ALTER TABLE `snapshots` MODIFY COLUMN `keyRisks` json;--> statement-breakpoint
ALTER TABLE `stakeholders` MODIFY COLUMN `roles` json;--> statement-breakpoint
ALTER TABLE `stakeholders` MODIFY COLUMN `personalSignals` json;