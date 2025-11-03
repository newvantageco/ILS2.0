CREATE TYPE "public"."account_status" AS ENUM('pending', 'active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."adapt_alert_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."ai_conversation_status" AS ENUM('active', 'resolved', 'archived');--> statement-breakpoint
CREATE TYPE "public"."ai_message_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."analytics_event_type" AS ENUM('order_created', 'order_updated', 'quality_issue', 'equipment_status', 'material_usage', 'return_created', 'non_adapt_reported');--> statement-breakpoint
CREATE TYPE "public"."audit_event_type" AS ENUM('access', 'create', 'read', 'update', 'delete', 'login', 'logout', 'auth_attempt', 'permission_change', 'export', 'print');--> statement-breakpoint
CREATE TYPE "public"."company_status" AS ENUM('active', 'suspended', 'pending_approval', 'deactivated');--> statement-breakpoint
CREATE TYPE "public"."company_type" AS ENUM('ecp', 'lab', 'supplier', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."consult_priority" AS ENUM('normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('spec_sheet', 'certificate', 'sds', 'compliance', 'other');--> statement-breakpoint
CREATE TYPE "public"."equipment_status" AS ENUM('operational', 'maintenance', 'repair', 'offline');--> statement-breakpoint
CREATE TYPE "public"."examination_status" AS ENUM('in_progress', 'finalized');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'paid', 'void');--> statement-breakpoint
CREATE TYPE "public"."maintenance_type" AS ENUM('routine', 'repair', 'upgrade', 'emergency');--> statement-breakpoint
CREATE TYPE "public"."nlp_intent_tag" AS ENUM('first_time_pal', 'first_time_progressive', 'cvs_syndrome', 'computer_heavy_use', 'night_driving_complaint', 'glare_complaint', 'near_work_focus', 'occupational_hazard', 'sports_activity', 'high_prescription', 'presbyopia_onset', 'astigmatism_high', 'anisometropia', 'monovision_candidate', 'light_sensitive', 'blue_light_concern', 'uv_protection_needed', 'anti_reflective_needed', 'scratch_resistant_needed', 'impact_resistant_needed');--> statement-breakpoint
CREATE TYPE "public"."notification_severity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."notification_target_type" AS ENUM('user', 'role', 'organization');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('info', 'warning', 'error', 'success');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'in_production', 'quality_check', 'shipped', 'completed', 'on_hold', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'card', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."po_status" AS ENUM('draft', 'sent', 'acknowledged', 'in_transit', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('frame', 'contact_lens', 'solution', 'service');--> statement-breakpoint
CREATE TYPE "public"."quality_issue_type" AS ENUM('surface_defect', 'coating_defect', 'measurement_error', 'material_defect', 'processing_error', 'other');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ecp', 'admin', 'lab_tech', 'engineer', 'supplier', 'platform_admin', 'company_admin');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('full', 'free_ecp');--> statement-breakpoint
CREATE TYPE "public"."user_role_enhanced" AS ENUM('owner', 'admin', 'optometrist', 'dispenser', 'retail_assistant', 'lab_tech', 'engineer', 'supplier');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ecp', 'lab_tech', 'engineer', 'supplier', 'admin', 'platform_admin', 'company_admin');--> statement-breakpoint
CREATE TABLE "ai_conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"status" "ai_conversation_status" DEFAULT 'active' NOT NULL,
	"context" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_deployment_queue" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_version_id" varchar NOT NULL,
	"company_ids" jsonb,
	"deployment_type" varchar(50) NOT NULL,
	"scheduled_at" timestamp,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 5,
	"companies_deployed" integer DEFAULT 0,
	"companies_failed" integer DEFAULT 0,
	"processed_at" timestamp,
	"error_log" jsonb,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_dispensing_recommendations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"ecp_id" varchar NOT NULL,
	"nlp_analysis_id" varchar,
	"rx_data" jsonb NOT NULL,
	"clinical_intent_tags" jsonb NOT NULL,
	"clinical_notes_summary" text,
	"recommendations" jsonb NOT NULL,
	"lims_pattern_match" jsonb,
	"clinical_confidence_score" numeric(5, 4) NOT NULL,
	"recommendation_status" text DEFAULT 'pending',
	"accepted_recommendation" jsonb,
	"accepted_at" timestamp,
	"customization_applied" text,
	"customized_at" timestamp,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "ai_feedback" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"company_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"helpful" boolean,
	"accurate" boolean,
	"comments" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_knowledge_base" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"uploaded_by" varchar NOT NULL,
	"filename" text NOT NULL,
	"file_type" varchar NOT NULL,
	"file_size" integer,
	"file_url" text,
	"content" text,
	"summary" text,
	"tags" jsonb,
	"embeddings" jsonb,
	"category" varchar,
	"is_active" boolean DEFAULT true,
	"processing_status" varchar DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_learning_data" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"source_type" varchar NOT NULL,
	"source_id" varchar,
	"question" text,
	"answer" text,
	"context" jsonb,
	"category" varchar,
	"use_count" integer DEFAULT 0,
	"success_rate" numeric(3, 2) DEFAULT '1.00',
	"last_used" timestamp,
	"confidence" numeric(3, 2) DEFAULT '0.50',
	"is_validated" boolean DEFAULT false,
	"validated_by" varchar,
	"validated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"role" "ai_message_role" NOT NULL,
	"content" text NOT NULL,
	"used_external_ai" boolean DEFAULT true,
	"confidence" numeric(3, 2),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_model_deployments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"model_version_id" varchar NOT NULL,
	"version_number" varchar(50) NOT NULL,
	"deployment_status" varchar(50) DEFAULT 'active' NOT NULL,
	"deployed_at" timestamp DEFAULT now() NOT NULL,
	"deactivated_at" timestamp,
	"performance_metrics" jsonb,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "ai_model_versions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_number" varchar(50) NOT NULL,
	"model_name" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"created_by" varchar,
	"approved_by" varchar,
	"approved_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_model_versions_version_number_unique" UNIQUE("version_number")
);
--> statement-breakpoint
CREATE TABLE "ai_training_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_version_id" varchar NOT NULL,
	"job_type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'queued' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"training_dataset_ids" jsonb,
	"training_metrics" jsonb,
	"error_log" jsonb,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" "analytics_event_type" NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"source_id" varchar NOT NULL,
	"source_type" varchar NOT NULL,
	"data" jsonb NOT NULL,
	"metadata" jsonb,
	"organization_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" varchar,
	"user_email" varchar,
	"user_role" "user_role",
	"company_id" varchar,
	"event_type" "audit_event_type" NOT NULL,
	"resource_type" varchar NOT NULL,
	"resource_id" varchar,
	"action" text NOT NULL,
	"ip_address" varchar,
	"user_agent" text,
	"endpoint" varchar,
	"method" varchar(10),
	"status_code" integer,
	"success" boolean NOT NULL,
	"error_message" text,
	"changes_before" jsonb,
	"changes_after" jsonb,
	"metadata" jsonb,
	"phi_accessed" boolean DEFAULT false,
	"phi_fields" jsonb,
	"justification" text,
	"retention_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "bi_recommendations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ecp_id" varchar NOT NULL,
	"recommendation_type" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"impact" text NOT NULL,
	"action_items" jsonb DEFAULT '[]',
	"data_source" jsonb NOT NULL,
	"estimated_revenue_lift" numeric(12, 2),
	"estimated_error_reduction" numeric(5, 4),
	"acknowledged" boolean DEFAULT false NOT NULL,
	"acknowledged_at" timestamp,
	"acknowledged_by" varchar,
	"implementation_started_at" timestamp,
	"implementation_completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "calibration_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" varchar NOT NULL,
	"calibration_date" timestamp NOT NULL,
	"performed_by" varchar(200) NOT NULL,
	"certificate_number" varchar(100),
	"next_due_date" timestamp NOT NULL,
	"results" text,
	"passed" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical_protocols" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"protocol_name" varchar(255) NOT NULL,
	"protocol_type" varchar(100),
	"description" text,
	"protocol_steps" jsonb,
	"compliance_notes" text,
	"is_mandatory" boolean DEFAULT false,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "company_type" NOT NULL,
	"status" "company_status" DEFAULT 'pending_approval' NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar,
	"website" varchar,
	"address" jsonb,
	"registration_number" varchar,
	"goc_number" varchar,
	"tax_id" varchar,
	"subscription_plan" "subscription_plan" DEFAULT 'free_ecp' NOT NULL,
	"subscription_start_date" timestamp,
	"subscription_end_date" timestamp,
	"billing_email" varchar,
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"stripe_subscription_status" varchar(50),
	"stripe_current_period_end" timestamp,
	"free_trial_end_date" timestamp,
	"subscription_cancelled_at" timestamp,
	"is_subscription_exempt" boolean DEFAULT false,
	"company_logo_url" text,
	"company_letterhead_url" text,
	"branding_settings" jsonb DEFAULT '{
    "primaryColor": "#0f172a",
    "secondaryColor": "#3b82f6",
    "logoPosition": "top-left",
    "showGocNumber": true,
    "includeAftercare": true,
    "dispenseSlipFooter": ""
  }'::jsonb,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"ai_enabled" boolean DEFAULT true,
	"ai_model" varchar DEFAULT 'gpt-4',
	"use_external_ai" boolean DEFAULT true,
	"ai_learning_progress" integer DEFAULT 0,
	"shopify_enabled" boolean DEFAULT false,
	"shopify_shop_url" varchar,
	"shopify_access_token" varchar,
	"shopify_api_version" varchar DEFAULT '2024-10',
	"shopify_auto_sync" boolean DEFAULT false,
	"shopify_last_sync_at" timestamp,
	"shopify_sync_settings" jsonb DEFAULT '{}'::jsonb,
	"practice_goc_number" varchar(50),
	"practice_type" varchar(50),
	"primary_practitioner_name" varchar(255),
	"primary_practitioner_goc" varchar(50),
	"emergency_contact_name" varchar(255),
	"emergency_contact_phone" varchar(50),
	"out_of_hours_contact" text,
	"insurance_provider" varchar(255),
	"insurance_policy_number" varchar(100),
	"insurance_expiry_date" timestamp,
	"has_ecp_access" boolean DEFAULT false,
	"has_lab_access" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_ai_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"current_model_version" varchar(50),
	"auto_update_enabled" boolean DEFAULT true,
	"custom_training_enabled" boolean DEFAULT false,
	"data_retention_days" integer DEFAULT 90,
	"last_training_sync" timestamp,
	"ai_preferences" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "company_ai_settings_company_id_unique" UNIQUE("company_id")
);
--> statement-breakpoint
CREATE TABLE "company_supplier_relationships" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"supplier_id" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"approved_by" varchar,
	"approved_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consult_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"order_id" varchar NOT NULL,
	"ecp_id" varchar NOT NULL,
	"priority" "consult_priority" DEFAULT 'normal' NOT NULL,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"lab_response" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "dicom_readings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"examination_id" varchar NOT NULL,
	"study_instance_uid" varchar NOT NULL,
	"series_instance_uid" varchar NOT NULL,
	"image_instance_uid" varchar NOT NULL,
	"modality" varchar NOT NULL,
	"equipment_id" varchar NOT NULL,
	"manufacturer" varchar,
	"model_name" varchar,
	"measurements" jsonb,
	"raw_data" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispense_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar(255) NOT NULL,
	"prescription_id" varchar(255),
	"company_id" varchar(255) NOT NULL,
	"patient_id" varchar(255) NOT NULL,
	"dispensed_by_user_id" varchar(255) NOT NULL,
	"dispenser_name" varchar(255) NOT NULL,
	"dispenser_goc_number" varchar(50),
	"dispense_date" timestamp DEFAULT now() NOT NULL,
	"printed_at" timestamp,
	"patient_signature" text,
	"dispenser_signature" text,
	"special_instructions" text,
	"aftercare_provided" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecp_product_sales_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ecp_id" varchar NOT NULL,
	"product_type" text NOT NULL,
	"product_brand" text,
	"product_model" text,
	"total_sales_count" integer DEFAULT 0 NOT NULL,
	"total_revenue" numeric(12, 2) DEFAULT '0' NOT NULL,
	"average_order_value" numeric(10, 2) DEFAULT '0',
	"monthly_trend" jsonb DEFAULT '{}',
	"top_pairings" jsonb DEFAULT '[]',
	"last_analyzed" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "ecp_catalog_data" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ecp_id" varchar NOT NULL,
	"product_sku" text NOT NULL,
	"product_name" text NOT NULL,
	"brand" text,
	"category" text,
	"lens_type" text,
	"lens_material" text,
	"coating" text,
	"design_features" jsonb,
	"retail_price" numeric(10, 2) NOT NULL,
	"wholesale_price" numeric(10, 2),
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"is_in_stock" boolean DEFAULT true NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"test_room_id" varchar,
	"name" varchar(200) NOT NULL,
	"manufacturer" varchar(150),
	"model" varchar(150),
	"serial_number" varchar(100) NOT NULL,
	"status" "equipment_status" DEFAULT 'operational' NOT NULL,
	"purchase_date" timestamp,
	"last_calibration_date" timestamp,
	"next_calibration_date" timestamp,
	"calibration_frequency_days" integer DEFAULT 365,
	"last_maintenance" timestamp,
	"next_maintenance" timestamp,
	"specifications" jsonb,
	"notes" text,
	"location" varchar,
	"warranty_expiration" timestamp,
	"maintenance_history" jsonb DEFAULT '[]',
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eye_examinations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"patient_id" varchar NOT NULL,
	"ecp_id" varchar NOT NULL,
	"examination_date" timestamp DEFAULT now() NOT NULL,
	"status" "examination_status" DEFAULT 'in_progress' NOT NULL,
	"reason_for_visit" text,
	"medical_history" jsonb,
	"visual_acuity" jsonb,
	"refraction" jsonb,
	"binocular_vision" jsonb,
	"eye_health" jsonb,
	"equipment_readings" jsonb,
	"general_history" jsonb,
	"current_rx" jsonb,
	"new_rx" jsonb,
	"ophthalmoscopy" jsonb,
	"slit_lamp" jsonb,
	"additional_tests" jsonb,
	"tonometry" jsonb,
	"eye_sketch" jsonb,
	"images" jsonb,
	"summary" jsonb,
	"finalized" boolean DEFAULT false,
	"gos_form_type" text,
	"nhs_voucher_code" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goc_compliance_checks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"user_id" varchar,
	"check_type" varchar(100) NOT NULL,
	"check_date" timestamp DEFAULT now() NOT NULL,
	"status" varchar(50) NOT NULL,
	"details" text,
	"action_required" text,
	"resolved_at" timestamp,
	"resolved_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_line_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" varchar NOT NULL,
	"product_id" varchar,
	"description" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" text NOT NULL,
	"company_id" varchar NOT NULL,
	"patient_id" varchar,
	"ecp_id" varchar NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"payment_method" "payment_method",
	"total_amount" numeric(10, 2) NOT NULL,
	"amount_paid" numeric(10, 2) DEFAULT '0' NOT NULL,
	"invoice_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "lims_clinical_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lens_type" text NOT NULL,
	"lens_material" text NOT NULL,
	"coating" text NOT NULL,
	"frame_wrap_angle" numeric(5, 2),
	"prescription_power" jsonb,
	"total_orders_analyzed" integer DEFAULT 0 NOT NULL,
	"non_adapt_count" integer DEFAULT 0 NOT NULL,
	"remake_count" integer DEFAULT 0 NOT NULL,
	"success_rate" numeric(5, 4) DEFAULT '0' NOT NULL,
	"non_adapt_rate" numeric(5, 4) DEFAULT '0' NOT NULL,
	"remake_rate" numeric(5, 4) DEFAULT '0' NOT NULL,
	"pattern_insights" jsonb,
	"clinical_context" jsonb,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "master_training_datasets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_version_id" varchar,
	"category" varchar(100) NOT NULL,
	"title" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"source" text,
	"quality_score" numeric(3, 2),
	"tags" jsonb,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_by" varchar,
	"approved_by" varchar,
	"approved_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nlp_clinical_analysis" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"raw_clinical_notes" text NOT NULL,
	"intent_tags" jsonb NOT NULL,
	"patient_lifestyle" text,
	"patient_complaints" jsonb,
	"clinical_flags" jsonb,
	"clinical_summary" text,
	"recommended_lens_characteristics" jsonb,
	"analyzed_at" timestamp DEFAULT now() NOT NULL,
	"confidence" numeric(5, 4) DEFAULT '0.8' NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "non_adapts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"reported_by" varchar NOT NULL,
	"patient_feedback" text NOT NULL,
	"symptoms" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolution" text,
	"resolution_type" varchar,
	"resolved_at" timestamp,
	"quality_issue_id" varchar,
	"replacement_order_id" varchar,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"severity" "notification_severity" NOT NULL,
	"target" jsonb NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_timeline" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"status" varchar NOT NULL,
	"details" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" varchar NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"company_id" varchar NOT NULL,
	"patient_id" varchar NOT NULL,
	"ecp_id" varchar NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"od_sphere" text,
	"od_cylinder" text,
	"od_axis" text,
	"od_add" text,
	"os_sphere" text,
	"os_cylinder" text,
	"os_axis" text,
	"os_add" text,
	"pd" text,
	"lens_type" text NOT NULL,
	"lens_material" text NOT NULL,
	"coating" text NOT NULL,
	"frame_type" text,
	"notes" text,
	"trace_file_url" text,
	"tracking_number" text,
	"shipped_at" timestamp,
	"customer_reference_label" text,
	"customer_reference_number" text,
	"oma_file_content" text,
	"oma_filename" text,
	"oma_parsed_data" jsonb,
	"job_id" varchar,
	"job_status" varchar,
	"sent_to_lab_at" timestamp,
	"job_error_message" text,
	"order_date" timestamp DEFAULT now() NOT NULL,
	"due_date" timestamp,
	"completed_at" timestamp,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "organization_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text,
	"logo_url" text,
	"contact_email" text,
	"contact_phone" text,
	"address" jsonb,
	"order_number_prefix" text DEFAULT 'ORD',
	"default_lead_time_days" integer DEFAULT 7,
	"enable_email_notifications" jsonb DEFAULT '{"orderReceived": true, "orderShipped": true, "poCreated": true}'::jsonb,
	"business_hours" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by_id" varchar
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_number" varchar(20) NOT NULL,
	"company_id" varchar NOT NULL,
	"name" text NOT NULL,
	"date_of_birth" text,
	"email" varchar,
	"nhs_number" varchar,
	"full_address" jsonb,
	"customer_reference_label" text,
	"customer_reference_number" text,
	"ecp_id" varchar NOT NULL,
	"previous_optician" varchar(255),
	"gp_name" varchar(255),
	"gp_practice" varchar(255),
	"gp_address" text,
	"emergency_contact_name" varchar(255),
	"emergency_contact_phone" varchar(50),
	"emergency_contact_relationship" varchar(100),
	"medical_history" jsonb,
	"current_medications" text,
	"family_ocular_history" text,
	"occupation" varchar(255),
	"vdu_user" boolean DEFAULT false,
	"driving_requirement" boolean DEFAULT false,
	"contact_lens_wearer" boolean DEFAULT false,
	"preferred_contact_method" varchar(50),
	"marketing_consent" boolean DEFAULT false,
	"data_sharing_consent" boolean DEFAULT true,
	"last_examination_date" timestamp,
	"next_examination_due" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "patients_customer_number_unique" UNIQUE("customer_number")
);
--> statement-breakpoint
CREATE TABLE "pdf_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"name" varchar(100) NOT NULL,
	"template_type" varchar(50) NOT NULL,
	"html_template" text NOT NULL,
	"css_styles" text,
	"header_logo_url" text,
	"footer_text" text,
	"primary_color" varchar(7) DEFAULT '#000000',
	"secondary_color" varchar(7) DEFAULT '#666666',
	"is_default" boolean DEFAULT false,
	"paper_size" varchar(20) DEFAULT 'A4',
	"orientation" varchar(20) DEFAULT 'portrait',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"permission_key" varchar NOT NULL,
	"permission_name" varchar NOT NULL,
	"category" varchar NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_permission_key_unique" UNIQUE("permission_key")
);
--> statement-breakpoint
CREATE TABLE "po_line_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_order_id" varchar NOT NULL,
	"item_name" text NOT NULL,
	"description" text,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pos_transaction_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"unit_cost" numeric(10, 2),
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"line_total" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pos_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"transaction_number" varchar(50) NOT NULL,
	"staff_id" varchar NOT NULL,
	"patient_id" varchar,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"total_amount" numeric(10, 2) NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"payment_status" varchar(50) DEFAULT 'completed',
	"cash_received" numeric(10, 2),
	"change_given" numeric(10, 2),
	"notes" text,
	"refund_reason" text,
	"refunded_at" timestamp,
	"transaction_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescription_alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"ecp_id" varchar NOT NULL,
	"severity" "adapt_alert_severity" NOT NULL,
	"alert_type" text NOT NULL,
	"risk_score" numeric(5, 4) NOT NULL,
	"historical_non_adapt_rate" numeric(5, 4),
	"recommended_lens_type" text,
	"recommended_material" text,
	"recommended_coating" text,
	"explanation" text NOT NULL,
	"dismissed_at" timestamp,
	"dismissed_by" varchar,
	"action_taken" text,
	"action_taken_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "prescription_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"created_by" varchar NOT NULL,
	"template_name" varchar(150) NOT NULL,
	"template_description" text,
	"prescription_type" varchar(50),
	"default_values" jsonb NOT NULL,
	"usage_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"examination_id" varchar,
	"patient_id" varchar NOT NULL,
	"ecp_id" varchar NOT NULL,
	"issue_date" timestamp DEFAULT now() NOT NULL,
	"expiry_date" timestamp,
	"od_sphere" text,
	"od_cylinder" text,
	"od_axis" text,
	"od_add" text,
	"os_sphere" text,
	"os_cylinder" text,
	"os_axis" text,
	"os_add" text,
	"pd" text,
	"pd_right" numeric(4, 1),
	"pd_left" numeric(4, 1),
	"binocular_pd" numeric(4, 1),
	"near_pd" numeric(4, 1),
	"od_prism_horizontal" numeric(4, 2),
	"od_prism_vertical" numeric(4, 2),
	"od_prism_base" varchar(20),
	"os_prism_horizontal" numeric(4, 2),
	"os_prism_vertical" numeric(4, 2),
	"os_prism_base" varchar(20),
	"back_vertex_distance" numeric(4, 1),
	"prescription_type" varchar(50),
	"dispensing_notes" text,
	"goc_compliant" boolean DEFAULT true NOT NULL,
	"prescriber_goc_number" varchar(50),
	"test_room_name" varchar(100),
	"prescriber_name" varchar(255),
	"prescriber_qualifications" varchar(255),
	"prescriber_goc_type" varchar(50),
	"od_visual_acuity_unaided" varchar(20),
	"od_visual_acuity_aided" varchar(20),
	"od_visual_acuity_pinhole" varchar(20),
	"os_visual_acuity_unaided" varchar(20),
	"os_visual_acuity_aided" varchar(20),
	"os_visual_acuity_pinhole" varchar(20),
	"binocular_visual_acuity" varchar(20),
	"od_near_vision" varchar(20),
	"os_near_vision" varchar(20),
	"binocular_near_vision" varchar(20),
	"od_intermediate_add" numeric(4, 2),
	"os_intermediate_add" numeric(4, 2),
	"od_k_reading_1" numeric(5, 2),
	"od_k_reading_2" numeric(5, 2),
	"od_k_axis" integer,
	"os_k_reading_1" numeric(5, 2),
	"os_k_reading_2" numeric(5, 2),
	"os_k_axis" integer,
	"intraocular_pressure_od" varchar(20),
	"intraocular_pressure_os" varchar(20),
	"ocular_health_notes" text,
	"clinical_recommendations" text,
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" timestamp,
	"follow_up_reason" text,
	"recommended_lens_type" varchar(100),
	"recommended_lens_material" varchar(100),
	"recommended_coatings" text,
	"frame_recommendations" text,
	"special_instructions" text,
	"usage_purpose" varchar(100),
	"wear_time" varchar(100),
	"driving_suitable" boolean DEFAULT true,
	"dvla_notified" boolean DEFAULT false,
	"verified_by_ecp_id" varchar,
	"verified_at" timestamp,
	"verification_notes" text,
	"record_retention_date" timestamp,
	"referral_made" boolean DEFAULT false,
	"referral_to" varchar(255),
	"referral_reason" text,
	"examination_duration_minutes" integer,
	"examination_type" varchar(50),
	"patient_complaint" text,
	"previous_prescription_id" varchar,
	"is_signed" boolean DEFAULT false NOT NULL,
	"signed_by_ecp_id" varchar,
	"digital_signature" text,
	"signed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"ecp_id" varchar NOT NULL,
	"product_type" "product_type" NOT NULL,
	"sku" text,
	"brand" text,
	"model" text,
	"name" text,
	"description" text,
	"category" text,
	"barcode" text,
	"image_url" text,
	"color_options" jsonb,
	"cost" numeric(10, 2),
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 10,
	"unit_price" numeric(10, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"is_prescription_required" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"po_number" text NOT NULL,
	"company_id" varchar NOT NULL,
	"supplier_id" varchar NOT NULL,
	"created_by_id" varchar NOT NULL,
	"status" "po_status" DEFAULT 'draft' NOT NULL,
	"total_amount" numeric(10, 2),
	"notes" text,
	"expected_delivery_date" timestamp,
	"actual_delivery_date" timestamp,
	"tracking_number" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_orders_po_number_unique" UNIQUE("po_number")
);
--> statement-breakpoint
CREATE TABLE "quality_issues" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_type" "quality_issue_type" NOT NULL,
	"order_id" varchar NOT NULL,
	"description" text NOT NULL,
	"severity" integer NOT NULL,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"detected_by" varchar NOT NULL,
	"status" varchar DEFAULT 'open' NOT NULL,
	"resolution" text,
	"resolved_at" timestamp,
	"resolved_by" varchar,
	"root_cause" text,
	"preventive_actions" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "remote_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"patient_id" varchar NOT NULL,
	"prescription_id" varchar,
	"access_token" varchar(255) NOT NULL,
	"requested_by" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"approved_by" varchar,
	"approved_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "remote_sessions_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "returns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"return_reason" varchar NOT NULL,
	"return_type" varchar NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"processing_notes" text,
	"replacement_order_id" varchar,
	"quality_issue_id" varchar,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"role" "user_role_enhanced" NOT NULL,
	"permission_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rx_frame_lens_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lens_type" text NOT NULL,
	"lens_material" text NOT NULL,
	"frame_type" text NOT NULL,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"non_adapt_count" integer DEFAULT 0 NOT NULL,
	"non_adapt_rate" numeric(5, 4) DEFAULT '0' NOT NULL,
	"remake_rate" numeric(5, 4) DEFAULT '0' NOT NULL,
	"average_remake_days" numeric(8, 2) DEFAULT '0',
	"historical_data_points" jsonb DEFAULT '[]',
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stripe_payment_intents" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'GBP',
	"status" varchar(50) NOT NULL,
	"payment_method" varchar(255),
	"customer_id" varchar(255),
	"subscription_id" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"old_plan" varchar(50),
	"new_plan" varchar(50),
	"changed_by" varchar(255),
	"reason" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(150) NOT NULL,
	"description" text,
	"price_monthly_gbp" numeric(10, 2),
	"price_yearly_gbp" numeric(10, 2),
	"stripe_price_id_monthly" varchar(255),
	"stripe_price_id_yearly" varchar(255),
	"features" jsonb,
	"max_users" integer,
	"max_orders_per_month" integer,
	"ai_enabled" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "technical_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" varchar NOT NULL,
	"document_type" "document_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer,
	"material_name" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_room_bookings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_room_id" varchar NOT NULL,
	"patient_id" varchar,
	"user_id" varchar NOT NULL,
	"booking_date" timestamp NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"appointment_type" varchar(100),
	"status" varchar(50) DEFAULT 'scheduled',
	"notes" text,
	"is_remote_session" boolean DEFAULT false,
	"remote_access_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_rooms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"room_name" varchar(100) NOT NULL,
	"room_code" varchar(20),
	"location_description" text,
	"equipment_list" text,
	"capacity" integer DEFAULT 1,
	"floor_level" varchar(50),
	"accessibility" boolean DEFAULT true,
	"current_status" varchar(50) DEFAULT 'available',
	"last_maintenance_date" timestamp,
	"next_maintenance_date" timestamp,
	"equipment_details" jsonb,
	"allow_remote_access" boolean DEFAULT false,
	"location_id" varchar,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_data_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dataset_id" varchar NOT NULL,
	"model_version_id" varchar NOT NULL,
	"usage_count" integer DEFAULT 0,
	"success_rate" numeric(5, 2),
	"avg_confidence" numeric(5, 2),
	"feedback_score" numeric(5, 2),
	"improvement_metrics" jsonb,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_custom_permissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"permission_id" varchar NOT NULL,
	"granted" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"theme" text DEFAULT 'light',
	"language" text DEFAULT 'en',
	"email_notifications" jsonb DEFAULT '{"orderUpdates": true, "systemAlerts": true}'::jsonb,
	"dashboard_layout" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"role" "user_role" NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"account_status" "account_status" DEFAULT 'pending' NOT NULL,
	"status_reason" text,
	"organization_id" varchar,
	"organization_name" text,
	"email" varchar,
	"password" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" "role",
	"enhanced_role" "user_role_enhanced",
	"subscription_plan" "subscription_plan" DEFAULT 'full' NOT NULL,
	"goc_number" varchar,
	"account_number" varchar,
	"contact_email" varchar,
	"contact_phone" varchar,
	"address" jsonb,
	"is_active" boolean DEFAULT true,
	"is_verified" boolean DEFAULT false,
	"last_login_at" timestamp,
	"goc_registration_number" varchar(50),
	"goc_registration_type" varchar(50),
	"professional_qualifications" varchar(255),
	"goc_registration_expiry" timestamp,
	"indemnity_insurance_provider" varchar(255),
	"indemnity_policy_number" varchar(100),
	"indemnity_expiry_date" timestamp,
	"cpd_completed" boolean DEFAULT true,
	"cpd_last_updated" timestamp,
	"signature_image" text,
	"can_prescribe" boolean DEFAULT true,
	"can_dispense" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_deployment_queue" ADD CONSTRAINT "ai_deployment_queue_model_version_id_ai_model_versions_id_fk" FOREIGN KEY ("model_version_id") REFERENCES "public"."ai_model_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_deployment_queue" ADD CONSTRAINT "ai_deployment_queue_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_dispensing_recommendations" ADD CONSTRAINT "ai_dispensing_recommendations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_dispensing_recommendations" ADD CONSTRAINT "ai_dispensing_recommendations_ecp_id_users_id_fk" FOREIGN KEY ("ecp_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_dispensing_recommendations" ADD CONSTRAINT "ai_dispensing_recommendations_nlp_analysis_id_nlp_clinical_analysis_id_fk" FOREIGN KEY ("nlp_analysis_id") REFERENCES "public"."nlp_clinical_analysis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_feedback" ADD CONSTRAINT "ai_feedback_message_id_ai_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."ai_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_feedback" ADD CONSTRAINT "ai_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_feedback" ADD CONSTRAINT "ai_feedback_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_knowledge_base" ADD CONSTRAINT "ai_knowledge_base_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_knowledge_base" ADD CONSTRAINT "ai_knowledge_base_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_learning_data" ADD CONSTRAINT "ai_learning_data_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_learning_data" ADD CONSTRAINT "ai_learning_data_validated_by_users_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_model_deployments" ADD CONSTRAINT "ai_model_deployments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_model_deployments" ADD CONSTRAINT "ai_model_deployments_model_version_id_ai_model_versions_id_fk" FOREIGN KEY ("model_version_id") REFERENCES "public"."ai_model_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_model_versions" ADD CONSTRAINT "ai_model_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_model_versions" ADD CONSTRAINT "ai_model_versions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_training_jobs" ADD CONSTRAINT "ai_training_jobs_model_version_id_ai_model_versions_id_fk" FOREIGN KEY ("model_version_id") REFERENCES "public"."ai_model_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_training_jobs" ADD CONSTRAINT "ai_training_jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bi_recommendations" ADD CONSTRAINT "bi_recommendations_ecp_id_users_id_fk" FOREIGN KEY ("ecp_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bi_recommendations" ADD CONSTRAINT "bi_recommendations_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calibration_records" ADD CONSTRAINT "calibration_records_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_protocols" ADD CONSTRAINT "clinical_protocols_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_protocols" ADD CONSTRAINT "clinical_protocols_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_ai_settings" ADD CONSTRAINT "company_ai_settings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_supplier_relationships" ADD CONSTRAINT "company_supplier_relationships_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_supplier_relationships" ADD CONSTRAINT "company_supplier_relationships_supplier_id_companies_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_supplier_relationships" ADD CONSTRAINT "company_supplier_relationships_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consult_logs" ADD CONSTRAINT "consult_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consult_logs" ADD CONSTRAINT "consult_logs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consult_logs" ADD CONSTRAINT "consult_logs_ecp_id_users_id_fk" FOREIGN KEY ("ecp_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dicom_readings" ADD CONSTRAINT "dicom_readings_examination_id_eye_examinations_id_fk" FOREIGN KEY ("examination_id") REFERENCES "public"."eye_examinations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dicom_readings" ADD CONSTRAINT "dicom_readings_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispense_records" ADD CONSTRAINT "dispense_records_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispense_records" ADD CONSTRAINT "dispense_records_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispense_records" ADD CONSTRAINT "dispense_records_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispense_records" ADD CONSTRAINT "dispense_records_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispense_records" ADD CONSTRAINT "dispense_records_dispensed_by_user_id_users_id_fk" FOREIGN KEY ("dispensed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecp_product_sales_analytics" ADD CONSTRAINT "ecp_product_sales_analytics_ecp_id_users_id_fk" FOREIGN KEY ("ecp_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecp_catalog_data" ADD CONSTRAINT "ecp_catalog_data_ecp_id_users_id_fk" FOREIGN KEY ("ecp_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_test_room_id_test_rooms_id_fk" FOREIGN KEY ("test_room_id") REFERENCES "public"."test_rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eye_examinations" ADD CONSTRAINT "eye_examinations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eye_examinations" ADD CONSTRAINT "eye_examinations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eye_examinations" ADD CONSTRAINT "eye_examinations_ecp_id_users_id_fk" FOREIGN KEY ("ecp_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goc_compliance_checks" ADD CONSTRAINT "goc_compliance_checks_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goc_compliance_checks" ADD CONSTRAINT "goc_compliance_checks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goc_compliance_checks" ADD CONSTRAINT "goc_compliance_checks_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_ecp_id_users_id_fk" FOREIGN KEY ("ecp_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_training_datasets" ADD CONSTRAINT "master_training_datasets_model_version_id_ai_model_versions_id_fk" FOREIGN KEY ("model_version_id") REFERENCES "public"."ai_model_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_training_datasets" ADD CONSTRAINT "master_training_datasets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_training_datasets" ADD CONSTRAINT "master_training_datasets_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nlp_clinical_analysis" ADD CONSTRAINT "nlp_clinical_analysis_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "non_adapts" ADD CONSTRAINT "non_adapts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "non_adapts" ADD CONSTRAINT "non_adapts_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "non_adapts" ADD CONSTRAINT "non_adapts_quality_issue_id_quality_issues_id_fk" FOREIGN KEY ("quality_issue_id") REFERENCES "public"."quality_issues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "non_adapts" ADD CONSTRAINT "non_adapts_replacement_order_id_orders_id_fk" FOREIGN KEY ("replacement_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_timeline" ADD CONSTRAINT "order_timeline_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_timeline" ADD CONSTRAINT "order_timeline_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_ecp_id_users_id_fk" FOREIGN KEY ("ecp_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_ecp_id_users_id_fk" FOREIGN KEY ("ecp_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdf_templates" ADD CONSTRAINT "pdf_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_line_items" ADD CONSTRAINT "po_line_items_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_transaction_items" ADD CONSTRAINT "pos_transaction_items_transaction_id_pos_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."pos_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_transaction_items" ADD CONSTRAINT "pos_transaction_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_transactions" ADD CONSTRAINT "pos_transactions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_transactions" ADD CONSTRAINT "pos_transactions_staff_id_users_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_transactions" ADD CONSTRAINT "pos_transactions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_alerts" ADD CONSTRAINT "prescription_alerts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_alerts" ADD CONSTRAINT "prescription_alerts_ecp_id_users_id_fk" FOREIGN KEY ("ecp_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_alerts" ADD CONSTRAINT "prescription_alerts_dismissed_by_users_id_fk" FOREIGN KEY ("dismissed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_templates" ADD CONSTRAINT "prescription_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_templates" ADD CONSTRAINT "prescription_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_examination_id_eye_examinations_id_fk" FOREIGN KEY ("examination_id") REFERENCES "public"."eye_examinations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_ecp_id_users_id_fk" FOREIGN KEY ("ecp_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_verified_by_ecp_id_users_id_fk" FOREIGN KEY ("verified_by_ecp_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_signed_by_ecp_id_users_id_fk" FOREIGN KEY ("signed_by_ecp_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_ecp_id_users_id_fk" FOREIGN KEY ("ecp_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_users_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_issues" ADD CONSTRAINT "quality_issues_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_issues" ADD CONSTRAINT "quality_issues_detected_by_users_id_fk" FOREIGN KEY ("detected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_issues" ADD CONSTRAINT "quality_issues_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remote_sessions" ADD CONSTRAINT "remote_sessions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remote_sessions" ADD CONSTRAINT "remote_sessions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remote_sessions" ADD CONSTRAINT "remote_sessions_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remote_sessions" ADD CONSTRAINT "remote_sessions_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remote_sessions" ADD CONSTRAINT "remote_sessions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_replacement_order_id_orders_id_fk" FOREIGN KEY ("replacement_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_quality_issue_id_quality_issues_id_fk" FOREIGN KEY ("quality_issue_id") REFERENCES "public"."quality_issues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_payment_intents" ADD CONSTRAINT "stripe_payment_intents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technical_documents" ADD CONSTRAINT "technical_documents_supplier_id_users_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_room_bookings" ADD CONSTRAINT "test_room_bookings_test_room_id_test_rooms_id_fk" FOREIGN KEY ("test_room_id") REFERENCES "public"."test_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_room_bookings" ADD CONSTRAINT "test_room_bookings_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_room_bookings" ADD CONSTRAINT "test_room_bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_rooms" ADD CONSTRAINT "test_rooms_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_data_analytics" ADD CONSTRAINT "training_data_analytics_dataset_id_master_training_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."master_training_datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_data_analytics" ADD CONSTRAINT "training_data_analytics_model_version_id_ai_model_versions_id_fk" FOREIGN KEY ("model_version_id") REFERENCES "public"."ai_model_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_custom_permissions" ADD CONSTRAINT "user_custom_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_custom_permissions" ADD CONSTRAINT "user_custom_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_custom_permissions" ADD CONSTRAINT "user_custom_permissions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_conversations_company" ON "ai_conversations" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_ai_conversations_user" ON "ai_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ai_deployment_queue_version" ON "ai_deployment_queue" USING btree ("model_version_id");--> statement-breakpoint
CREATE INDEX "idx_ai_deployment_queue_status" ON "ai_deployment_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ai_deployment_queue_scheduled" ON "ai_deployment_queue" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_ai_recommendations_order" ON "ai_dispensing_recommendations" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_ai_recommendations_ecp" ON "ai_dispensing_recommendations" USING btree ("ecp_id");--> statement-breakpoint
CREATE INDEX "idx_ai_recommendations_status" ON "ai_dispensing_recommendations" USING btree ("recommendation_status");--> statement-breakpoint
CREATE INDEX "idx_ai_feedback_message" ON "ai_feedback" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "idx_ai_feedback_company" ON "ai_feedback" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_ai_knowledge_company" ON "ai_knowledge_base" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_ai_knowledge_category" ON "ai_knowledge_base" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_ai_learning_company" ON "ai_learning_data" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_ai_learning_category" ON "ai_learning_data" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_ai_learning_confidence" ON "ai_learning_data" USING btree ("confidence");--> statement-breakpoint
CREATE INDEX "idx_ai_messages_conversation" ON "ai_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_ai_deployments_company" ON "ai_model_deployments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_ai_deployments_version" ON "ai_model_deployments" USING btree ("model_version_id");--> statement-breakpoint
CREATE INDEX "idx_ai_deployments_status" ON "ai_model_deployments" USING btree ("deployment_status");--> statement-breakpoint
CREATE INDEX "idx_ai_model_versions_status" ON "ai_model_versions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ai_model_versions_created" ON "ai_model_versions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_training_jobs_version" ON "ai_training_jobs" USING btree ("model_version_id");--> statement-breakpoint
CREATE INDEX "idx_ai_training_jobs_status" ON "ai_training_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_user" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_company" ON "audit_logs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_timestamp" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_resource" ON "audit_logs" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_phi" ON "audit_logs" USING btree ("phi_accessed");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_event_type" ON "audit_logs" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_retention" ON "audit_logs" USING btree ("retention_date");--> statement-breakpoint
CREATE INDEX "idx_bi_recommendations_ecp" ON "bi_recommendations" USING btree ("ecp_id");--> statement-breakpoint
CREATE INDEX "idx_bi_recommendations_type" ON "bi_recommendations" USING btree ("recommendation_type");--> statement-breakpoint
CREATE INDEX "idx_bi_recommendations_priority" ON "bi_recommendations" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_calibration_equipment" ON "calibration_records" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "idx_calibration_date" ON "calibration_records" USING btree ("calibration_date");--> statement-breakpoint
CREATE INDEX "idx_clinical_protocols_company" ON "clinical_protocols" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_companies_status" ON "companies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_companies_type" ON "companies" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_companies_stripe_customer" ON "companies" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "idx_companies_stripe_subscription" ON "companies" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "idx_company_ai_settings_company" ON "company_ai_settings" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_company_supplier_company" ON "company_supplier_relationships" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_company_supplier_supplier" ON "company_supplier_relationships" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_dicom_readings_examination" ON "dicom_readings" USING btree ("examination_id");--> statement-breakpoint
CREATE INDEX "idx_dicom_readings_equipment" ON "dicom_readings" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "idx_dispense_records_order" ON "dispense_records" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_dispense_records_company" ON "dispense_records" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_dispense_records_patient" ON "dispense_records" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_ecp_sales_analytics_ecp" ON "ecp_product_sales_analytics" USING btree ("ecp_id");--> statement-breakpoint
CREATE INDEX "idx_ecp_catalog_ecp_id" ON "ecp_catalog_data" USING btree ("ecp_id");--> statement-breakpoint
CREATE INDEX "idx_ecp_catalog_sku" ON "ecp_catalog_data" USING btree ("product_sku");--> statement-breakpoint
CREATE INDEX "idx_equipment_company" ON "equipment" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_equipment_test_room" ON "equipment" USING btree ("test_room_id");--> statement-breakpoint
CREATE INDEX "idx_equipment_status" ON "equipment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_equipment_next_calibration" ON "equipment" USING btree ("next_calibration_date");--> statement-breakpoint
CREATE INDEX "idx_goc_compliance_company" ON "goc_compliance_checks" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_goc_compliance_status" ON "goc_compliance_checks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_goc_compliance_date" ON "goc_compliance_checks" USING btree ("check_date");--> statement-breakpoint
CREATE INDEX "idx_master_training_category" ON "master_training_datasets" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_master_training_status" ON "master_training_datasets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_master_training_version" ON "master_training_datasets" USING btree ("model_version_id");--> statement-breakpoint
CREATE INDEX "idx_nlp_analysis_order" ON "nlp_clinical_analysis" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_created_at" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_pdf_templates_company_id" ON "pdf_templates" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_pdf_templates_type" ON "pdf_templates" USING btree ("template_type");--> statement-breakpoint
CREATE INDEX "idx_permissions_category" ON "permissions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_pos_items_transaction_id" ON "pos_transaction_items" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "idx_pos_items_product_id" ON "pos_transaction_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_pos_transactions_company_id" ON "pos_transactions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_pos_transactions_staff_id" ON "pos_transactions" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "idx_pos_transactions_date" ON "pos_transactions" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "idx_pos_transactions_status" ON "pos_transactions" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "idx_prescription_alerts_order" ON "prescription_alerts" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_prescription_alerts_ecp" ON "prescription_alerts" USING btree ("ecp_id");--> statement-breakpoint
CREATE INDEX "idx_prescription_alerts_severity" ON "prescription_alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_prescription_templates_company" ON "prescription_templates" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_prescriptions_test_room" ON "prescriptions" USING btree ("test_room_name");--> statement-breakpoint
CREATE INDEX "idx_prescriptions_goc_number" ON "prescriptions" USING btree ("prescriber_goc_number");--> statement-breakpoint
CREATE INDEX "idx_prescriptions_follow_up" ON "prescriptions" USING btree ("follow_up_date");--> statement-breakpoint
CREATE INDEX "idx_prescriptions_retention" ON "prescriptions" USING btree ("record_retention_date");--> statement-breakpoint
CREATE INDEX "idx_prescriptions_verified" ON "prescriptions" USING btree ("verified_by_ecp_id");--> statement-breakpoint
CREATE INDEX "idx_products_company_barcode" ON "products" USING btree ("company_id","barcode");--> statement-breakpoint
CREATE INDEX "idx_products_category" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_remote_sessions_company" ON "remote_sessions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_remote_sessions_patient" ON "remote_sessions" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_remote_sessions_token" ON "remote_sessions" USING btree ("access_token");--> statement-breakpoint
CREATE INDEX "idx_remote_sessions_status" ON "remote_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_remote_sessions_expires" ON "remote_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_role_permissions_company" ON "role_permissions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_role_permissions_role" ON "role_permissions" USING btree ("role");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "IDX_session_user" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_payment_intents_company" ON "stripe_payment_intents" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_payment_intents_subscription" ON "stripe_payment_intents" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "idx_subscription_history_company" ON "subscription_history" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_subscription_history_event" ON "subscription_history" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_bookings_test_room" ON "test_room_bookings" USING btree ("test_room_id");--> statement-breakpoint
CREATE INDEX "idx_bookings_date" ON "test_room_bookings" USING btree ("booking_date");--> statement-breakpoint
CREATE INDEX "idx_bookings_status" ON "test_room_bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_bookings_user" ON "test_room_bookings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_test_rooms_company" ON "test_rooms" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_test_rooms_active" ON "test_rooms" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_test_rooms_status" ON "test_rooms" USING btree ("current_status");--> statement-breakpoint
CREATE INDEX "idx_test_rooms_location" ON "test_rooms" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "idx_training_analytics_dataset" ON "training_data_analytics" USING btree ("dataset_id");--> statement-breakpoint
CREATE INDEX "idx_training_analytics_version" ON "training_data_analytics" USING btree ("model_version_id");--> statement-breakpoint
CREATE INDEX "idx_user_custom_permissions_user" ON "user_custom_permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_roles_user_id" ON "user_roles" USING btree ("user_id");