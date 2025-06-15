PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_api_key` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`value` text NOT NULL,
	`last_used` integer,
	`user_id` text NOT NULL,
	`user_mcp_id` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_mcp_id`) REFERENCES `user_mcp`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_api_key`("id", "name", "value", "last_used", "user_id", "user_mcp_id") SELECT "id", "name", "value", "last_used", "user_id", "user_mcp_id" FROM `api_key`;--> statement-breakpoint
DROP TABLE `api_key`;--> statement-breakpoint
ALTER TABLE `__new_api_key` RENAME TO `api_key`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `api_key_user_id_name_unique` ON `api_key` (`user_id`,`name`);--> statement-breakpoint
CREATE TABLE `__new_message` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text DEFAULT 'user' NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'success' NOT NULL,
	`chat_id` integer NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP),
	`metadata` text,
	FOREIGN KEY (`chat_id`) REFERENCES `chat`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_message`("id", "type", "content", "status", "chat_id", "created_at", "updated_at", "metadata") SELECT "id", "type", "content", "status", "chat_id", "created_at", "updated_at", "metadata" FROM `message`;--> statement-breakpoint
DROP TABLE `message`;--> statement-breakpoint
ALTER TABLE `__new_message` RENAME TO `message`;