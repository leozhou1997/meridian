CREATE TABLE `dealStrategyNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`tenantId` int NOT NULL,
	`category` enum('pricing','relationship','competitive','internal','other') NOT NULL DEFAULT 'other',
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dealStrategyNotes_id` PRIMARY KEY(`id`)
);
