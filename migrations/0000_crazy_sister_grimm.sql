CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"excerpt" text DEFAULT '',
	"image_url" text DEFAULT '',
	"published" boolean DEFAULT false,
	"author_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"user_name" text NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" integer,
	"details" jsonb,
	"ip_address" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"image_url" text NOT NULL,
	"mobile_image_url" text,
	"link_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"parent_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "featured_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "filter_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"filter_type_id" integer NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "filter_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"input_type" text DEFAULT 'select' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"category_ids" integer[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "filter_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"filter_type_id" integer NOT NULL,
	"filter_option_id" integer,
	"count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"current_people" integer DEFAULT 0 NOT NULL,
	"min_people" integer NOT NULL,
	"status" text DEFAULT 'aberto' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"url" text NOT NULL,
	"mime_type" text DEFAULT '',
	"size" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"user_id" integer,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"reserve_status" text DEFAULT 'pendente',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "navigation_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"location" text DEFAULT 'footer' NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"sort_order" integer DEFAULT 0,
	"active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "order_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "order_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"changed_by_user_id" integer,
	"changed_by_name" text DEFAULT '',
	"reason" text DEFAULT '',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"items" jsonb NOT NULL,
	"total" numeric NOT NULL,
	"status" text DEFAULT 'recebido' NOT NULL,
	"fulfillment_type" text DEFAULT 'pickup' NOT NULL,
	"pickup_point_id" integer,
	"status_changed_at" timestamp DEFAULT now(),
	"pickup_deadline" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pickup_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"city" text DEFAULT 'Formosa - GO' NOT NULL,
	"phone" text DEFAULT '',
	"hours" text DEFAULT '',
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_filters" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"filter_type_id" integer NOT NULL,
	"filter_option_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text NOT NULL,
	"original_price" numeric NOT NULL,
	"group_price" numeric NOT NULL,
	"now_price" numeric,
	"min_people" integer DEFAULT 10 NOT NULL,
	"stock" integer DEFAULT 100 NOT NULL,
	"reserve_fee" numeric DEFAULT '0',
	"category" text NOT NULL,
	"sale_mode" text DEFAULT 'grupo' NOT NULL,
	"fulfillment_type" text DEFAULT 'pickup' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"category_id" integer,
	"subcategory_id" integer,
	"brand" text,
	"weight" text,
	"dimensions" text,
	"specifications" text,
	"sale_ends_at" timestamp,
	"created_by" integer,
	"approved" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "site_visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"visitor_id" text NOT NULL,
	"page" text DEFAULT '/',
	"referrer" text DEFAULT '',
	"user_agent" text DEFAULT '',
	"ip_address" text DEFAULT '',
	"user_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sponsor_banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"image_url" text NOT NULL,
	"link_url" text DEFAULT '' NOT NULL,
	"position" text DEFAULT 'sidebar' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text DEFAULT '',
	"email" text NOT NULL,
	"password" text NOT NULL,
	"phone" text DEFAULT '',
	"role" text DEFAULT 'user' NOT NULL,
	"email_verified" boolean DEFAULT false,
	"phone_verified" boolean DEFAULT false,
	"address_cep" text DEFAULT '',
	"address_street" text DEFAULT '',
	"address_number" text DEFAULT '',
	"address_complement" text DEFAULT '',
	"address_district" text DEFAULT '',
	"address_city" text DEFAULT '',
	"address_state" text DEFAULT '',
	"pickup_point_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"embed_url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
