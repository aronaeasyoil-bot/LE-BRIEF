CREATE TABLE `automaticSourceItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` enum('reuters') NOT NULL,
	`sourceSection` varchar(100) NOT NULL,
	`sourceUrl` varchar(767) NOT NULL,
	`sourceTitle` varchar(500) NOT NULL,
	`sourceSummary` text,
	`sourceKeywords` text,
	`sourcePublishedAt` timestamp,
	`sourceMetadataJson` text,
	`generatedTitleFr` varchar(500),
	`generatedExcerptFr` text,
	`generatedMetaDescription` varchar(320),
	`generatedTags` text,
	`generatedImageUrl` text,
	`publishedArticleId` int,
	`publishedAt` timestamp,
	`lastAttemptAt` timestamp,
	`status` enum('detected','published','error') NOT NULL DEFAULT 'detected',
	`errorMessage` text,
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automaticSourceItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `automaticSourceItems_sourceUrl_unique` UNIQUE(`sourceUrl`)
);
--> statement-breakpoint
CREATE TABLE `sourceAutomationSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` enum('reuters') NOT NULL,
	`sourceLabel` varchar(200) NOT NULL,
	`sourceUrl` varchar(500) NOT NULL,
	`autoPublish` boolean NOT NULL DEFAULT true,
	`lastRunAt` timestamp,
	`lastSuccessAt` timestamp,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sourceAutomationSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `sourceAutomationSettings_provider_unique` UNIQUE(`provider`)
);
--> statement-breakpoint
ALTER TABLE `articles` ADD `sourceName` varchar(200);--> statement-breakpoint
ALTER TABLE `articles` ADD `sourceUrl` varchar(767);--> statement-breakpoint
ALTER TABLE `articles` ADD `tags` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `metaDescription` varchar(320);