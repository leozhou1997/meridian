CREATE TABLE `salesModels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`dimensions` json NOT NULL,
	`isBuiltIn` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `salesModels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `deals` ADD `salesModel` varchar(50) DEFAULT 'meddic' NOT NULL;--> statement-breakpoint
ALTER TABLE `deals` ADD `customModelId` int;