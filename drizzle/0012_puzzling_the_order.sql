ALTER TABLE `kbDocuments` MODIFY COLUMN `fileType` enum('pdf','doc','md','txt','xlsx','docx') NOT NULL DEFAULT 'md';--> statement-breakpoint
ALTER TABLE `kbDocuments` ADD `extractedContent` text;--> statement-breakpoint
ALTER TABLE `kbDocuments` ADD `originalFileName` varchar(500);--> statement-breakpoint
ALTER TABLE `kbDocuments` ADD `mimeType` varchar(100);--> statement-breakpoint
ALTER TABLE `kbDocuments` ADD `processingStatus` enum('pending','processing','completed','failed') DEFAULT 'completed' NOT NULL;