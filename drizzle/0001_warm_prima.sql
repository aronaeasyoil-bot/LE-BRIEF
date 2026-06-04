CREATE TABLE `articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titleFr` varchar(500),
	`titleEn` varchar(500),
	`titleAr` varchar(500),
	`excerptFr` text,
	`excerptEn` text,
	`excerptAr` text,
	`contentFr` text,
	`contentEn` text,
	`contentAr` text,
	`categoryId` int NOT NULL,
	`imageUrl` text,
	`authorName` varchar(200),
	`featured` boolean NOT NULL DEFAULT false,
	`published` boolean NOT NULL DEFAULT false,
	`language` enum('fr','en','ar','all') NOT NULL DEFAULT 'all',
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `articles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`nameFr` varchar(200) NOT NULL,
	`nameEn` varchar(200) NOT NULL,
	`nameAr` varchar(200) NOT NULL,
	`icon` varchar(100),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titleFr` varchar(500),
	`titleEn` varchar(500),
	`titleAr` varchar(500),
	`descriptionFr` text,
	`descriptionEn` text,
	`descriptionAr` text,
	`location` varchar(300),
	`eventDate` timestamp,
	`imageUrl` text,
	`published` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`language` enum('fr','en','ar') NOT NULL DEFAULT 'fr',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscribers_email_unique` UNIQUE(`email`)
);
