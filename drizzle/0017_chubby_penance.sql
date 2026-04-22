CREATE TABLE `dealChatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL DEFAULT 'user',
	`content` text NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dealChatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dealDimensions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`tenantId` int NOT NULL,
	`dimensionKey` varchar(50) NOT NULL,
	`status` enum('not_started','in_progress','completed','blocked') NOT NULL DEFAULT 'not_started',
	`notes` text,
	`aiSummary` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dealDimensions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `nextActions` ADD `dimensionKey` varchar(50);