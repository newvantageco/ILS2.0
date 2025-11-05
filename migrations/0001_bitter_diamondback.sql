CREATE TYPE "public"."ai_notification_priority" AS ENUM('critical', 'high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."ai_notification_type" AS ENUM('briefing', 'alert', 'reminder', 'insight');--> statement-breakpoint
CREATE TYPE "public"."email_event_type" AS ENUM('sent', 'delivered', 'opened', 'clicked', 'bounced', 'spam', 'unsubscribed');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'spam');--> statement-breakpoint
CREATE TYPE "public"."email_type" AS ENUM('invoice', 'receipt', 'prescription_reminder', 'recall_notification', 'appointment_reminder', 'order_confirmation', 'order_update', 'marketing', 'general');--> statement-breakpoint
CREATE TYPE "public"."movement_type" AS ENUM('sale', 'refund', 'adjustment', 'received', 'transfer_out', 'transfer_in', 'damaged', 'initial');--> statement-breakpoint
CREATE TABLE "ai_notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"user_id" varchar,
	"type" "ai_notification_type" NOT NULL,
	"priority" "ai_notification_priority" DEFAULT 'medium' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"summary" text,
	"recommendation" text,
	"action_url" text,
	"action_label" text,
	"data" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"is_dismissed" boolean DEFAULT false NOT NULL,
	"dismissed_at" timestamp,
	"expires_at" timestamp,
	"generated_by" varchar(50) DEFAULT 'proactive_insights',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"recipient_email" varchar(255) NOT NULL,
	"recipient_name" varchar(255),
	"patient_id" varchar,
	"email_type" "email_type" NOT NULL,
	"subject" varchar(500) NOT NULL,
	"html_content" text NOT NULL,
	"text_content" text,
	"status" "email_status" DEFAULT 'queued' NOT NULL,
	"tracking_id" varchar(100),
	"template_id" varchar,
	"related_entity_type" varchar(50),
	"related_entity_id" varchar,
	"sent_by" varchar NOT NULL,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"open_count" integer DEFAULT 0 NOT NULL,
	"first_opened_at" timestamp,
	"last_opened_at" timestamp,
	"click_count" integer DEFAULT 0 NOT NULL,
	"first_clicked_at" timestamp,
	"last_clicked_at" timestamp,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_logs_tracking_id_unique" UNIQUE("tracking_id")
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"email_type" "email_type" NOT NULL,
	"subject" varchar(500) NOT NULL,
	"html_content" text NOT NULL,
	"text_content" text,
	"variables" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_tracking_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_log_id" varchar NOT NULL,
	"event_type" "email_event_type" NOT NULL,
	"event_data" jsonb,
	"user_agent" text,
	"ip_address" varchar(45),
	"location" jsonb,
	"device" varchar(50),
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"movement_type" "movement_type" NOT NULL,
	"quantity" integer NOT NULL,
	"previous_stock" integer NOT NULL,
	"new_stock" integer NOT NULL,
	"reference_type" varchar(50),
	"reference_id" varchar,
	"reason" text,
	"notes" text,
	"performed_by" varchar NOT NULL,
	"location_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "low_stock_alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"variant_id" varchar,
	"alert_type" varchar(50) NOT NULL,
	"current_stock" integer NOT NULL,
	"threshold" integer NOT NULL,
	"status" varchar(50) DEFAULT 'active',
	"acknowledged_by" varchar,
	"acknowledged_at" timestamp,
	"resolved_at" timestamp,
	"suggested_reorder_quantity" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar NOT NULL,
	"company_id" varchar NOT NULL,
	"variant_sku" varchar(100) NOT NULL,
	"variant_name" varchar(255) NOT NULL,
	"color" varchar(50),
	"size" varchar(50),
	"style" varchar(100),
	"attributes" jsonb,
	"unit_price" numeric(10, 2),
	"cost" numeric(10, 2),
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 10,
	"barcode" varchar(100),
	"image_url" text,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "created_by" varchar(255);--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "updated_by" varchar(255);--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "change_history" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "created_by" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "updated_by" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "change_history" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "created_by" varchar(255);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "updated_by" varchar(255);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "change_history" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "created_by" varchar(255);--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "updated_by" varchar(255);--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "change_history" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "ai_notifications" ADD CONSTRAINT "ai_notifications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_notifications" ADD CONSTRAINT "ai_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_tracking_events" ADD CONSTRAINT "email_tracking_events_email_log_id_email_logs_id_fk" FOREIGN KEY ("email_log_id") REFERENCES "public"."email_logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "low_stock_alerts" ADD CONSTRAINT "low_stock_alerts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "low_stock_alerts" ADD CONSTRAINT "low_stock_alerts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "low_stock_alerts" ADD CONSTRAINT "low_stock_alerts_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "low_stock_alerts" ADD CONSTRAINT "low_stock_alerts_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_notifications_company" ON "ai_notifications" USING btree ("company_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_notifications_user" ON "ai_notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_ai_notifications_priority" ON "ai_notifications" USING btree ("priority","created_at");--> statement-breakpoint
CREATE INDEX "idx_email_logs_company" ON "email_logs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_email_logs_recipient" ON "email_logs" USING btree ("recipient_email");--> statement-breakpoint
CREATE INDEX "idx_email_logs_patient" ON "email_logs" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_email_logs_type" ON "email_logs" USING btree ("email_type");--> statement-breakpoint
CREATE INDEX "idx_email_logs_status" ON "email_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_email_logs_sent_at" ON "email_logs" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "idx_email_logs_tracking_id" ON "email_logs" USING btree ("tracking_id");--> statement-breakpoint
CREATE INDEX "idx_email_logs_related" ON "email_logs" USING btree ("related_entity_type","related_entity_id");--> statement-breakpoint
CREATE INDEX "idx_email_templates_company" ON "email_templates" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_email_templates_type" ON "email_templates" USING btree ("email_type");--> statement-breakpoint
CREATE INDEX "idx_email_templates_active" ON "email_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_email_tracking_events_log" ON "email_tracking_events" USING btree ("email_log_id");--> statement-breakpoint
CREATE INDEX "idx_email_tracking_events_type" ON "email_tracking_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_email_tracking_events_timestamp" ON "email_tracking_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_inventory_movements_company" ON "inventory_movements" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_movements_product" ON "inventory_movements" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_movements_type" ON "inventory_movements" USING btree ("movement_type");--> statement-breakpoint
CREATE INDEX "idx_inventory_movements_date" ON "inventory_movements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_inventory_movements_performed_by" ON "inventory_movements" USING btree ("performed_by");--> statement-breakpoint
CREATE INDEX "idx_low_stock_alerts_company" ON "low_stock_alerts" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_low_stock_alerts_product" ON "low_stock_alerts" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_low_stock_alerts_status" ON "low_stock_alerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_product_variants_product" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_variants_company" ON "product_variants" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_product_variants_sku" ON "product_variants" USING btree ("variant_sku");--> statement-breakpoint
CREATE INDEX "idx_product_variants_barcode" ON "product_variants" USING btree ("barcode");