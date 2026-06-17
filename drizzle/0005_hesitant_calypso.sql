CREATE TABLE `marketPrices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(80) NOT NULL,
	`name` varchar(200) NOT NULL,
	`price` decimal(14,4) NOT NULL,
	`changePercent` decimal(10,4) NOT NULL,
	`unit` varchar(40) NOT NULL,
	`decimals` int NOT NULL DEFAULT 2,
	`sourceLabel` varchar(200),
	`sourceUrl` varchar(767),
	`sortOrder` int NOT NULL DEFAULT 0,
	`lastUpdatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketPrices_id` PRIMARY KEY(`id`),
	CONSTRAINT `marketPrices_code_unique` UNIQUE(`code`)
);
