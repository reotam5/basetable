ALTER TABLE `llm` ADD `download_url` text;--> statement-breakpoint
ALTER TABLE `user` ADD `saw_model_download` integer DEFAULT false;