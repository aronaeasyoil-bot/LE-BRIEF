CREATE TABLE `magazinePaymentRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`magazineId` int NOT NULL,
	`fullName` varchar(200) NOT NULL,
	`email` varchar(320) NOT NULL,
	`whatsappNumber` varchar(40),
	`paymentMethod` enum('wave') NOT NULL DEFAULT 'wave',
	`amountFcfa` int NOT NULL DEFAULT 1000,
	`proofUrl` text NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`accessToken` varchar(128),
	`adminNotes` text,
	`approvedAt` timestamp,
	`rejectedAt` timestamp,
	`accessTokenSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `magazinePaymentRequests_id` PRIMARY KEY(`id`),
	CONSTRAINT `magazinePaymentRequests_accessToken_unique` UNIQUE(`accessToken`)
);
--> statement-breakpoint
ALTER TABLE `magazines` ADD `isPremium` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `magazines` ADD `previewPageCount` int DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE `magazines` ADD `priceFcfa` int DEFAULT 1000 NOT NULL;