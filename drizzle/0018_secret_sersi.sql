CREATE TABLE `stakeholderNeeds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`tenantId` int NOT NULL,
	`stakeholderId` int NOT NULL,
	`needType` enum('organizational','professional','personal') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('unmet','in_progress','satisfied','blocked') NOT NULL DEFAULT 'unmet',
	`dimensionKey` varchar(50),
	`priority` enum('critical','important','nice_to_have') NOT NULL DEFAULT 'important',
	`aiGenerated` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stakeholderNeeds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `nextActions` ADD `needId` int;