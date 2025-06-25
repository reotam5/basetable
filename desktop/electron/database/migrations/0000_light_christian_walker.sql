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
CREATE TABLE `agent_to_mcp_server` (
	`agent_id` integer NOT NULL,
	`mcp_server_id` integer NOT NULL,
	`selected_tools` blob,
	PRIMARY KEY(`agent_id`, `mcp_server_id`),
	FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mcp_server_id`) REFERENCES `mcp_server`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `api_key` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`value` text NOT NULL,
	`last_used` integer,
	`user_id` text NOT NULL,
	`mcp_server_id` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mcp_server_id`) REFERENCES `mcp_server`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_key_user_id_name_unique` ON `api_key` (`user_id`,`name`);--> statement-breakpoint
CREATE TABLE `chat` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text DEFAULT 'New Chat' NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP),
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
	`is_default` integer DEFAULT false NOT NULL,
	`download_url` text
);
--> statement-breakpoint
CREATE TABLE `mcp_server` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text,
	`available_tools` blob,
	`confirmation_bypass_tools` blob,
	`server_config` blob,
	`is_active` integer DEFAULT false NOT NULL,
	`is_installed` integer DEFAULT false NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `message` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`content` text NOT NULL,
	`thought` text,
	`status` text DEFAULT 'success' NOT NULL,
	`chat_id` integer NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP),
	`metadata` blob,
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
CREATE TABLE `tool_call` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tool_call_id` text,
	`chat_id` integer NOT NULL,
	`message_id` integer NOT NULL,
	`mcp_server_id` integer,
	`status` text NOT NULL,
	`function_name` text NOT NULL,
	`function_args` text,
	`function_return` text,
	`execution_start_at` integer,
	`execution_end_at` integer,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`chat_id`) REFERENCES `chat`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`message_id`) REFERENCES `message`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`mcp_server_id`) REFERENCES `mcp_server`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`picture` text NOT NULL,
	`saw_model_download` integer DEFAULT false
);
