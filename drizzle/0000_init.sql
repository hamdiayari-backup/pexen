CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"session_id" text NOT NULL,
	"path" text NOT NULL,
	"referrer" text,
	"country" text,
	"city" text,
	"device" text NOT NULL,
	"duration_sec" integer,
	"ts" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"form_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"ip" text,
	"user_agent" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forms" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"recipient_emails" text[] DEFAULT '{}' NOT NULL,
	"success_path" text NOT NULL,
	"fields" jsonb NOT NULL,
	"honeypot_field" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"url" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"alt" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menus" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"items" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" text PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"title" text NOT NULL,
	"status" text NOT NULL,
	"content_source" text NOT NULL,
	"template" text NOT NULL,
	"blocks" jsonb NOT NULL,
	"seo" jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"cover_image" text,
	"blocks" jsonb NOT NULL,
	"seo" jsonb NOT NULL,
	"status" text NOT NULL,
	"author" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "redirects" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_path" text NOT NULL,
	"to_path" text NOT NULL,
	"permanent" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revisions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"label" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"author_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"status" text NOT NULL,
	"source" text,
	"confirm_token" text,
	"created_at" timestamp with time zone NOT NULL,
	"confirmed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"password_hash" text NOT NULL,
	"salt" text NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "analytics_ts_idx" ON "analytics_events" USING btree ("ts");--> statement-breakpoint
CREATE INDEX "analytics_kind_ts_idx" ON "analytics_events" USING btree ("kind","ts");--> statement-breakpoint
CREATE INDEX "analytics_session_idx" ON "analytics_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "form_submissions_created_idx" ON "form_submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "form_submissions_form_idx" ON "form_submissions" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "media_created_idx" ON "media" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pages_path_uq" ON "pages" USING btree ("path");--> statement-breakpoint
CREATE INDEX "pages_status_idx" ON "pages" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "posts_slug_uq" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "posts_status_idx" ON "posts" USING btree ("status","published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "redirects_from_uq" ON "redirects" USING btree ("from_path");--> statement-breakpoint
CREATE INDEX "revisions_entity_idx" ON "revisions" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "subscribers_email_uq" ON "newsletter_subscribers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "subscribers_token_idx" ON "newsletter_subscribers" USING btree ("confirm_token");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_uq" ON "admin_users" USING btree ("email");