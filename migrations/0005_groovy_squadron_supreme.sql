CREATE TYPE "public"."sms_message_status" AS ENUM('queued', 'sent', 'delivered', 'failed', 'undelivered');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_message_status" AS ENUM('queued', 'sent', 'delivered', 'read', 'failed', 'undelivered');--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"discount_type" varchar(20) NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"company_id" varchar,
	"expires_at" timestamp,
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "revenue_recognition_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" varchar NOT NULL,
	"company_id" varchar NOT NULL,
	"recognition_date" timestamp NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"recognition_type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sms_message_events" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"message_id" text NOT NULL,
	"twilio_message_sid" text,
	"twilio_account_sid" text,
	"twilio_status" "sms_message_status",
	"from" text NOT NULL,
	"to" text NOT NULL,
	"body" text NOT NULL,
	"num_segments" integer,
	"num_media" integer DEFAULT 0,
	"media_urls" jsonb,
	"carrier_name" text,
	"carrier_type" text,
	"price" numeric(10, 4),
	"price_unit" text DEFAULT 'USD',
	"status" "sms_message_status" DEFAULT 'queued' NOT NULL,
	"error_code" text,
	"error_message" text,
	"queued_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_message_events" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"message_id" text NOT NULL,
	"twilio_message_sid" text,
	"twilio_account_sid" text,
	"twilio_status" "whatsapp_message_status",
	"from" text NOT NULL,
	"to" text NOT NULL,
	"num_segments" integer,
	"num_media" integer DEFAULT 0,
	"media_urls" jsonb,
	"price" numeric(10, 4),
	"price_unit" text DEFAULT 'USD',
	"status" "whatsapp_message_status" DEFAULT 'queued' NOT NULL,
	"error_code" text,
	"error_message" text,
	"queued_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_recognition_events" ADD CONSTRAINT "revenue_recognition_events_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_recognition_events" ADD CONSTRAINT "revenue_recognition_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_message_events" ADD CONSTRAINT "sms_message_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_message_events" ADD CONSTRAINT "sms_message_events_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_message_events" ADD CONSTRAINT "whatsapp_message_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_message_events" ADD CONSTRAINT "whatsapp_message_events_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_revenue_recognition_invoice" ON "revenue_recognition_events" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_revenue_recognition_company" ON "revenue_recognition_events" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_revenue_recognition_date" ON "revenue_recognition_events" USING btree ("recognition_date");--> statement-breakpoint
CREATE INDEX "sms_events_company_idx" ON "sms_message_events" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "sms_events_message_idx" ON "sms_message_events" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "sms_events_twilio_sid_idx" ON "sms_message_events" USING btree ("twilio_message_sid");--> statement-breakpoint
CREATE INDEX "sms_events_status_idx" ON "sms_message_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sms_events_sent_at_idx" ON "sms_message_events" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "sms_events_to_idx" ON "sms_message_events" USING btree ("to");--> statement-breakpoint
CREATE INDEX "whatsapp_events_company_idx" ON "whatsapp_message_events" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "whatsapp_events_message_idx" ON "whatsapp_message_events" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "whatsapp_events_twilio_sid_idx" ON "whatsapp_message_events" USING btree ("twilio_message_sid");--> statement-breakpoint
CREATE INDEX "whatsapp_events_status_idx" ON "whatsapp_message_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "whatsapp_events_sent_at_idx" ON "whatsapp_message_events" USING btree ("sent_at");