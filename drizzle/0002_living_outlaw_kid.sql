CREATE TABLE `advertisements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titleFr` varchar(300),
	`titleEn` varchar(300),
	`titleAr` varchar(300),
	`imageUrl` text,
	`videoUrl` text,
	`linkUrl` varchar(500),
	`active` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `advertisements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `magazines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titleFr` varchar(500) NOT NULL,
	`titleEn` varchar(500) NOT NULL,
	`titleAr` varchar(500) NOT NULL,
	`issueNumber` int NOT NULL,
	`pdfUrl` text NOT NULL,
	`coverImageUrl` text,
	`publishedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `magazines_id` PRIMARY KEY(`id`)
);
