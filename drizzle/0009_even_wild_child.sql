CREATE TABLE `accessRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`source` varchar(100) NOT NULL DEFAULT 'landing_page',
	`status` enum('pending','contacted','converted','rejected') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accessRequests_id` PRIMARY KEY(`id`)
);
