CREATE TYPE "public"."gdpr_data_subject_type" AS ENUM('patient', 'user', 'employee', 'customer');--> statement-breakpoint
CREATE TYPE "public"."gdpr_deletion_status" AS ENUM('pending', 'approved', 'rejected', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."gdpr_deletion_type" AS ENUM('anonymization', 'hard_delete');--> statement-breakpoint
CREATE TABLE "gdpr_deletion_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"data_subject_id" text NOT NULL,
	"data_subject_type" "gdpr_data_subject_type" NOT NULL,
	"data_subject_email" text,
	"data_subject_name" text,
	"requested_by" text NOT NULL,
	"deletion_type" "gdpr_deletion_type" DEFAULT 'anonymization' NOT NULL,
	"reason" text,
	"legal_basis" text,
	"status" "gdpr_deletion_status" DEFAULT 'pending' NOT NULL,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"rejected_by" text,
	"rejected_at" timestamp with time zone,
	"rejection_reason" text,
	"processing_started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"error_message" text,
	"retention_expires_at" timestamp with time zone,
	"tables_processed" jsonb,
	"records_deleted" integer DEFAULT 0,
	"records_anonymized" integer DEFAULT 0,
	"deletion_log" jsonb,
	"verification_token" text,
	"verified_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gdpr_deletion_requests" ADD CONSTRAINT "gdpr_deletion_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gdpr_deletion_requests" ADD CONSTRAINT "gdpr_deletion_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gdpr_deletion_requests" ADD CONSTRAINT "gdpr_deletion_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gdpr_deletion_requests" ADD CONSTRAINT "gdpr_deletion_requests_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gdpr_deletion_company_idx" ON "gdpr_deletion_requests" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "gdpr_deletion_data_subject_idx" ON "gdpr_deletion_requests" USING btree ("data_subject_id");--> statement-breakpoint
CREATE INDEX "gdpr_deletion_status_idx" ON "gdpr_deletion_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gdpr_deletion_requested_by_idx" ON "gdpr_deletion_requests" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "gdpr_deletion_created_at_idx" ON "gdpr_deletion_requests" USING btree ("created_at");