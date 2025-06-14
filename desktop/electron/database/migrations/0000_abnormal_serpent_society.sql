CREATE TABLE `agent_style` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `agent_to_agent_style` (
	`agent_id` integer NOT NULL,
	`agent_style_id` integer NOT NULL,
	PRIMARY KEY(`agent_id`, `agent_style_id`),
	FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`agent_style_id`) REFERENCES `agent_style`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `agent` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`is_main` integer DEFAULT false NOT NULL,
	`instruction` text NOT NULL,
	`user_id` text NOT NULL,
	`llm_id` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`llm_id`) REFERENCES `llm`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `agent_to_user_mcp` (
	`agent_id` integer NOT NULL,
	`user_mcp_id` integer NOT NULL,
	`selected_tools` blob,
	PRIMARY KEY(`agent_id`, `user_mcp_id`),
	FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_mcp_id`) REFERENCES `user_mcp`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `api_key` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`value` text NOT NULL,
	`last_used` integer,
	`user_id` text NOT NULL,
	`user_mcp_id` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_mcp_id`) REFERENCES `mcp`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_key_user_id_name_unique` ON `api_key` (`user_id`,`name`);--> statement-breakpoint
CREATE TABLE `chat` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text DEFAULT 'New Chat' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `llm` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`display_name` text NOT NULL,
	`description` text NOT NULL,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`model_path` text NOT NULL,
	`config` blob,
	`is_default` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mcp` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`icon` text NOT NULL,
	`tools` blob
);
--> statement-breakpoint
CREATE TABLE `user_mcp` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`mcp_id` integer NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`is_installed` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mcp_id`) REFERENCES `mcp`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_mcp_user_id_mcp_id_unique` ON `user_mcp` (`user_id`,`mcp_id`);--> statement-breakpoint
CREATE TABLE `message` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text DEFAULT 'user' NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'success' NOT NULL,
	`chat_id` integer NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP),
	`metadata` text DEFAULT '{}',
	FOREIGN KEY (`chat_id`) REFERENCES `chat`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `setting` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`type` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `setting_user_id_key_unique` ON `setting` (`user_id`,`key`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`picture` text NOT NULL
);
