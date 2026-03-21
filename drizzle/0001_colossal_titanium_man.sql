CREATE TABLE `aiLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int NOT NULL,
	`feature` varchar(100) NOT NULL,
	`promptVersion` varchar(50),
	`inputContext` json,
	`systemPrompt` text,
	`userPrompt` text,
	`rawOutput` text,
	`parsedOutput` json,
	`modelUsed` varchar(100),
	`tokensUsed` int,
	`latencyMs` int,
	`rating` enum('good','bad','edited'),
	`editedOutput` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`company` varchar(255) NOT NULL,
	`website` varchar(500),
	`logo` varchar(500),
	`stage` enum('Discovery','Demo','Technical Evaluation','POC','Negotiation','Closed Won','Closed Lost') NOT NULL DEFAULT 'Discovery',
	`value` int NOT NULL DEFAULT 0,
	`confidenceScore` int NOT NULL DEFAULT 50,
	`daysInStage` int NOT NULL DEFAULT 0,
	`lastActivity` varchar(100),
	`riskOneLiner` text,
	`companyInfo` text,
	`buyingStages` json DEFAULT ('[]'),
	`isArchived` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kbDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('product','playbook','icp') NOT NULL DEFAULT 'product',
	`description` text,
	`fileType` enum('pdf','doc','md','txt') NOT NULL DEFAULT 'md',
	`content` text,
	`fileUrl` varchar(500),
	`fileSize` varchar(50),
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kbDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`tenantId` int NOT NULL,
	`date` timestamp NOT NULL,
	`type` enum('Discovery Call','Demo','Technical Review','POC Check-in','Negotiation','Executive Briefing','Follow-up') NOT NULL DEFAULT 'Follow-up',
	`keyParticipant` varchar(255),
	`summary` text,
	`duration` int DEFAULT 30,
	`transcript` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nextActions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`tenantId` int NOT NULL,
	`stakeholderId` int,
	`text` text NOT NULL,
	`dueDate` timestamp,
	`completed` boolean NOT NULL DEFAULT false,
	`priority` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nextActions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promptTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feature` varchar(100) NOT NULL,
	`version` varchar(50) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT false,
	`systemPrompt` text NOT NULL,
	`userPromptTemplate` text NOT NULL,
	`description` varchar(500),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promptTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`tenantId` int NOT NULL,
	`date` timestamp NOT NULL,
	`whatsHappening` text,
	`whatsNext` text,
	`keyRisks` json DEFAULT ('[]'),
	`confidenceScore` int NOT NULL DEFAULT 50,
	`confidenceChange` int NOT NULL DEFAULT 0,
	`interactionType` varchar(100),
	`keyParticipant` varchar(255),
	`aiGenerated` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stakeholders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`title` varchar(255),
	`role` enum('Champion','Decision Maker','Influencer','Blocker','User','Evaluator') NOT NULL DEFAULT 'User',
	`roles` json DEFAULT ('[]'),
	`sentiment` enum('Positive','Neutral','Negative') NOT NULL DEFAULT 'Neutral',
	`engagement` enum('High','Medium','Low') NOT NULL DEFAULT 'Medium',
	`avatar` varchar(500),
	`email` varchar(320),
	`linkedIn` varchar(500),
	`keyInsights` text,
	`personalNotes` text,
	`personalSignals` json DEFAULT ('[]'),
	`mapX` float,
	`mapY` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stakeholders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenantMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','admin','member') NOT NULL DEFAULT 'member',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tenantMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`plan` enum('trial','starter','pro','enterprise') NOT NULL DEFAULT 'trial',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_slug_unique` UNIQUE(`slug`)
);
