ALTER TYPE "public"."role" ADD VALUE 'store_manager';--> statement-breakpoint
CREATE TABLE "nhs_claims_retry_queue" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"claim_id" varchar(255) NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"last_attempt_at" timestamp,
	"next_retry_at" timestamp NOT NULL,
	"error_message" text,
	"error_code" varchar(50),
	"pcse_response" jsonb,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp,
	"failed_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nhs_claims" ADD COLUMN "domiciliary_justification" text;--> statement-breakpoint
ALTER TABLE "nhs_claims" ADD COLUMN "nhs_voucher_code" varchar(20);--> statement-breakpoint
ALTER TABLE "nhs_claims" ADD COLUMN "pcse_error" text;--> statement-breakpoint
ALTER TABLE "nhs_claims_retry_queue" ADD CONSTRAINT "nhs_claims_retry_queue_claim_id_nhs_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."nhs_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhs_claims_retry_queue" ADD CONSTRAINT "nhs_claims_retry_queue_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_retry_queue_next_retry" ON "nhs_claims_retry_queue" USING btree ("next_retry_at");--> statement-breakpoint
CREATE INDEX "idx_retry_queue_claim" ON "nhs_claims_retry_queue" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "idx_retry_queue_company" ON "nhs_claims_retry_queue" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_retry_queue_status" ON "nhs_claims_retry_queue" USING btree ("status");