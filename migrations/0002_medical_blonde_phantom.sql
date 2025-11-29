CREATE TYPE "public"."ab_test_variant" AS ENUM('A', 'B');--> statement-breakpoint
CREATE TYPE "public"."adoption_status" AS ENUM('proposed', 'pilot', 'adopted', 'sustained');--> statement-breakpoint
CREATE TYPE "public"."ai_po_status" AS ENUM('draft', 'pending_review', 'approved', 'rejected', 'converted');--> statement-breakpoint
CREATE TYPE "public"."alert_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."allergy_severity" AS ENUM('mild', 'moderate', 'severe', 'life_threatening');--> statement-breakpoint
CREATE TYPE "public"."appeal_status" AS ENUM('submitted', 'pending', 'approved', 'denied');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled');--> statement-breakpoint
CREATE TYPE "public"."appointment_type" AS ENUM('eye_examination', 'contact_lens_fitting', 'frame_selection', 'follow_up', 'emergency', 'consultation', 'test_room_booking', 'dispensing', 'collection');--> statement-breakpoint
CREATE TYPE "public"."assessment_status" AS ENUM('pending', 'in_progress', 'completed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."batch_status" AS ENUM('processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."campaign_frequency" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."campaign_type" AS ENUM('one_time', 'recurring', 'triggered', 'drip');--> statement-breakpoint
CREATE TYPE "public"."cancelled_by" AS ENUM('patient', 'provider', 'system');--> statement-breakpoint
CREATE TYPE "public"."care_gap_category" AS ENUM('preventive', 'chronic_care', 'medication', 'screening', 'follow_up');--> statement-breakpoint
CREATE TYPE "public"."care_gap_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."care_gap_status" AS ENUM('open', 'in_progress', 'closed', 'not_applicable');--> statement-breakpoint
CREATE TYPE "public"."care_goal_status" AS ENUM('not_started', 'in_progress', 'achieved', 'not_achieved', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."care_intervention_status" AS ENUM('planned', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."care_intervention_type" AS ENUM('education', 'medication', 'monitoring', 'lifestyle', 'referral', 'therapy', 'other');--> statement-breakpoint
CREATE TYPE "public"."care_plan_category" AS ENUM('chronic_disease', 'preventive', 'transitional', 'behavioral_health', 'other');--> statement-breakpoint
CREATE TYPE "public"."care_plan_status" AS ENUM('draft', 'active', 'on_hold', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."care_team_member_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."care_team_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."cl_aftercare_status" AS ENUM('scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled');--> statement-breakpoint
CREATE TYPE "public"."cl_design" AS ENUM('spherical', 'toric', 'multifocal', 'monovision', 'custom');--> statement-breakpoint
CREATE TYPE "public"."cl_fit_assessment" AS ENUM('optimal', 'acceptable', 'too_tight', 'too_loose', 'decentered');--> statement-breakpoint
CREATE TYPE "public"."cl_lens_type" AS ENUM('soft', 'rigid_gas_permeable', 'hybrid', 'scleral', 'orthokeratology');--> statement-breakpoint
CREATE TYPE "public"."cl_replacement_schedule" AS ENUM('daily_disposable', 'two_weekly', 'monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."cl_wearing_schedule" AS ENUM('daily_wear', 'extended_wear', 'continuous_wear', 'occasional_wear');--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('draft', 'ready_to_submit', 'submitted', 'pending', 'accepted', 'rejected', 'partially_paid', 'paid', 'denied', 'appealed', 'voided');--> statement-breakpoint
CREATE TYPE "public"."claim_submission_method" AS ENUM('electronic', 'paper', 'clearinghouse', 'portal');--> statement-breakpoint
CREATE TYPE "public"."claim_type" AS ENUM('professional', 'institutional', 'pharmacy', 'dental', 'vision');--> statement-breakpoint
CREATE TYPE "public"."clinical_alert_type" AS ENUM('drug_interaction', 'allergy', 'lab_critical', 'guideline_deviation', 'risk_factor');--> statement-breakpoint
CREATE TYPE "public"."clinical_note_type" AS ENUM('consultation', 'examination', 'follow_up', 'discharge_summary', 'referral', 'progress_note', 'initial_evaluation', 'treatment_plan');--> statement-breakpoint
CREATE TYPE "public"."communication_channel" AS ENUM('email', 'sms', 'push', 'in_app', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."confidence_level" AS ENUM('low', 'medium', 'high', 'very_high');--> statement-breakpoint
CREATE TYPE "public"."connection_status" AS ENUM('pending', 'active', 'rejected', 'disconnected');--> statement-breakpoint
CREATE TYPE "public"."conversation_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."coordination_task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."coordination_task_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."coordination_task_type" AS ENUM('outreach', 'follow_up', 'assessment', 'referral', 'education', 'coordination', 'other');--> statement-breakpoint
CREATE TYPE "public"."criteria_operator" AS ENUM('equals', 'contains', 'greater_than', 'less_than', 'in_range');--> statement-breakpoint
CREATE TYPE "public"."diagnostic_urgency" AS ENUM('routine', 'urgent', 'emergency');--> statement-breakpoint
CREATE TYPE "public"."engagement_type" AS ENUM('education_completed', 'coaching_session', 'self_monitoring', 'goal_set', 'milestone_achieved');--> statement-breakpoint
CREATE TYPE "public"."evidence_level" AS ENUM('Level_I', 'Level_II', 'Level_III', 'Level_IV', 'Level_V');--> statement-breakpoint
CREATE TYPE "public"."evidence_quality" AS ENUM('high', 'moderate', 'low', 'very_low');--> statement-breakpoint
CREATE TYPE "public"."face_shape" AS ENUM('oval', 'round', 'square', 'heart', 'diamond', 'oblong', 'triangle');--> statement-breakpoint
CREATE TYPE "public"."feedback_status" AS ENUM('new', 'reviewed', 'in_progress', 'resolved', 'ignored');--> statement-breakpoint
CREATE TYPE "public"."feedback_type" AS ENUM('general', 'feature', 'bug', 'improvement');--> statement-breakpoint
CREATE TYPE "public"."forecast_horizon" AS ENUM('week', 'month', 'quarter', 'year');--> statement-breakpoint
CREATE TYPE "public"."forecast_method" AS ENUM('moving_average', 'exponential_smoothing', 'linear_regression', 'seasonal_decomposition', 'ai_ml');--> statement-breakpoint
CREATE TYPE "public"."frame_material" AS ENUM('metal', 'plastic', 'acetate', 'titanium', 'wood', 'carbon_fiber', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."frame_style" AS ENUM('rectangle', 'square', 'round', 'oval', 'cat_eye', 'aviator', 'wayfarer', 'browline', 'rimless', 'semi_rimless', 'geometric', 'wrap');--> statement-breakpoint
CREATE TYPE "public"."immunization_status" AS ENUM('administered', 'refused', 'contraindicated', 'scheduled', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."interaction_severity" AS ENUM('minor', 'moderate', 'major', 'contraindicated');--> statement-breakpoint
CREATE TYPE "public"."intervention_delivery_method" AS ENUM('in_person', 'phone', 'video', 'online', 'app');--> statement-breakpoint
CREATE TYPE "public"."lab_status" AS ENUM('normal', 'low', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."measure_domain" AS ENUM('effectiveness', 'access', 'experience', 'utilization', 'safety', 'care_coordination');--> statement-breakpoint
CREATE TYPE "public"."measure_type" AS ENUM('HEDIS', 'MIPS', 'CQM', 'Star_Rating', 'Core_Measure', 'Custom');--> statement-breakpoint
CREATE TYPE "public"."measurement_frequency" AS ENUM('monthly', 'quarterly', 'annually');--> statement-breakpoint
CREATE TYPE "public"."medical_record_status" AS ENUM('active', 'inactive', 'archived', 'under_review');--> statement-breakpoint
CREATE TYPE "public"."medical_record_type" AS ENUM('exam', 'prescription', 'lab_result', 'document', 'image');--> statement-breakpoint
CREATE TYPE "public"."medication_action" AS ENUM('continue', 'new', 'discontinued', 'changed');--> statement-breakpoint
CREATE TYPE "public"."medication_status" AS ENUM('active', 'discontinued', 'completed', 'on_hold');--> statement-breakpoint
CREATE TYPE "public"."message_category" AS ENUM('transactional', 'marketing', 'appointment', 'clinical', 'billing');--> statement-breakpoint
CREATE TYPE "public"."message_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."message_sender_type" AS ENUM('patient', 'provider');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('draft', 'queued', 'sending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed');--> statement-breakpoint
CREATE TYPE "public"."ml_model_status" AS ENUM('active', 'testing', 'deprecated');--> statement-breakpoint
CREATE TYPE "public"."ml_model_type" AS ENUM('classification', 'regression', 'clustering');--> statement-breakpoint
CREATE TYPE "public"."nhs_claim_status" AS ENUM('draft', 'submitted', 'accepted', 'rejected', 'paid', 'queried');--> statement-breakpoint
CREATE TYPE "public"."nhs_exemption_reason" AS ENUM('age_under_16', 'age_16_18_education', 'age_60_plus', 'income_support', 'jobseekers_allowance', 'pension_credit', 'universal_credit', 'hc2_certificate', 'hc3_certificate', 'war_pension', 'diabetes', 'glaucoma', 'registered_blind', 'family_history_glaucoma');--> statement-breakpoint
CREATE TYPE "public"."nhs_gos_claim_type" AS ENUM('GOS1', 'GOS2', 'GOS3', 'GOS4');--> statement-breakpoint
CREATE TYPE "public"."nhs_voucher_type" AS ENUM('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H');--> statement-breakpoint
CREATE TYPE "public"."nps_category" AS ENUM('promoter', 'passive', 'detractor');--> statement-breakpoint
CREATE TYPE "public"."outcome_type" AS ENUM('clinical', 'functional', 'behavioral', 'quality_of_life', 'cost');--> statement-breakpoint
CREATE TYPE "public"."outreach_contact_result" AS ENUM('successful', 'no_answer', 'left_message', 'wrong_number', 'declined');--> statement-breakpoint
CREATE TYPE "public"."outreach_status" AS ENUM('scheduled', 'attempted', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."outreach_type" AS ENUM('phone', 'email', 'sms', 'mail', 'in_person', 'portal');--> statement-breakpoint
CREATE TYPE "public"."patient_activity_type" AS ENUM('profile_created', 'profile_updated', 'examination_scheduled', 'examination_completed', 'prescription_issued', 'order_placed', 'order_updated', 'order_completed', 'contact_lens_fitted', 'recall_sent', 'appointment_booked', 'appointment_cancelled', 'payment_received', 'refund_issued', 'complaint_logged', 'complaint_resolved', 'consent_updated', 'document_uploaded', 'note_added', 'referral_made', 'communication_sent');--> statement-breakpoint
CREATE TYPE "public"."payer_type" AS ENUM('commercial', 'medicare', 'medicaid', 'tricare', 'workers_comp', 'self_pay', 'other');--> statement-breakpoint
CREATE TYPE "public"."pdsa_cycle_status" AS ENUM('plan', 'do', 'study', 'act', 'completed');--> statement-breakpoint
CREATE TYPE "public"."pdsa_decision" AS ENUM('adopt', 'adapt', 'abandon');--> statement-breakpoint
CREATE TYPE "public"."pi_status" AS ENUM('active', 'met', 'missed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."pi_trend" AS ENUM('improving', 'declining', 'stable');--> statement-breakpoint
CREATE TYPE "public"."portal_payment_status" AS ENUM('pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."prediction_confidence" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."prescription_verification_status" AS ENUM('pending', 'verified', 'rejected', 'expired', 'requires_review');--> statement-breakpoint
CREATE TYPE "public"."preventive_care_importance" AS ENUM('routine', 'recommended', 'essential');--> statement-breakpoint
CREATE TYPE "public"."preventive_care_status" AS ENUM('due', 'overdue', 'completed', 'not_applicable', 'refused');--> statement-breakpoint
CREATE TYPE "public"."preventive_care_type" AS ENUM('screening', 'vaccination', 'counseling', 'medication');--> statement-breakpoint
CREATE TYPE "public"."pricing_model" AS ENUM('flat_rate', 'per_user', 'tiered', 'usage_based', 'freemium', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."program_criteria_type" AS ENUM('clinical', 'demographic', 'behavioral', 'financial');--> statement-breakpoint
CREATE TYPE "public"."program_enrollment_status" AS ENUM('active', 'completed', 'withdrawn', 'failed');--> statement-breakpoint
CREATE TYPE "public"."program_intervention_type" AS ENUM('education', 'coaching', 'monitoring', 'medication_management', 'lifestyle');--> statement-breakpoint
CREATE TYPE "public"."qi_impact" AS ENUM('positive', 'negative', 'neutral', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."qi_intervention_status" AS ENUM('planned', 'implemented', 'sustained', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."qi_intervention_type" AS ENUM('process_change', 'education', 'technology', 'policy', 'workflow', 'other');--> statement-breakpoint
CREATE TYPE "public"."qi_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."qi_project_status" AS ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."readmission_timeframe" AS ENUM('7_days', '30_days', '90_days');--> statement-breakpoint
CREATE TYPE "public"."recipient_type" AS ENUM('patient', 'user', 'provider');--> statement-breakpoint
CREATE TYPE "public"."recommendation_strength" AS ENUM('A', 'B', 'C', 'D');--> statement-breakpoint
CREATE TYPE "public"."registry_criteria_type" AS ENUM('diagnosis', 'lab_value', 'medication', 'procedure', 'risk_score');--> statement-breakpoint
CREATE TYPE "public"."registry_enrollment_status" AS ENUM('active', 'inactive', 'graduated', 'deceased', 'transferred');--> statement-breakpoint
CREATE TYPE "public"."relationship_type" AS ENUM('ecp_to_lab', 'lab_to_supplier', 'ecp_to_supplier', 'lab_to_lab');--> statement-breakpoint
CREATE TYPE "public"."reminder_type" AS ENUM('email', 'sms', 'phone', 'push_notification', 'automated_call');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('test_room', 'equipment', 'practitioner', 'room', 'specialist');--> statement-breakpoint
CREATE TYPE "public"."review_frequency" AS ENUM('weekly', 'biweekly', 'monthly', 'quarterly');--> statement-breakpoint
CREATE TYPE "public"."risk_category" AS ENUM('clinical', 'financial', 'utilization', 'social', 'behavioral', 'functional');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('low', 'moderate', 'high', 'very_high');--> statement-breakpoint
CREATE TYPE "public"."risk_type" AS ENUM('readmission', 'disease_progression', 'complication', 'mortality');--> statement-breakpoint
CREATE TYPE "public"."segment_operator" AS ENUM('eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'contains');--> statement-breakpoint
CREATE TYPE "public"."service_place" AS ENUM('office', 'hospital_outpatient', 'hospital_inpatient', 'emergency', 'telehealth', 'home', 'nursing_facility', 'assisted_living');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('low', 'moderate', 'high');--> statement-breakpoint
CREATE TYPE "public"."shopify_order_sync_status" AS ENUM('pending', 'synced', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."shopify_store_status" AS ENUM('active', 'inactive', 'suspended', 'expired');--> statement-breakpoint
CREATE TYPE "public"."social_determinant_category" AS ENUM('economic_stability', 'education', 'social_community', 'healthcare_access', 'neighborhood_environment');--> statement-breakpoint
CREATE TYPE "public"."social_determinant_status" AS ENUM('identified', 'intervention_planned', 'intervention_active', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trial', 'active', 'past_due', 'paused', 'cancelled', 'expired', 'downgraded');--> statement-breakpoint
CREATE TYPE "public"."transition_status" AS ENUM('planned', 'in_progress', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."transition_type" AS ENUM('hospital_to_home', 'hospital_to_snf', 'snf_to_home', 'er_to_home', 'specialist_referral', 'other');--> statement-breakpoint
CREATE TYPE "public"."vital_sign_type" AS ENUM('blood_pressure', 'heart_rate', 'respiratory_rate', 'temperature', 'oxygen_saturation', 'height', 'weight', 'bmi', 'visual_acuity', 'intraocular_pressure');--> statement-breakpoint
CREATE TYPE "public"."workflow_action_type" AS ENUM('send_message', 'wait', 'add_tag', 'remove_tag', 'create_task', 'branch');--> statement-breakpoint
CREATE TYPE "public"."workflow_instance_status" AS ENUM('pending', 'running', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."workflow_status" AS ENUM('active', 'paused', 'archived');--> statement-breakpoint
CREATE TYPE "public"."workflow_trigger" AS ENUM('patient_registered', 'appointment_scheduled', 'appointment_reminder', 'appointment_completed', 'test_results_available', 'prescription_expiring', 'no_show', 'missed_appointment', 'payment_due', 'payment_overdue', 'birthday', 'annual_checkup_due', 'custom');--> statement-breakpoint
ALTER TYPE "public"."role" ADD VALUE 'dispenser';--> statement-breakpoint
ALTER TYPE "public"."subscription_plan" ADD VALUE 'free' BEFORE 'full';--> statement-breakpoint
ALTER TYPE "public"."subscription_plan" ADD VALUE 'pro' BEFORE 'full';--> statement-breakpoint
ALTER TYPE "public"."subscription_plan" ADD VALUE 'premium' BEFORE 'full';--> statement-breakpoint
ALTER TYPE "public"."subscription_plan" ADD VALUE 'enterprise' BEFORE 'full';--> statement-breakpoint
CREATE TABLE "aggregated_metrics" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"metric_type" varchar(100) NOT NULL,
	"category" varchar(100) NOT NULL,
	"company_type" varchar(50),
	"region" varchar(100),
	"product_type" varchar(100),
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"granularity" varchar(50) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"sum" numeric(15, 2),
	"average" numeric(15, 2),
	"median" numeric(15, 2),
	"min" numeric(15, 2),
	"max" numeric(15, 2),
	"std_dev" numeric(15, 2),
	"percentile_25" numeric(15, 2),
	"percentile_50" numeric(15, 2),
	"percentile_75" numeric(15, 2),
	"percentile_90" numeric(15, 2),
	"percentile_95" numeric(15, 2),
	"sample_size" integer NOT NULL,
	"completeness" numeric(5, 2),
	"last_refreshed" timestamp DEFAULT now() NOT NULL,
	"next_refresh_at" timestamp,
	"refresh_status" varchar(50) DEFAULT 'current' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_analyses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"model_type" varchar(100) NOT NULL,
	"analysis_type" varchar(100) NOT NULL,
	"confidence" numeric(5, 4),
	"input_data" jsonb,
	"output_data" jsonb,
	"processing_time_ms" integer,
	"error_message" text,
	"user_id" varchar,
	"resource_type" varchar(50),
	"resource_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_purchase_order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ai_po_id" varchar NOT NULL,
	"product_id" varchar,
	"product_name" text NOT NULL,
	"product_sku" varchar(100),
	"current_stock" integer,
	"low_stock_threshold" integer,
	"recommended_quantity" integer NOT NULL,
	"estimated_unit_price" numeric(10, 2),
	"estimated_total_price" numeric(10, 2),
	"urgency" varchar(20) DEFAULT 'medium',
	"stockout_risk" numeric(5, 2),
	"lead_time_days" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_purchase_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"generated_by" varchar(50) DEFAULT 'autonomous_purchasing',
	"ai_model" varchar(50),
	"supplier_id" varchar,
	"supplier_name" text,
	"estimated_total" numeric(10, 2),
	"reason" text NOT NULL,
	"ai_analysis" jsonb,
	"confidence" numeric(5, 2),
	"status" "ai_po_status" DEFAULT 'pending_review' NOT NULL,
	"reviewed_by_id" varchar,
	"reviewed_at" timestamp,
	"review_notes" text,
	"converted_po_id" varchar,
	"converted_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "allergies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"patient_id" varchar,
	"practitioner_id" varchar,
	"allergen" varchar(255) NOT NULL,
	"allergen_type" varchar(50) NOT NULL,
	"severity" "allergy_severity" NOT NULL,
	"reaction" text NOT NULL,
	"status" varchar(50) DEFAULT 'active',
	"onset_date" date,
	"reported_date" timestamp with time zone DEFAULT now(),
	"notes" text,
	"reported_by" varchar,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "appointment_availability" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"resource_id" varchar NOT NULL,
	"resource_type" "resource_type" NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"is_recurring" boolean DEFAULT true,
	"valid_from" date NOT NULL,
	"valid_until" date,
	"is_blocked" boolean DEFAULT false,
	"block_reason" text,
	"created_by" varchar,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "appointment_bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"provider_name" text NOT NULL,
	"appointment_type_id" text NOT NULL,
	"appointment_type" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"duration" integer NOT NULL,
	"status" "appointment_status" DEFAULT 'scheduled' NOT NULL,
	"reason" text,
	"notes" text,
	"confirmation_code" text NOT NULL,
	"confirmed_at" timestamp with time zone,
	"reminder_sent" boolean DEFAULT false NOT NULL,
	"reminder_sent_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancelled_by" "cancelled_by",
	"cancellation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointment_reminders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" varchar,
	"type" "reminder_type" NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"recipient_email" varchar(255),
	"recipient_phone" varchar(50),
	"status" varchar(50) DEFAULT 'pending',
	"attempts" integer DEFAULT 0,
	"error_message" text,
	"message" text,
	"subject" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "appointment_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar NOT NULL,
	"company_id" varchar NOT NULL,
	"provider_id" varchar,
	"service_type" varchar,
	"preferred_date" timestamp,
	"preferred_time" varchar,
	"reason_for_visit" text,
	"notes" text,
	"status" varchar DEFAULT 'pending',
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"processed_by" varchar,
	"admin_notes" text
);
--> statement-breakpoint
CREATE TABLE "appointment_resources" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" varchar,
	"resource_id" varchar NOT NULL,
	"resource_type" "resource_type" NOT NULL,
	"resource_name" varchar(255) NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"location" varchar(255),
	"capacity" integer DEFAULT 1,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "appointment_types" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"duration" integer NOT NULL,
	"price" integer,
	"allow_online_booking" boolean DEFAULT true NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointment_waitlist" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"patient_id" varchar,
	"appointment_type" "appointment_type" NOT NULL,
	"preferred_date" date,
	"preferred_time_range" varchar(100),
	"flexibility" integer DEFAULT 3,
	"contact_method" "reminder_type" NOT NULL,
	"contact_value" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'active',
	"fulfilled_at" timestamp with time zone,
	"fulfilled_appointment_id" varchar,
	"notes" text,
	"priority" integer DEFAULT 5,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"patient_id" varchar,
	"practitioner_id" varchar,
	"title" varchar(255) NOT NULL,
	"description" text,
	"appointment_type" "appointment_type" NOT NULL,
	"appointment_status" "appointment_status" DEFAULT 'scheduled' NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"duration" integer NOT NULL,
	"location" varchar(255),
	"notes" text,
	"is_virtual" boolean DEFAULT false,
	"virtual_meeting_link" text,
	"reminder_sent" boolean DEFAULT false,
	"reminder_type" "reminder_type",
	"reminder_time" timestamp with time zone,
	"created_by" varchar,
	"updated_by" varchar,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"cancelled_at" timestamp with time zone,
	"cancelled_by" varchar,
	"cancellation_reason" text,
	"rescheduled_from" varchar,
	"rescheduled_to" varchar,
	"external_id" varchar(255),
	"import_source" varchar(100),
	"import_job_id" varchar(255),
	"imported_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE "audience_segments" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"criteria" jsonb NOT NULL,
	"size" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "best_practices" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"practice_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"clinical_area" text NOT NULL,
	"evidence_level" "evidence_level" NOT NULL,
	"evidence_source" text NOT NULL,
	"implementation" text NOT NULL,
	"outcomes" jsonb NOT NULL,
	"adoption_status" "adoption_status" NOT NULL,
	"adoption_date" timestamp with time zone,
	"owner" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_codes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"code" varchar(20) NOT NULL,
	"code_type" varchar(20) NOT NULL,
	"description" text,
	"short_description" varchar(255),
	"category" varchar(100),
	"default_fee" numeric(10, 2),
	"unit_type" varchar(20),
	"modifiers" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_date" timestamp,
	"termination_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bundle_compliance" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"bundle_id" text NOT NULL,
	"encounter_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"assessment_date" timestamp with time zone NOT NULL,
	"element_compliance" jsonb NOT NULL,
	"overall_compliance" boolean NOT NULL,
	"compliance_rate" numeric(5, 2) NOT NULL,
	"assessed_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"practitioner_id" varchar,
	"default_slot_duration" integer DEFAULT 25,
	"custom_slot_durations" jsonb,
	"working_hours" jsonb DEFAULT '{
      "monday": {"start": "09:00", "end": "17:00", "breaks": [{"start": "12:00", "end": "13:00"}]},
      "tuesday": {"start": "09:00", "end": "17:00", "breaks": [{"start": "12:00", "end": "13:00"}]},
      "wednesday": {"start": "09:00", "end": "17:00", "breaks": [{"start": "12:00", "end": "13:00"}]},
      "thursday": {"start": "09:00", "end": "17:00", "breaks": [{"start": "12:00", "end": "13:00"}]},
      "friday": {"start": "09:00", "end": "17:00", "breaks": [{"start": "12:00", "end": "13:00"}]},
      "saturday": {"start": "09:00", "end": "13:00", "breaks": []},
      "sunday": {"start": null, "end": null, "breaks": []}
    }'::jsonb,
	"diary_view_mode" varchar(50) DEFAULT 'day',
	"show_weekends" boolean DEFAULT false,
	"time_format" varchar(10) DEFAULT '24h',
	"first_day_of_week" integer DEFAULT 1,
	"min_advance_booking" integer DEFAULT 60,
	"max_advance_booking" integer DEFAULT 90,
	"allow_double_booking" boolean DEFAULT false,
	"require_deposit" boolean DEFAULT false,
	"deposit_amount" numeric(10, 2),
	"buffer_before" integer DEFAULT 0,
	"buffer_after" integer DEFAULT 5,
	"cancellation_window" integer DEFAULT 24,
	"allow_patient_cancellation" boolean DEFAULT true,
	"allow_patient_reschedule" boolean DEFAULT true,
	"color_scheme" jsonb DEFAULT '{
      "eye_examination": "#3b82f6",
      "contact_lens_fitting": "#10b981",
      "frame_selection": "#f59e0b",
      "follow_up": "#8b5cf6",
      "emergency": "#ef4444",
      "consultation": "#06b6d4"
    }'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_recipients" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"recipient_id" text NOT NULL,
	"message_id" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "campaign_type" NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"segment_ids" jsonb NOT NULL,
	"estimated_reach" integer DEFAULT 0 NOT NULL,
	"channel" "communication_channel" NOT NULL,
	"template_id" text,
	"variables" jsonb,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"frequency" "campaign_frequency",
	"send_time" text,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"delivered_count" integer DEFAULT 0 NOT NULL,
	"opened_count" integer DEFAULT 0 NOT NULL,
	"clicked_count" integer DEFAULT 0 NOT NULL,
	"unsubscribed_count" integer DEFAULT 0 NOT NULL,
	"throttle" integer,
	"ab_test_enabled" boolean DEFAULT false NOT NULL,
	"ab_test_variant" "ab_test_variant",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"launched_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "care_bundles" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"bundle_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"elements" jsonb NOT NULL,
	"evidence_base" text NOT NULL,
	"target_population" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "care_coordination_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"care_plan_id" text,
	"transition_id" text,
	"gap_id" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" "coordination_task_type" NOT NULL,
	"priority" "coordination_task_priority" NOT NULL,
	"status" "coordination_task_status" DEFAULT 'pending' NOT NULL,
	"assigned_to" text,
	"due_date" timestamp with time zone NOT NULL,
	"completed_date" timestamp with time zone,
	"completed_by" text,
	"notes" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "care_gaps" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"gap_type" text NOT NULL,
	"category" "care_gap_category" NOT NULL,
	"description" text NOT NULL,
	"severity" "care_gap_severity" NOT NULL,
	"status" "care_gap_status" DEFAULT 'open' NOT NULL,
	"identified_date" timestamp with time zone NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"closed_date" timestamp with time zone,
	"recommendations" jsonb NOT NULL,
	"assigned_to" text,
	"evidence" text NOT NULL,
	"measure" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "care_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"status" "care_plan_status" DEFAULT 'draft' NOT NULL,
	"category" "care_plan_category" NOT NULL,
	"goals" jsonb NOT NULL,
	"interventions" jsonb NOT NULL,
	"care_team_id" text,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"review_frequency" "review_frequency" NOT NULL,
	"next_review_date" timestamp with time zone NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "care_teams" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"members" jsonb NOT NULL,
	"status" "care_team_status" DEFAULT 'active' NOT NULL,
	"primary_contact" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "churn_predictions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"churn_probability" numeric(5, 4),
	"risk_factors" jsonb,
	"recommended_actions" jsonb,
	"model_version" varchar,
	"prediction_score" integer,
	"predicted_churn_date" timestamp,
	"is_prediction_accurate" boolean,
	"actual_churn_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claim_appeals" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"claim_id" varchar(255) NOT NULL,
	"appeal_number" integer NOT NULL,
	"appeal_date" timestamp NOT NULL,
	"appealed_by" varchar(255) NOT NULL,
	"appeal_reason" text NOT NULL,
	"supporting_documents" jsonb,
	"status" "appeal_status" DEFAULT 'submitted' NOT NULL,
	"resolution_date" timestamp,
	"resolution_amount" numeric(10, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claim_batches" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"batch_number" varchar(100) NOT NULL,
	"payer_id" varchar(255),
	"claim_ids" jsonb NOT NULL,
	"total_claims" integer NOT NULL,
	"succeeded" integer DEFAULT 0 NOT NULL,
	"total_charge_amount" numeric(12, 2) NOT NULL,
	"submitted_at" timestamp NOT NULL,
	"submitted_by" varchar(255) NOT NULL,
	"status" "batch_status" DEFAULT 'processing' NOT NULL,
	"clearinghouse_response" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "claim_batches_batch_number_unique" UNIQUE("batch_number")
);
--> statement-breakpoint
CREATE TABLE "claim_eras" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"era_number" varchar(100) NOT NULL,
	"payer_id" varchar(255),
	"payment_amount" numeric(12, 2) NOT NULL,
	"payment_date" date NOT NULL,
	"check_number" varchar(100),
	"claim_payments" jsonb NOT NULL,
	"received_at" timestamp NOT NULL,
	"processed_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "claim_eras_era_number_unique" UNIQUE("era_number")
);
--> statement-breakpoint
CREATE TABLE "claim_line_items" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255),
	"claim_id" varchar(255) NOT NULL,
	"line_number" integer NOT NULL,
	"service_date" date NOT NULL,
	"procedure_code" varchar(20) NOT NULL,
	"modifiers" jsonb,
	"description" text,
	"diagnosis_code_pointers" jsonb,
	"units" integer DEFAULT 1 NOT NULL,
	"charge_amount" numeric(10, 2) NOT NULL,
	"allowed_amount" numeric(10, 2),
	"paid_amount" numeric(10, 2),
	"adjustment_amount" numeric(10, 2) DEFAULT '0',
	"patient_responsibility" numeric(10, 2),
	"place_of_service" "service_place",
	"rendering_provider_id" varchar(255),
	"status" "claim_status",
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical_alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"type" "clinical_alert_type" NOT NULL,
	"severity" "alert_severity" NOT NULL,
	"message" text NOT NULL,
	"details" text NOT NULL,
	"recommendations" jsonb NOT NULL,
	"requires_acknowledgment" boolean DEFAULT false NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"acknowledged_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical_guidelines" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"condition" text NOT NULL,
	"organization" text NOT NULL,
	"version" text NOT NULL,
	"last_updated" timestamp with time zone NOT NULL,
	"recommendations" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"registry_id" text,
	"program_id" text,
	"metric_type" text NOT NULL,
	"metric_name" text NOT NULL,
	"value" real NOT NULL,
	"unit" text NOT NULL,
	"target_value" real,
	"is_at_goal" boolean NOT NULL,
	"measurement_date" timestamp with time zone NOT NULL,
	"source" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical_notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"patient_id" varchar,
	"practitioner_id" varchar,
	"note_type" "clinical_note_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"subjective" text,
	"objective" text,
	"assessment" text,
	"plan" text,
	"note_date" timestamp with time zone NOT NULL,
	"service_date" timestamp with time zone,
	"status" varchar(50) DEFAULT 'draft',
	"is_signed" boolean DEFAULT false,
	"signed_at" timestamp with time zone,
	"signed_by" varchar,
	"created_by" varchar,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"appointment_id" varchar,
	"attachments" jsonb,
	"deleted_at" timestamp with time zone,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE "company_profiles" (
	"id" varchar PRIMARY KEY NOT NULL,
	"company_id" varchar NOT NULL,
	"is_marketplace_visible" boolean DEFAULT true NOT NULL,
	"marketplace_verified" boolean DEFAULT false NOT NULL,
	"featured_until" timestamp,
	"profile_headline" varchar(200),
	"profile_description" text,
	"tagline" varchar(100),
	"specialties" jsonb DEFAULT '[]'::jsonb,
	"certifications" jsonb DEFAULT '[]'::jsonb,
	"equipment" jsonb DEFAULT '[]'::jsonb,
	"service_area" varchar(200),
	"turnaround_time_days" integer,
	"minimum_order_value" numeric(10, 2),
	"rush_service_available" boolean DEFAULT false,
	"shipping_methods" jsonb DEFAULT '[]'::jsonb,
	"logo_url" varchar(500),
	"banner_image_url" varchar(500),
	"gallery_images" jsonb DEFAULT '[]'::jsonb,
	"website_url" varchar(500),
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"public_address" jsonb,
	"total_connections" integer DEFAULT 0 NOT NULL,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"average_rating" numeric(3, 2),
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"slug" varchar(255),
	"meta_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "company_profiles_company_id_unique" UNIQUE("company_id"),
	CONSTRAINT "company_profiles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "company_relationships" (
	"id" varchar PRIMARY KEY NOT NULL,
	"company_a_id" varchar NOT NULL,
	"company_b_id" varchar NOT NULL,
	"relationship_type" "relationship_type" NOT NULL,
	"status" "connection_status" DEFAULT 'pending' NOT NULL,
	"initiated_by_company_id" varchar NOT NULL,
	"connection_terms" text,
	"connection_message" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"disconnected_at" timestamp,
	"reviewed_by_user_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connection_requests" (
	"id" varchar PRIMARY KEY NOT NULL,
	"from_company_id" varchar NOT NULL,
	"to_company_id" varchar NOT NULL,
	"from_user_id" varchar NOT NULL,
	"message" text,
	"requested_relationship_type" "relationship_type" NOT NULL,
	"proposed_terms" text,
	"status" "connection_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by_user_id" varchar,
	"reviewed_at" timestamp,
	"response_message" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_lens_aftercare" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"patient_id" varchar(255) NOT NULL,
	"prescription_id" varchar(255),
	"practitioner_id" varchar(255),
	"appointment_date" date NOT NULL,
	"appointment_type" varchar(50) NOT NULL,
	"status" "cl_aftercare_status" DEFAULT 'scheduled' NOT NULL,
	"wearing_time_compliance" varchar(50),
	"replacement_compliance" varchar(50),
	"care_system_compliance" varchar(50),
	"sleeping_in_lenses" boolean,
	"water_exposure" boolean,
	"visual_acuity_od" varchar(10),
	"visual_acuity_os" varchar(10),
	"comfort" varchar(50),
	"lens_condition_od" varchar(100),
	"lens_condition_os" varchar(100),
	"fit_assessment_od" "cl_fit_assessment",
	"fit_assessment_os" "cl_fit_assessment",
	"cornea_health_od" varchar(100),
	"cornea_health_os" varchar(100),
	"conjunctiva_health_od" varchar(100),
	"conjunctiva_health_os" varchar(100),
	"problems_reported" text,
	"adverse_events" text,
	"prescription_changed" boolean DEFAULT false,
	"lenses_replaced" boolean DEFAULT false,
	"care_system_changed" boolean DEFAULT false,
	"additional_training" boolean DEFAULT false,
	"referral_made" boolean DEFAULT false,
	"next_appointment_date" date,
	"next_appointment_reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_lens_assessments" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"patient_id" varchar(255) NOT NULL,
	"practitioner_id" varchar(255),
	"assessment_date" date NOT NULL,
	"previous_cl_wearer" boolean DEFAULT false NOT NULL,
	"previous_cl_type" varchar(100),
	"reason_for_discontinuation" text,
	"motivation_reason" text,
	"occupation" varchar(255),
	"hobbies" text,
	"screen_time" varchar(50),
	"dry_eyes" boolean DEFAULT false,
	"allergies" text,
	"medications" text,
	"contraindications" text,
	"tear_quality" varchar(50),
	"tear_breakup_time" numeric(4, 1),
	"cornea_condition" text,
	"conjunctiva_condition" text,
	"lids_condition" text,
	"suitable" boolean NOT NULL,
	"recommended_lens_type" "cl_lens_type",
	"recommended_wearing_schedule" "cl_wearing_schedule",
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_lens_fittings" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"patient_id" varchar(255) NOT NULL,
	"assessment_id" varchar(255),
	"practitioner_id" varchar(255),
	"fitting_date" date NOT NULL,
	"eye" varchar(2) NOT NULL,
	"trial_lens_brand" varchar(255) NOT NULL,
	"trial_lens_type" "cl_lens_type" NOT NULL,
	"trial_base_curve" numeric(4, 2),
	"trial_diameter" numeric(4, 1),
	"trial_power" numeric(5, 2),
	"trial_cylinder" numeric(5, 2),
	"trial_axis" integer,
	"trial_addition" numeric(3, 2),
	"over_refraction_sphere" numeric(5, 2),
	"over_refraction_cylinder" numeric(5, 2),
	"over_refraction_axis" integer,
	"centration" varchar(50),
	"movement" varchar(50),
	"coverage" varchar(50),
	"comfort" varchar(50),
	"fit_assessment" "cl_fit_assessment" NOT NULL,
	"distance_vision" varchar(10),
	"near_vision" varchar(10),
	"final_base_curve" numeric(4, 2),
	"final_diameter" numeric(4, 1),
	"final_power" numeric(5, 2),
	"final_cylinder" numeric(5, 2),
	"final_axis" integer,
	"final_addition" numeric(3, 2),
	"insertion_taught" boolean DEFAULT false,
	"removal_taught" boolean DEFAULT false,
	"care_taught" boolean DEFAULT false,
	"patient_demonstrated" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_lens_inventory" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"brand" varchar(255) NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"lens_type" "cl_lens_type" NOT NULL,
	"design" "cl_design" NOT NULL,
	"replacement_schedule" "cl_replacement_schedule" NOT NULL,
	"base_curve" numeric(4, 2) NOT NULL,
	"diameter" numeric(4, 1) NOT NULL,
	"power" numeric(5, 2) NOT NULL,
	"cylinder" numeric(5, 2),
	"axis" integer,
	"addition" numeric(3, 2),
	"quantity_in_stock" integer DEFAULT 0 NOT NULL,
	"reorder_level" integer DEFAULT 5 NOT NULL,
	"reorder_quantity" integer DEFAULT 10 NOT NULL,
	"unit_cost" numeric(10, 2),
	"retail_price" numeric(10, 2),
	"supplier_id" varchar(255),
	"supplier_product_code" varchar(100),
	"expiry_date" date,
	"batch_number" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_trial_lens" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_lens_orders" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"patient_id" varchar(255) NOT NULL,
	"prescription_id" varchar(255),
	"order_number" varchar(50) NOT NULL,
	"order_date" date NOT NULL,
	"od_inventory_id" varchar(255),
	"od_quantity" integer NOT NULL,
	"od_unit_price" numeric(10, 2) NOT NULL,
	"os_inventory_id" varchar(255),
	"os_quantity" integer NOT NULL,
	"os_unit_price" numeric(10, 2) NOT NULL,
	"care_system_inventory_id" varchar(255),
	"care_system_quantity" integer,
	"care_system_price" numeric(10, 2),
	"subtotal" numeric(10, 2) NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0',
	"tax" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"nhs_funded" boolean DEFAULT false,
	"nhs_voucher_id" varchar(255),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"ordered_date" date,
	"received_date" date,
	"dispensed_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contact_lens_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "contact_lens_prescriptions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"patient_id" varchar(255) NOT NULL,
	"fitting_id" varchar(255),
	"practitioner_id" varchar(255),
	"prescription_date" date NOT NULL,
	"expiry_date" date,
	"od_brand" varchar(255) NOT NULL,
	"od_lens_type" "cl_lens_type" NOT NULL,
	"od_design" "cl_design" NOT NULL,
	"od_base_curve" numeric(4, 2) NOT NULL,
	"od_diameter" numeric(4, 1) NOT NULL,
	"od_power" numeric(5, 2) NOT NULL,
	"od_cylinder" numeric(5, 2),
	"od_axis" integer,
	"od_addition" numeric(3, 2),
	"od_color" varchar(100),
	"os_brand" varchar(255) NOT NULL,
	"os_lens_type" "cl_lens_type" NOT NULL,
	"os_design" "cl_design" NOT NULL,
	"os_base_curve" numeric(4, 2) NOT NULL,
	"os_diameter" numeric(4, 1) NOT NULL,
	"os_power" numeric(5, 2) NOT NULL,
	"os_cylinder" numeric(5, 2),
	"os_axis" integer,
	"os_addition" numeric(3, 2),
	"os_color" varchar(100),
	"wearing_schedule" "cl_wearing_schedule" NOT NULL,
	"replacement_schedule" "cl_replacement_schedule" NOT NULL,
	"max_wearing_time" integer,
	"care_system_brand" varchar(255),
	"care_system_type" varchar(100),
	"first_follow_up_date" date,
	"week_follow_up_date" date,
	"month_follow_up_date" date,
	"special_instructions" text,
	"notes" text,
	"nhs_funded" boolean DEFAULT false,
	"nhs_exemption_id" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_acquisition_sources" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"source" varchar NOT NULL,
	"campaign" varchar,
	"medium" varchar,
	"content" varchar,
	"total_cost" numeric(12, 2) DEFAULT '0',
	"customers_acquired" integer DEFAULT 0,
	"revenue_generated" numeric(14, 2) DEFAULT '0',
	"avg_lifetime_value" numeric(12, 2),
	"avg_monthly_retention" numeric(5, 4),
	"avg_churn_rate" numeric(5, 4),
	"cac" numeric(10, 2),
	"roi" numeric(8, 4),
	"period" varchar,
	"period_start" timestamp,
	"period_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_cohorts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"cohort_name" varchar NOT NULL,
	"cohort_period" varchar NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"total_customers" integer NOT NULL,
	"segment" varchar,
	"month_0_retention" numeric(5, 2),
	"month_1_retention" numeric(5, 2),
	"month_2_retention" numeric(5, 2),
	"month_3_retention" numeric(5, 2),
	"month_4_retention" numeric(5, 2),
	"month_5_retention" numeric(5, 2),
	"month_6_retention" numeric(5, 2),
	"month_7_retention" numeric(5, 2),
	"month_8_retention" numeric(5, 2),
	"month_9_retention" numeric(5, 2),
	"month_10_retention" numeric(5, 2),
	"month_11_retention" numeric(5, 2),
	"month_12_retention" numeric(5, 2),
	"avg_retention_rate" numeric(5, 2),
	"lifetime_retention" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_health_scores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"overall_score" integer NOT NULL,
	"engagement_score" integer NOT NULL,
	"adoption_score" integer NOT NULL,
	"satisfaction_score" integer NOT NULL,
	"score_history" jsonb,
	"trend" varchar(20),
	"risk_level" varchar(20),
	"last_calculated_at" timestamp,
	"calculated_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demand_forecasts" (
	"id" varchar PRIMARY KEY NOT NULL,
	"company_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"forecast_date" timestamp NOT NULL,
	"predicted_demand" integer NOT NULL,
	"confidence_interval" numeric(5, 2),
	"forecast_method" "forecast_method" DEFAULT 'ai_ml' NOT NULL,
	"horizon" "forecast_horizon" DEFAULT 'week' NOT NULL,
	"historical_average" numeric(10, 2),
	"trend_factor" numeric(5, 2),
	"seasonality_factor" numeric(5, 2),
	"actual_demand" integer,
	"accuracy_score" numeric(5, 2),
	"model_version" varchar(50),
	"confidence" numeric(5, 2) NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diagnostic_suggestions" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"symptoms" jsonb NOT NULL,
	"lab_results" jsonb,
	"vital_signs" jsonb,
	"possible_diagnoses" jsonb NOT NULL,
	"confidence" "confidence_level" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disease_management_programs" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"disease_type" text NOT NULL,
	"description" text NOT NULL,
	"objectives" jsonb NOT NULL,
	"eligibility_criteria" jsonb NOT NULL,
	"interventions" jsonb NOT NULL,
	"quality_measures" jsonb NOT NULL,
	"duration" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"enrollment_count" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disease_progression_predictions" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"disease" text NOT NULL,
	"current_stage" text NOT NULL,
	"predicted_stages" jsonb NOT NULL,
	"risk_factors" jsonb NOT NULL,
	"confidence" "prediction_confidence" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disease_registries" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"disease_code" text NOT NULL,
	"description" text NOT NULL,
	"criteria" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"patient_count" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drug_interactions" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"drug1_id" text NOT NULL,
	"drug2_id" text NOT NULL,
	"severity" "interaction_severity" NOT NULL,
	"description" text NOT NULL,
	"clinical_effects" jsonb NOT NULL,
	"management" text NOT NULL,
	"references" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drugs" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"generic_name" text NOT NULL,
	"brand_names" jsonb NOT NULL,
	"drug_class" text NOT NULL,
	"interactions" jsonb NOT NULL,
	"contraindications" jsonb NOT NULL,
	"side_effects" jsonb NOT NULL,
	"dosage_range" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dynamic_role_permissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" varchar NOT NULL,
	"permission_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"granted_by" varchar
);
--> statement-breakpoint
CREATE TABLE "dynamic_roles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_system_default" boolean DEFAULT false NOT NULL,
	"is_deletable" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar
);
--> statement-breakpoint
CREATE TABLE "eligibility_verifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"patient_id" varchar NOT NULL,
	"insurance_plan_id" varchar,
	"verification_date" timestamp DEFAULT now() NOT NULL,
	"verified_by" varchar,
	"status" varchar(50) DEFAULT 'pending',
	"eligibility_status" varchar(50),
	"coverage_details" jsonb,
	"copay_amount" numeric(10, 2),
	"deductible_remaining" numeric(10, 2),
	"out_of_pocket_remaining" numeric(10, 2),
	"response_data" jsonb,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_log" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"type" varchar(100) NOT NULL,
	"user_id" varchar(255),
	"company_id" varchar(255),
	"data" jsonb NOT NULL,
	"metadata" jsonb,
	"timestamp" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_usage_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"feature_name" varchar NOT NULL,
	"usage_count" integer DEFAULT 0,
	"active_users" integer DEFAULT 0,
	"last_used_at" timestamp,
	"tier" varchar(50),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"type" "feedback_type" NOT NULL,
	"message" text NOT NULL,
	"contact_email" text,
	"context" text,
	"user_agent" text,
	"status" "feedback_status" DEFAULT 'new' NOT NULL,
	"admin_notes" text,
	"resolved_at" timestamp with time zone,
	"resolved_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forecast_accuracy_metrics" (
	"id" varchar PRIMARY KEY NOT NULL,
	"company_id" varchar NOT NULL,
	"product_id" varchar,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"mape" numeric(5, 2),
	"mae" numeric(10, 2),
	"rmse" numeric(10, 2),
	"total_forecasts" integer NOT NULL,
	"accurate_forecasts" integer NOT NULL,
	"forecast_method" "forecast_method" NOT NULL,
	"model_version" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "frame_characteristics" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"product_id" varchar(255) NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"frame_style" "frame_style" NOT NULL,
	"frame_material" "frame_material" NOT NULL,
	"frame_size" varchar(50) NOT NULL,
	"recommended_face_shapes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"lens_width" numeric(5, 1),
	"bridge_width" numeric(5, 1),
	"temple_length" numeric(5, 1),
	"frame_height" numeric(5, 1),
	"gender" varchar(20),
	"age_range" varchar(50),
	"style" varchar(100),
	"color_family" varchar(50),
	"has_nose_pads" boolean DEFAULT false,
	"is_adjustable" boolean DEFAULT false,
	"is_sunglasses" boolean DEFAULT false,
	"is_polarized" boolean DEFAULT false,
	"popularity_score" numeric(5, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "frame_characteristics_product_id_unique" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE "frame_recommendation_analytics" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"product_id" varchar(255) NOT NULL,
	"total_recommendations" integer DEFAULT 0,
	"total_views" integer DEFAULT 0,
	"total_likes" integer DEFAULT 0,
	"total_purchases" integer DEFAULT 0,
	"total_dismissals" integer DEFAULT 0,
	"view_rate" numeric(5, 2) DEFAULT '0',
	"like_rate" numeric(5, 2) DEFAULT '0',
	"purchase_rate" numeric(5, 2) DEFAULT '0',
	"dismissal_rate" numeric(5, 2) DEFAULT '0',
	"avg_match_score" numeric(5, 2) DEFAULT '0',
	"avg_rank" numeric(5, 2) DEFAULT '0',
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "frame_recommendations" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"face_analysis_id" varchar(255) NOT NULL,
	"patient_id" varchar(255) NOT NULL,
	"product_id" varchar(255) NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"match_score" numeric(5, 2) NOT NULL,
	"match_reason" text NOT NULL,
	"rank" integer NOT NULL,
	"viewed" boolean DEFAULT false,
	"viewed_at" timestamp,
	"liked" boolean DEFAULT false,
	"liked_at" timestamp,
	"purchased" boolean DEFAULT false,
	"purchased_at" timestamp,
	"dismissed" boolean DEFAULT false,
	"dismissed_at" timestamp,
	"click_count" integer DEFAULT 0,
	"share_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_risk_assessments" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"assessment_type" text NOT NULL,
	"status" "assessment_status" DEFAULT 'pending' NOT NULL,
	"responses" jsonb NOT NULL,
	"total_score" numeric(10, 2) DEFAULT '0' NOT NULL,
	"risk_level" "risk_level" NOT NULL,
	"recommendations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"completed_date" timestamp with time zone,
	"expiration_date" timestamp with time zone NOT NULL,
	"administered_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "immunizations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"patient_id" varchar,
	"practitioner_id" varchar,
	"vaccine_name" varchar(255) NOT NULL,
	"vaccine_type" varchar(100) NOT NULL,
	"manufacturer" varchar(255),
	"lot_number" varchar(100),
	"administration_date" timestamp with time zone NOT NULL,
	"dose" varchar(100),
	"route" varchar(50),
	"site" varchar(50),
	"status" "immunization_status" DEFAULT 'administered' NOT NULL,
	"next_due_date" timestamp with time zone,
	"indications" text,
	"adverse_events" text,
	"notes" text,
	"administered_by" varchar,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"cvx_code" varchar(10)
);
--> statement-breakpoint
CREATE TABLE "insurance_claims" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"patient_id" varchar(255),
	"payer_id" varchar(255),
	"claim_number" varchar(50) NOT NULL,
	"claim_type" "claim_type" NOT NULL,
	"status" "claim_status" DEFAULT 'draft' NOT NULL,
	"service_date" date NOT NULL,
	"submitted_at" timestamp,
	"processed_at" timestamp,
	"total_charges" numeric(10, 2) NOT NULL,
	"allowed_amount" numeric(10, 2),
	"paid_amount" numeric(10, 2),
	"patient_responsibility" numeric(10, 2),
	"adjustments" numeric(10, 2) DEFAULT '0',
	"rendering_provider_id" varchar(255),
	"billing_provider_id" varchar(255),
	"place_of_service" "service_place",
	"diagnosis_codes" jsonb,
	"payer_response" jsonb,
	"rejection_reason" text,
	"remittance_advice_number" varchar(100),
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "insurance_claims_claim_number_unique" UNIQUE("claim_number")
);
--> statement-breakpoint
CREATE TABLE "insurance_companies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"payer_id" varchar(100),
	"npi" varchar(20),
	"address" jsonb,
	"phone" varchar(50),
	"fax" varchar(50),
	"email" varchar(255),
	"website" varchar(500),
	"edi_trading_partner_id" varchar(100),
	"clearinghouse" varchar(100),
	"claim_submission_method" varchar(50),
	"attachment_requirements" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insurance_payers" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"payer_id" varchar(100) NOT NULL,
	"type" "payer_type" NOT NULL,
	"contact_info" jsonb,
	"claim_submission_method" "claim_submission_method" DEFAULT 'electronic',
	"timely_filing_limit_days" integer DEFAULT 365,
	"active" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insurance_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"insurance_company_id" varchar,
	"plan_name" varchar(255) NOT NULL,
	"plan_type" varchar(50) NOT NULL,
	"plan_id" varchar(100),
	"group_id" varchar(100),
	"copayment_amount" numeric(10, 2),
	"deductible_amount" numeric(10, 2),
	"coinsurance_percentage" numeric(5, 2),
	"out_of_pocket_maximum" numeric(10, 2),
	"vision_coverage" jsonb,
	"exam_coverage" jsonb,
	"materials_coverage" jsonb,
	"preauthorization_required" boolean DEFAULT false,
	"referral_required" boolean DEFAULT false,
	"timely_filing_days" integer,
	"effective_date" timestamp,
	"termination_date" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"patient_id" varchar,
	"practitioner_id" varchar,
	"order_number" varchar(100) NOT NULL,
	"order_type" varchar(50),
	"priority" varchar(20) DEFAULT 'routine',
	"ordered_date" timestamp with time zone DEFAULT now() NOT NULL,
	"scheduled_date" timestamp with time zone,
	"completed_date" timestamp with time zone,
	"status" varchar(50) DEFAULT 'pending',
	"performing_lab" varchar(255),
	"diagnosis" text,
	"clinical_notes" text,
	"special_instructions" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lab_quality_control" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"technician_id" varchar,
	"test_code" varchar(50) NOT NULL,
	"test_name" varchar(255),
	"control_lot" varchar(100) NOT NULL,
	"control_level" varchar(50),
	"expiration_date" timestamp with time zone,
	"expected_value" numeric(10, 2) NOT NULL,
	"actual_value" numeric(10, 2) NOT NULL,
	"unit" varchar(50),
	"acceptable_range_min" numeric(10, 2),
	"acceptable_range_max" numeric(10, 2),
	"is_within_range" boolean NOT NULL,
	"deviation" numeric(10, 2),
	"percent_deviation" numeric(10, 2),
	"instrument_id" varchar(100),
	"instrument_name" varchar(255),
	"reagent_lot" varchar(100),
	"test_date" timestamp with time zone NOT NULL,
	"performed_by" varchar(255),
	"reviewed_by" varchar(255),
	"reviewed_at" timestamp with time zone,
	"action_taken" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lab_results" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"patient_id" varchar,
	"practitioner_id" varchar,
	"test_name" varchar(255) NOT NULL,
	"test_category" varchar(100),
	"loinc_code" varchar(20),
	"result_value" varchar(255),
	"result_unit" varchar(50),
	"reference_range" text,
	"abnormal_flag" varchar(10),
	"interpretation" text,
	"specimen_date" timestamp with time zone,
	"result_date" timestamp with time zone NOT NULL,
	"status" varchar(50) DEFAULT 'final',
	"performing_lab" varchar(255),
	"ordering_provider" varchar(255),
	"clinical_notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"accession_number" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "lab_test_catalog" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"test_code" varchar(50) NOT NULL,
	"test_name" varchar(255) NOT NULL,
	"category" varchar(100),
	"description" text,
	"specimen_type" varchar(100),
	"specimen_volume" varchar(50),
	"container_type" varchar(100),
	"turnaround_time" varchar(100),
	"loinc_code" varchar(20),
	"cpt_code" varchar(20),
	"cost" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"requires_approval" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "market_insights" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"insight_type" varchar(100) NOT NULL,
	"category" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"region" varchar(100),
	"country" varchar(100),
	"data_points" jsonb NOT NULL,
	"companies_included" integer NOT NULL,
	"records_analyzed" integer NOT NULL,
	"confidence_level" numeric(5, 2),
	"margin_of_error" numeric(5, 2),
	"access_level" varchar(50) DEFAULT 'free' NOT NULL,
	"price" numeric(10, 2),
	"generated_by" varchar(255),
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "measure_calculations" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"measure_id" varchar(255) NOT NULL,
	"calculation_date" timestamp NOT NULL,
	"reporting_period_start" date NOT NULL,
	"reporting_period_end" date NOT NULL,
	"numerator" integer NOT NULL,
	"denominator" integer NOT NULL,
	"exclusions" integer DEFAULT 0 NOT NULL,
	"rate" numeric(5, 2) NOT NULL,
	"target_rate" numeric(5, 2) NOT NULL,
	"performance_gap" numeric(5, 2) NOT NULL,
	"meeting_target" boolean NOT NULL,
	"patient_list" jsonb NOT NULL,
	"calculated_by" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_claims" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"patient_id" varchar NOT NULL,
	"insurance_plan_id" varchar,
	"claim_number" varchar(50) NOT NULL,
	"claim_type" varchar(50) DEFAULT 'professional',
	"status" varchar(50) DEFAULT 'draft',
	"service_date" timestamp NOT NULL,
	"place_of_service" varchar(10),
	"diagnosis_codes" jsonb,
	"total_charges" numeric(10, 2),
	"allowed_amount" numeric(10, 2),
	"paid_amount" numeric(10, 2),
	"patient_responsibility" numeric(10, 2),
	"adjustment_amount" numeric(10, 2),
	"adjustment_reasons" jsonb,
	"submitted_at" timestamp,
	"processed_at" timestamp,
	"denial_reason" text,
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_records" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"type" "medical_record_type" NOT NULL,
	"title" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"provider" text NOT NULL,
	"summary" text,
	"details" jsonb,
	"attachments" jsonb,
	"viewable" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"patient_id" varchar,
	"practitioner_id" varchar,
	"medication_name" varchar(255) NOT NULL,
	"generic_name" varchar(255),
	"ndc_code" varchar(20),
	"dosage" varchar(100) NOT NULL,
	"route" varchar(50) NOT NULL,
	"frequency" varchar(100) NOT NULL,
	"instructions" text,
	"prescribed_date" timestamp with time zone NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"status" "medication_status" DEFAULT 'active' NOT NULL,
	"reason" text,
	"quantity" integer,
	"refills" integer DEFAULT 0,
	"pharmacy" varchar(255),
	"prescribed_by" varchar,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"external_prescription_id" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"channel" "communication_channel" NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"variables" jsonb NOT NULL,
	"category" "message_category" NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"channel" "communication_channel" NOT NULL,
	"template_id" text,
	"recipient_id" text NOT NULL,
	"recipient_type" "recipient_type" NOT NULL,
	"to" text NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"metadata" jsonb,
	"status" "message_status" DEFAULT 'draft' NOT NULL,
	"priority" "message_priority" DEFAULT 'normal' NOT NULL,
	"scheduled_for" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"clicked_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"tracking_id" text,
	"campaign_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ml_models" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "ml_model_type" NOT NULL,
	"version" text NOT NULL,
	"trained_at" timestamp with time zone NOT NULL,
	"features" jsonb NOT NULL,
	"performance" jsonb NOT NULL,
	"status" "ml_model_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_recurring_revenue" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"breakdown" jsonb,
	"total_mrr" numeric(14, 2) NOT NULL,
	"arr" numeric(14, 2) NOT NULL,
	"new_mrr" numeric(14, 2),
	"expansion_mrr" numeric(14, 2),
	"contraction_mrr" numeric(14, 2),
	"churn_mrr" numeric(14, 2),
	"mom_growth" numeric(8, 4),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nhs_claims" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"patient_id" varchar(255) NOT NULL,
	"examination_id" varchar(255),
	"practitioner_id" varchar(255) NOT NULL,
	"claim_type" "nhs_gos_claim_type" NOT NULL,
	"claim_number" varchar(50) NOT NULL,
	"claim_date" date NOT NULL,
	"test_date" date NOT NULL,
	"patient_nhs_number" varchar(20),
	"patient_exemption_reason" "nhs_exemption_reason",
	"patient_exemption_evidence" varchar(255),
	"prescription_issued" boolean DEFAULT false NOT NULL,
	"referral_made" boolean DEFAULT false NOT NULL,
	"referral_urgency" varchar(50),
	"clinical_notes" text,
	"status" "nhs_claim_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp,
	"submitted_by" varchar(255),
	"pcse_reference" varchar(100),
	"pcse_status" varchar(50),
	"pcse_response" jsonb,
	"rejection_reason" text,
	"claim_amount" numeric(10, 2) NOT NULL,
	"paid_amount" numeric(10, 2),
	"paid_at" timestamp,
	"payment_reference" varchar(100),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" varchar(255),
	CONSTRAINT "nhs_claims_claim_number_unique" UNIQUE("claim_number")
);
--> statement-breakpoint
CREATE TABLE "nhs_contract_details" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"contract_number" varchar(50) NOT NULL,
	"contract_holder_name" varchar(255) NOT NULL,
	"contract_start_date" date NOT NULL,
	"contract_end_date" date,
	"ods_code" varchar(20) NOT NULL,
	"practice_address" jsonb NOT NULL,
	"pcse_account_number" varchar(50),
	"pcse_bank_details" jsonb,
	"claim_submission_email" varchar(255),
	"claim_submission_method" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nhs_contract_details_company_id_unique" UNIQUE("company_id"),
	CONSTRAINT "nhs_contract_details_contract_number_unique" UNIQUE("contract_number")
);
--> statement-breakpoint
CREATE TABLE "nhs_patient_exemptions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"patient_id" varchar(255) NOT NULL,
	"exemption_reason" "nhs_exemption_reason" NOT NULL,
	"evidence_type" varchar(100),
	"evidence_number" varchar(100),
	"evidence_document_url" text,
	"valid_from" date NOT NULL,
	"valid_until" date,
	"is_lifelong" boolean DEFAULT false,
	"verified_by" varchar(255),
	"verified_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nhs_payments" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"payment_reference" varchar(100) NOT NULL,
	"payment_date" date NOT NULL,
	"payment_amount" numeric(10, 2) NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"claim_count" integer DEFAULT 0 NOT NULL,
	"claim_ids" jsonb,
	"payment_method" varchar(50),
	"bank_account" varchar(20),
	"is_reconciled" boolean DEFAULT false NOT NULL,
	"reconciled_at" timestamp,
	"reconciled_by" varchar(255),
	"discrepancy_amount" numeric(10, 2),
	"discrepancy_notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nhs_payments_payment_reference_unique" UNIQUE("payment_reference")
);
--> statement-breakpoint
CREATE TABLE "nhs_practitioners" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"goc_number" varchar(20) NOT NULL,
	"goc_registration_type" varchar(50) NOT NULL,
	"goc_expiry_date" date NOT NULL,
	"performer_number" varchar(20) NOT NULL,
	"nhs_contract_start_date" date,
	"nhs_contract_end_date" date,
	"indemnity_provider" varchar(255),
	"indemnity_policy_number" varchar(100),
	"indemnity_expiry_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nhs_practitioners_goc_number_unique" UNIQUE("goc_number"),
	CONSTRAINT "nhs_practitioners_performer_number_unique" UNIQUE("performer_number")
);
--> statement-breakpoint
CREATE TABLE "nhs_vouchers" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"patient_id" varchar(255) NOT NULL,
	"prescription_id" varchar(255),
	"claim_id" varchar(255),
	"voucher_type" "nhs_voucher_type" NOT NULL,
	"voucher_number" varchar(50) NOT NULL,
	"voucher_value" numeric(10, 2) NOT NULL,
	"issue_date" date NOT NULL,
	"expiry_date" date NOT NULL,
	"exemption_reason" "nhs_exemption_reason" NOT NULL,
	"exemption_evidence" varchar(255),
	"sphere_od" numeric(5, 2),
	"sphere_os" numeric(5, 2),
	"cylinder_od" numeric(5, 2),
	"cylinder_os" numeric(5, 2),
	"prism_required" boolean DEFAULT false,
	"tint_required" boolean DEFAULT false,
	"is_redeemed" boolean DEFAULT false NOT NULL,
	"redeemed_at" timestamp,
	"redeemed_amount" numeric(10, 2),
	"patient_contribution" numeric(10, 2),
	"has_complex_supplement" boolean DEFAULT false,
	"supplement_amount" numeric(10, 2),
	"supplement_reason" text,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nhs_vouchers_voucher_number_unique" UNIQUE("voucher_number")
);
--> statement-breakpoint
CREATE TABLE "no_show_predictions" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"appointment_id" text NOT NULL,
	"probability" integer NOT NULL,
	"risk_level" "risk_level" NOT NULL,
	"contributing_factors" jsonb NOT NULL,
	"recommended_actions" jsonb NOT NULL,
	"confidence" "prediction_confidence" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nps_surveys" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"score" integer NOT NULL,
	"category" "nps_category" NOT NULL,
	"feedback" text,
	"trigger" text,
	"context" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outcome_tracking" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"program_id" text,
	"registry_id" text,
	"outcome_type" "outcome_type" NOT NULL,
	"measure" text NOT NULL,
	"baseline_value" real NOT NULL,
	"current_value" real NOT NULL,
	"target_value" real,
	"improvement" real NOT NULL,
	"improvement_percentage" real NOT NULL,
	"unit" text NOT NULL,
	"baseline_date" timestamp with time zone NOT NULL,
	"latest_measurement_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_activity_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"patient_id" varchar NOT NULL,
	"activity_type" "patient_activity_type" NOT NULL,
	"order_id" varchar,
	"examination_id" varchar,
	"prescription_id" varchar,
	"activity_title" varchar(255) NOT NULL,
	"activity_description" text,
	"activity_data" jsonb,
	"changes_before" jsonb,
	"changes_after" jsonb,
	"changed_fields" jsonb,
	"performed_by" varchar(255) NOT NULL,
	"performed_by_name" varchar(255),
	"performed_by_role" varchar(100),
	"ip_address" varchar(50),
	"user_agent" text,
	"source" varchar(100) DEFAULT 'web',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar NOT NULL,
	"company_id" varchar NOT NULL,
	"document_type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"file_url" varchar NOT NULL,
	"file_name" varchar NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"is_shared" boolean DEFAULT false NOT NULL,
	"status" varchar DEFAULT 'active' NOT NULL,
	"uploaded_by" varchar,
	"tags" jsonb,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "patient_engagement" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"program_id" text,
	"engagement_type" "engagement_type" NOT NULL,
	"description" text NOT NULL,
	"engagement_date" timestamp with time zone NOT NULL,
	"score" integer,
	"notes" text NOT NULL,
	"recorded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_face_analysis" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"patient_id" varchar(255) NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"face_shape" "face_shape" NOT NULL,
	"face_shape_confidence" numeric(5, 2) NOT NULL,
	"face_length" numeric(10, 2),
	"face_width" numeric(10, 2),
	"jawline_width" numeric(10, 2),
	"forehead_width" numeric(10, 2),
	"cheekbone_width" numeric(10, 2),
	"skin_tone" varchar(50),
	"hair_color" varchar(50),
	"eye_color" varchar(50),
	"photo_url" text NOT NULL,
	"thumbnail_url" text,
	"ai_model" varchar(100) DEFAULT 'tensorflow-facemesh-v1' NOT NULL,
	"processing_time" integer,
	"landmark_points" jsonb,
	"raw_analysis_data" jsonb,
	"analyzed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_health_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar NOT NULL,
	"company_id" varchar NOT NULL,
	"metric_type" varchar NOT NULL,
	"value" numeric NOT NULL,
	"unit" varchar NOT NULL,
	"measured_at" timestamp NOT NULL,
	"notes" text,
	"device_info" varchar,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"source" varchar DEFAULT 'patient',
	"custom_metric_name" varchar,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "patient_insurance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"patient_id" varchar NOT NULL,
	"insurance_plan_id" varchar,
	"member_id" varchar(100),
	"subscriber_id" varchar(100),
	"group_number" varchar(100),
	"subscriber_first_name" varchar(100),
	"subscriber_last_name" varchar(100),
	"subscriber_dob" timestamp,
	"relationship_to_subscriber" varchar(50),
	"priority" integer DEFAULT 1,
	"status" varchar(50) DEFAULT 'active',
	"effective_date" timestamp,
	"termination_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_outreach" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"task_id" text,
	"outreach_type" "outreach_type" NOT NULL,
	"purpose" text NOT NULL,
	"status" "outreach_status" DEFAULT 'scheduled' NOT NULL,
	"scheduled_date" timestamp with time zone,
	"attempted_date" timestamp with time zone,
	"completed_date" timestamp with time zone,
	"contact_result" "outreach_contact_result",
	"notes" text NOT NULL,
	"next_steps" jsonb NOT NULL,
	"performed_by" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_portal_access_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar NOT NULL,
	"company_id" varchar NOT NULL,
	"access_time" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar,
	"user_agent" text,
	"action" varchar NOT NULL,
	"resource_type" varchar,
	"resource_id" varchar,
	"success" boolean DEFAULT true NOT NULL,
	"failure_reason" varchar,
	"session_id" varchar,
	"location" jsonb,
	"device_fingerprint" varchar
);
--> statement-breakpoint
CREATE TABLE "patient_portal_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar NOT NULL,
	"preferred_language" varchar DEFAULT 'en',
	"timezone" varchar DEFAULT 'UTC',
	"notification_preferences" jsonb,
	"privacy_settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"patient_id" varchar,
	"claim_id" varchar,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"payment_method" varchar(50),
	"payment_source" varchar(50),
	"check_number" varchar(50),
	"reference_number" varchar(100),
	"amount" numeric(10, 2) NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"processed_date" timestamp,
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pdsa_cycles" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"project_id" text NOT NULL,
	"cycle_number" integer NOT NULL,
	"status" "pdsa_cycle_status" DEFAULT 'plan' NOT NULL,
	"plan" jsonb NOT NULL,
	"do" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"study" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"act" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"completion_date" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_improvements" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"metric" text NOT NULL,
	"baseline_value" numeric(10, 2) NOT NULL,
	"baseline_date" timestamp with time zone NOT NULL,
	"target_value" numeric(10, 2) NOT NULL,
	"target_date" timestamp with time zone NOT NULL,
	"current_value" numeric(10, 2) NOT NULL,
	"current_date" timestamp with time zone NOT NULL,
	"improvement" numeric(10, 2) NOT NULL,
	"improvement_percentage" numeric(5, 2) NOT NULL,
	"trend" "pi_trend" NOT NULL,
	"status" "pi_status" NOT NULL,
	"data_points" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_statistics" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"period_type" varchar(50) DEFAULT 'daily' NOT NULL,
	"total_companies" integer DEFAULT 0 NOT NULL,
	"active_companies" integer DEFAULT 0 NOT NULL,
	"new_companies_added" integer DEFAULT 0 NOT NULL,
	"companies_by_type" jsonb,
	"total_users" integer DEFAULT 0 NOT NULL,
	"active_users" integer DEFAULT 0 NOT NULL,
	"new_users_added" integer DEFAULT 0 NOT NULL,
	"total_revenue" numeric(12, 2) DEFAULT '0' NOT NULL,
	"mrr" numeric(12, 2) DEFAULT '0' NOT NULL,
	"arr" numeric(12, 2) DEFAULT '0' NOT NULL,
	"churn_rate" numeric(5, 2),
	"subscriptions_by_plan" jsonb,
	"orders_created" integer DEFAULT 0 NOT NULL,
	"patients_added" integer DEFAULT 0 NOT NULL,
	"invoices_generated" integer DEFAULT 0 NOT NULL,
	"ai_queries_processed" integer DEFAULT 0 NOT NULL,
	"api_calls_total" integer DEFAULT 0 NOT NULL,
	"api_error_rate" numeric(5, 2),
	"average_response_time" integer,
	"uptime_percentage" numeric(5, 2),
	"total_connections" integer DEFAULT 0 NOT NULL,
	"connection_requests_created" integer DEFAULT 0 NOT NULL,
	"connection_approval_rate" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portal_conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"provider_name" text NOT NULL,
	"subject" text NOT NULL,
	"status" "conversation_status" DEFAULT 'open' NOT NULL,
	"last_message_at" timestamp with time zone NOT NULL,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portal_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"conversation_id" text NOT NULL,
	"from" "message_sender_type" NOT NULL,
	"sender_id" text NOT NULL,
	"sender_name" text NOT NULL,
	"recipient_id" text NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"attachments" jsonb,
	"read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portal_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"bill_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"amount" integer NOT NULL,
	"method" "payment_method" NOT NULL,
	"status" "portal_payment_status" DEFAULT 'pending' NOT NULL,
	"transaction_id" text,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preauthorizations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"patient_id" varchar NOT NULL,
	"insurance_plan_id" varchar,
	"request_date" timestamp DEFAULT now() NOT NULL,
	"requested_by" varchar,
	"service_type" varchar(100),
	"procedure_codes" jsonb,
	"diagnosis_codes" jsonb,
	"status" varchar(50) DEFAULT 'pending',
	"authorization_number" varchar(100),
	"approved_units" integer,
	"approved_amount" numeric(10, 2),
	"effective_date" timestamp,
	"expiration_date" timestamp,
	"denial_reason" text,
	"notes" text,
	"response_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "predictive_analyses" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"model_id" text NOT NULL,
	"model_name" text NOT NULL,
	"predicted_outcome" text NOT NULL,
	"probability" numeric(5, 4) NOT NULL,
	"confidence" numeric(5, 4) NOT NULL,
	"risk_level" "risk_level" NOT NULL,
	"contributing_factors" jsonb NOT NULL,
	"recommendations" jsonb NOT NULL,
	"analyzed_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "predictive_models" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"version" text NOT NULL,
	"model_type" text NOT NULL,
	"description" text NOT NULL,
	"input_features" jsonb NOT NULL,
	"output_metric" text NOT NULL,
	"accuracy" numeric(5, 4) NOT NULL,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_until" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescription_uploads" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"shopify_order_id" varchar(255),
	"patient_id" varchar(255),
	"file_url" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"file_size" integer,
	"ai_extracted_data" jsonb,
	"ai_extraction_confidence" numeric(5, 2),
	"prescription_data" jsonb,
	"prescription_date" date,
	"expiry_date" date,
	"practitioner_name" varchar(255),
	"practitioner_goc_number" varchar(50),
	"verification_status" "prescription_verification_status" DEFAULT 'pending' NOT NULL,
	"verified_by" varchar(255),
	"verified_at" timestamp,
	"rejection_reason" text,
	"requires_review" boolean DEFAULT false,
	"review_notes" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preventive_care_recommendations" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"recommendation_type" "preventive_care_type" NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"frequency" text NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"status" "preventive_care_status" DEFAULT 'due' NOT NULL,
	"completed_date" timestamp with time zone,
	"next_due_date" timestamp with time zone,
	"evidence" text NOT NULL,
	"importance" "preventive_care_importance" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"program_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"enrollment_date" timestamp with time zone NOT NULL,
	"expected_end_date" timestamp with time zone NOT NULL,
	"status" "program_enrollment_status" DEFAULT 'active' NOT NULL,
	"completion_percentage" integer DEFAULT 0 NOT NULL,
	"interventions_completed" jsonb NOT NULL,
	"outcomes_achieved" jsonb NOT NULL,
	"withdrawal_reason" text,
	"end_date" timestamp with time zone,
	"assigned_coach" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_availability" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"provider_name" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"slot_duration" integer NOT NULL,
	"break_times" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quality_dashboards" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"measures" jsonb NOT NULL,
	"filters" jsonb,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quality_gap_analyses" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"measure_id" varchar(255) NOT NULL,
	"analysis_date" timestamp NOT NULL,
	"total_gaps" integer NOT NULL,
	"closable_gaps" integer NOT NULL,
	"potential_rate_improvement" numeric(5, 2) NOT NULL,
	"gaps_by_reason" jsonb NOT NULL,
	"recommended_actions" jsonb NOT NULL,
	"projected_impact" jsonb NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quality_improvement_projects" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"project_number" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"aim" text NOT NULL,
	"scope" text NOT NULL,
	"status" "qi_project_status" DEFAULT 'planning' NOT NULL,
	"priority" "qi_priority" NOT NULL,
	"team_lead" text NOT NULL,
	"team_members" jsonb NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"target_completion_date" timestamp with time zone NOT NULL,
	"actual_completion_date" timestamp with time zone,
	"baseline" jsonb NOT NULL,
	"target" jsonb NOT NULL,
	"pdsa_cycles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"interventions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"barriers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"success_factors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quality_measures" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"measure_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "measure_type" NOT NULL,
	"domain" "measure_domain" NOT NULL,
	"description" text NOT NULL,
	"numerator_criteria" text NOT NULL,
	"denominator_criteria" text NOT NULL,
	"exclusion_criteria" text,
	"target_rate" numeric(5, 2) NOT NULL,
	"reporting_year" integer NOT NULL,
	"active" boolean DEFAULT true,
	"evidence_source" varchar(255) NOT NULL,
	"steward" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readmission_predictions" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"admission_id" text NOT NULL,
	"probability" integer NOT NULL,
	"risk_level" "risk_level" NOT NULL,
	"timeframe" "readmission_timeframe" NOT NULL,
	"contributing_factors" jsonb NOT NULL,
	"preventive_actions" jsonb NOT NULL,
	"confidence" "prediction_confidence" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registry_enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"registry_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"enrollment_date" timestamp with time zone NOT NULL,
	"status" "registry_enrollment_status" DEFAULT 'active' NOT NULL,
	"enrollment_reason" text NOT NULL,
	"disenrollment_date" timestamp with time zone,
	"disenrollment_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"score_type" text NOT NULL,
	"score" numeric(10, 2) NOT NULL,
	"risk_level" "risk_level" NOT NULL,
	"category" "risk_category" NOT NULL,
	"factors" jsonb NOT NULL,
	"calculated_date" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_until" timestamp with time zone NOT NULL,
	"calculated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_stratification_cohorts" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"criteria" jsonb NOT NULL,
	"risk_levels" jsonb NOT NULL,
	"patient_count" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_stratifications" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"risk_type" "risk_type" NOT NULL,
	"risk_level" "risk_level" NOT NULL,
	"risk_score" integer NOT NULL,
	"confidence" "prediction_confidence" NOT NULL,
	"risk_factors" jsonb NOT NULL,
	"interventions" jsonb NOT NULL,
	"predicted_timeframe" text,
	"model_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_change_audit" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"changed_by" varchar,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"role_id" varchar,
	"permission_id" varchar,
	"details" jsonb,
	"ip_address" varchar(45),
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "seasonal_patterns" (
	"id" varchar PRIMARY KEY NOT NULL,
	"company_id" varchar NOT NULL,
	"product_id" varchar,
	"pattern_type" varchar(50) NOT NULL,
	"pattern_name" varchar(255) NOT NULL,
	"peak_period" varchar(100),
	"demand_multiplier" numeric(5, 2) NOT NULL,
	"confidence" numeric(5, 2) NOT NULL,
	"observation_count" integer NOT NULL,
	"first_observed" timestamp NOT NULL,
	"last_observed" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopify_orders" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"shopify_store_id" varchar(255) NOT NULL,
	"ils_order_id" varchar(255),
	"patient_id" varchar(255),
	"prescription_id" varchar(255),
	"shopify_order_number" varchar(100) NOT NULL,
	"shopify_order_id" varchar(255) NOT NULL,
	"shopify_order_name" varchar(100),
	"customer_email" varchar(255),
	"customer_phone" varchar(50),
	"customer_name" varchar(255),
	"shipping_address" jsonb,
	"billing_address" jsonb,
	"order_items" jsonb NOT NULL,
	"prescription_data" jsonb,
	"prescription_verified" boolean DEFAULT false,
	"prescription_verified_at" timestamp,
	"prescription_verified_by" varchar(255),
	"ai_recommendations" jsonb,
	"ai_recommendation_used" boolean DEFAULT false,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax" numeric(10, 2) DEFAULT '0',
	"shipping" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'GBP' NOT NULL,
	"sync_status" "shopify_order_sync_status" DEFAULT 'pending' NOT NULL,
	"shopify_fulfillment_status" varchar(50),
	"shopify_financial_status" varchar(50),
	"synced_at" timestamp,
	"last_sync_attempt" timestamp,
	"sync_error" text,
	"sync_retry_count" integer DEFAULT 0,
	"fulfilled_at" timestamp,
	"tracking_number" varchar(255),
	"tracking_url" varchar(500),
	"notes" text,
	"shopify_created_at" timestamp,
	"shopify_updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shopify_orders_shopify_order_id_unique" UNIQUE("shopify_order_id")
);
--> statement-breakpoint
CREATE TABLE "shopify_products" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"shopify_store_id" varchar(255) NOT NULL,
	"shopify_product_id" varchar(255) NOT NULL,
	"shopify_variant_id" varchar(255),
	"product_title" varchar(255) NOT NULL,
	"product_type" varchar(100),
	"sku" varchar(100),
	"ils_product_id" varchar(255),
	"ils_product_type" varchar(50),
	"price" numeric(10, 2) NOT NULL,
	"compare_at_price" numeric(10, 2),
	"inventory_quantity" integer DEFAULT 0,
	"track_inventory" boolean DEFAULT false,
	"last_synced_at" timestamp,
	"sync_enabled" boolean DEFAULT true,
	"product_metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopify_stores" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"shopify_domain" varchar(255) NOT NULL,
	"shopify_store_id" varchar(255) NOT NULL,
	"store_name" varchar(255) NOT NULL,
	"store_email" varchar(255),
	"store_url" varchar(500) NOT NULL,
	"access_token" text NOT NULL,
	"api_key" varchar(255) NOT NULL,
	"api_secret_key" text NOT NULL,
	"webhook_secret" text,
	"enable_prescription_verification" boolean DEFAULT true,
	"enable_ai_recommendations" boolean DEFAULT true,
	"enable_auto_order_sync" boolean DEFAULT true,
	"require_prescription_upload" boolean DEFAULT false,
	"markup_percentage" numeric(5, 2) DEFAULT '0',
	"status" "shopify_store_status" DEFAULT 'active' NOT NULL,
	"installed_at" timestamp DEFAULT now() NOT NULL,
	"last_sync_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shopify_stores_shopify_domain_unique" UNIQUE("shopify_domain"),
	CONSTRAINT "shopify_stores_shopify_store_id_unique" UNIQUE("shopify_store_id")
);
--> statement-breakpoint
CREATE TABLE "shopify_webhooks" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"shopify_store_id" varchar(255),
	"webhook_topic" varchar(100) NOT NULL,
	"shopify_webhook_id" varchar(255),
	"payload" jsonb NOT NULL,
	"headers" jsonb,
	"processed" boolean DEFAULT false,
	"processed_at" timestamp,
	"processing_error" text,
	"processing_retry_count" integer DEFAULT 0,
	"signature_valid" boolean,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_determinants" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"category" "social_determinant_category" NOT NULL,
	"factor" text NOT NULL,
	"status" "social_determinant_status" DEFAULT 'identified' NOT NULL,
	"severity" "severity" NOT NULL,
	"description" text NOT NULL,
	"impact" text NOT NULL,
	"interventions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"identified_date" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_date" timestamp with time zone,
	"identified_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "star_ratings" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"contract_id" varchar(100) NOT NULL,
	"measurement_year" integer NOT NULL,
	"part_c_rating" numeric(2, 1) NOT NULL,
	"part_d_rating" numeric(2, 1) NOT NULL,
	"overall_rating" numeric(2, 1) NOT NULL,
	"measures" jsonb NOT NULL,
	"calculated_date" timestamp NOT NULL,
	"published" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transitions_of_care" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"transition_type" "transition_type" NOT NULL,
	"from_location" text NOT NULL,
	"to_location" text NOT NULL,
	"status" "transition_status" DEFAULT 'planned' NOT NULL,
	"discharge_date" timestamp with time zone,
	"admission_date" timestamp with time zone,
	"follow_up_required" boolean DEFAULT false NOT NULL,
	"follow_up_date" timestamp with time zone,
	"follow_up_completed" boolean DEFAULT false NOT NULL,
	"medications" jsonb NOT NULL,
	"care_instructions" jsonb NOT NULL,
	"risk_factors" jsonb NOT NULL,
	"responsible_provider" text,
	"coordinated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treatment_outcome_predictions" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"treatment" text NOT NULL,
	"condition" text NOT NULL,
	"predicted_outcomes" jsonb NOT NULL,
	"success_probability" integer NOT NULL,
	"alternative_treatments" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treatment_recommendations" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"condition" text NOT NULL,
	"diagnosis" text NOT NULL,
	"recommendations" jsonb NOT NULL,
	"guideline_references" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unsubscribes" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"recipient_id" text NOT NULL,
	"channel" "communication_channel" NOT NULL,
	"category" "message_category",
	"unsubscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"user_id" varchar,
	"event_type" varchar NOT NULL,
	"event_name" varchar NOT NULL,
	"properties" jsonb,
	"metadata" jsonb,
	"revenue_impact" numeric(12, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_dynamic_roles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"role_id" varchar NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" varchar
);
--> statement-breakpoint
CREATE TABLE "vital_signs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"patient_id" varchar,
	"practitioner_id" varchar,
	"vital_type" "vital_sign_type" NOT NULL,
	"value" varchar(100) NOT NULL,
	"unit" varchar(50) NOT NULL,
	"measurement_date" timestamp with time zone NOT NULL,
	"method" varchar(100),
	"position" varchar(50),
	"interpretation" varchar(50),
	"notes" text,
	"measured_by" varchar,
	"created_at" timestamp with time zone DEFAULT now(),
	"device_id" varchar(100),
	"device_type" varchar(100),
	"deleted_at" timestamp with time zone,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"subscription_id" varchar(255) NOT NULL,
	"event_id" varchar(255) NOT NULL,
	"status" varchar(20) NOT NULL,
	"response_code" integer,
	"error_message" text,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"next_retry_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "webhook_subscriptions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"url" varchar(500) NOT NULL,
	"events" text[] NOT NULL,
	"secret" varchar(100) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_instances" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"workflow_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"trigger_data" jsonb NOT NULL,
	"status" "workflow_instance_status" DEFAULT 'pending' NOT NULL,
	"current_action_index" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"error" text,
	"execution_log" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_run_counts" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"workflow_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"run_count" integer DEFAULT 0 NOT NULL,
	"last_run_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"trigger" "workflow_trigger" NOT NULL,
	"status" "workflow_status" DEFAULT 'active' NOT NULL,
	"conditions" jsonb,
	"actions" jsonb NOT NULL,
	"run_once" boolean DEFAULT false NOT NULL,
	"max_runs" integer,
	"total_runs" integer DEFAULT 0 NOT NULL,
	"total_completed" integer DEFAULT 0 NOT NULL,
	"total_failed" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "user_role" SET DATA TYPE "public"."role" USING "user_role"::text::"public"."role";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "od_sphere" SET DATA TYPE numeric(6, 3);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "od_cylinder" SET DATA TYPE numeric(6, 3);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "od_axis" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "od_add" SET DATA TYPE numeric(4, 2);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "os_sphere" SET DATA TYPE numeric(6, 3);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "os_cylinder" SET DATA TYPE numeric(6, 3);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "os_axis" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "os_add" SET DATA TYPE numeric(4, 2);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "pd" SET DATA TYPE numeric(4, 1);--> statement-breakpoint
ALTER TABLE "prescriptions" ALTER COLUMN "od_sphere" SET DATA TYPE numeric(6, 3);--> statement-breakpoint
ALTER TABLE "prescriptions" ALTER COLUMN "od_cylinder" SET DATA TYPE numeric(6, 3);--> statement-breakpoint
ALTER TABLE "prescriptions" ALTER COLUMN "od_axis" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "prescriptions" ALTER COLUMN "od_add" SET DATA TYPE numeric(4, 2);--> statement-breakpoint
ALTER TABLE "prescriptions" ALTER COLUMN "os_sphere" SET DATA TYPE numeric(6, 3);--> statement-breakpoint
ALTER TABLE "prescriptions" ALTER COLUMN "os_cylinder" SET DATA TYPE numeric(6, 3);--> statement-breakpoint
ALTER TABLE "prescriptions" ALTER COLUMN "os_axis" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "prescriptions" ALTER COLUMN "os_add" SET DATA TYPE numeric(4, 2);--> statement-breakpoint
ALTER TABLE "prescriptions" ALTER COLUMN "pd" SET DATA TYPE numeric(4, 1);--> statement-breakpoint
ALTER TABLE "role_permissions" ALTER COLUMN "role" SET DATA TYPE "public"."role" USING "role"::text::"public"."role";--> statement-breakpoint
ALTER TABLE "user_roles" ALTER COLUMN "role" SET DATA TYPE "public"."role" USING "role"::text::"public"."role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "enhanced_role" SET DATA TYPE "public"."role" USING "enhanced_role"::text::"public"."role";--> statement-breakpoint
ALTER TABLE "ai_knowledge_base" ADD COLUMN "embedding" vector(1536);--> statement-breakpoint
ALTER TABLE "ai_model_deployments" ADD COLUMN "environment" varchar(50);--> statement-breakpoint
ALTER TABLE "ai_model_deployments" ADD COLUMN "status" varchar(50) DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_model_versions" ADD COLUMN "company_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_model_versions" ADD COLUMN "model_type" varchar(100);--> statement-breakpoint
ALTER TABLE "ai_model_versions" ADD COLUMN "algorithm" varchar(100);--> statement-breakpoint
ALTER TABLE "ai_training_jobs" ADD COLUMN "company_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_training_jobs" ADD COLUMN "model_type" varchar(100);--> statement-breakpoint
ALTER TABLE "ai_training_jobs" ADD COLUMN "algorithm" varchar(100);--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "shopify_shop_name" varchar;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "shopify_webhook_secret" varchar;--> statement-breakpoint
ALTER TABLE "dispense_records" ADD COLUMN "external_id" varchar(255);--> statement-breakpoint
ALTER TABLE "dispense_records" ADD COLUMN "import_source" varchar(100);--> statement-breakpoint
ALTER TABLE "dispense_records" ADD COLUMN "import_job_id" varchar(255);--> statement-breakpoint
ALTER TABLE "dispense_records" ADD COLUMN "imported_at" timestamp;--> statement-breakpoint
ALTER TABLE "eye_examinations" ADD COLUMN "pre_screening" jsonb;--> statement-breakpoint
ALTER TABLE "eye_examinations" ADD COLUMN "retinoscopy" jsonb;--> statement-breakpoint
ALTER TABLE "eye_examinations" ADD COLUMN "section_notes" jsonb;--> statement-breakpoint
ALTER TABLE "eye_examinations" ADD COLUMN "grading_system" varchar(20);--> statement-breakpoint
ALTER TABLE "eye_examinations" ADD COLUMN "external_id" varchar(255);--> statement-breakpoint
ALTER TABLE "eye_examinations" ADD COLUMN "import_source" varchar(100);--> statement-breakpoint
ALTER TABLE "eye_examinations" ADD COLUMN "import_job_id" varchar(255);--> statement-breakpoint
ALTER TABLE "eye_examinations" ADD COLUMN "imported_at" timestamp;--> statement-breakpoint
ALTER TABLE "eye_examinations" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "eye_examinations" ADD COLUMN "deleted_by" varchar(255);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "deleted_by" varchar(255);--> statement-breakpoint
ALTER TABLE "master_training_datasets" ADD COLUMN "company_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "master_training_datasets" ADD COLUMN "dataset_type" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "pdf_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "pdf_error_message" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "analytics_error_message" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "external_id" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "import_source" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "import_job_id" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "imported_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "deleted_by" varchar(255);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "phone" varchar(50);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "mobile_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "work_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "address_line_1" varchar(255);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "address_line_2" varchar(255);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "county" varchar(100);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "postcode" varchar(20);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "country" varchar(100) DEFAULT 'United Kingdom';--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "timezone" varchar(100);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "timezone_offset" integer;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "locale" varchar(20) DEFAULT 'en-GB';--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "gp_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "emergency_contact_email" varchar(255);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "allergies" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "systemic_conditions" jsonb;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "hobbies" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "vdu_hours_per_day" numeric(4, 1);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "sport_activities" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "reading_habits" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "contact_lens_type" varchar(100);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "contact_lens_brand" varchar(100);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "contact_lens_compliance" varchar(50);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "preferred_appointment_time" varchar(50);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "reminder_preference" varchar(50);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "third_party_consent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "research_consent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "recall_schedule" varchar(50);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "insurance_provider" varchar(255);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "insurance_policy_number" varchar(100);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "nhs_exemption" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "nhs_exemption_type" varchar(100);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "status" varchar(50) DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "vip_patient" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "patient_notes" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "internal_notes" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "external_id" varchar(255);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "import_source" varchar(100);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "import_job_id" varchar(255);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "imported_at" timestamp;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "deleted_by" varchar(255);--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "external_id" varchar(255);--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "import_source" varchar(100);--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "import_job_id" varchar(255);--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "imported_at" timestamp;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "deleted_by" varchar(255);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "shopify_product_id" varchar;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "shopify_variant_id" varchar;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "shopify_inventory_item_id" varchar;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "last_shopify_sync" timestamp;--> statement-breakpoint
ALTER TABLE "test_room_bookings" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "test_room_bookings" ADD COLUMN "deleted_by" varchar(255);--> statement-breakpoint
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_purchase_order_items" ADD CONSTRAINT "ai_purchase_order_items_ai_po_id_ai_purchase_orders_id_fk" FOREIGN KEY ("ai_po_id") REFERENCES "public"."ai_purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_purchase_order_items" ADD CONSTRAINT "ai_purchase_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_purchase_orders" ADD CONSTRAINT "ai_purchase_orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_purchase_orders" ADD CONSTRAINT "ai_purchase_orders_supplier_id_users_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_purchase_orders" ADD CONSTRAINT "ai_purchase_orders_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_purchase_orders" ADD CONSTRAINT "ai_purchase_orders_converted_po_id_purchase_orders_id_fk" FOREIGN KEY ("converted_po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_practitioner_id_users_id_fk" FOREIGN KEY ("practitioner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_availability" ADD CONSTRAINT "appointment_availability_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_availability" ADD CONSTRAINT "appointment_availability_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_bookings" ADD CONSTRAINT "appointment_bookings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_bookings" ADD CONSTRAINT "appointment_bookings_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_bookings" ADD CONSTRAINT "appointment_bookings_appointment_type_id_appointment_types_id_fk" FOREIGN KEY ("appointment_type_id") REFERENCES "public"."appointment_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_reminders" ADD CONSTRAINT "appointment_reminders_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_resources" ADD CONSTRAINT "appointment_resources_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_types" ADD CONSTRAINT "appointment_types_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_waitlist" ADD CONSTRAINT "appointment_waitlist_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_waitlist" ADD CONSTRAINT "appointment_waitlist_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_waitlist" ADD CONSTRAINT "appointment_waitlist_fulfilled_appointment_id_appointments_id_fk" FOREIGN KEY ("fulfilled_appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_practitioner_id_users_id_fk" FOREIGN KEY ("practitioner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_rescheduled_from_appointments_id_fk" FOREIGN KEY ("rescheduled_from") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_rescheduled_to_appointments_id_fk" FOREIGN KEY ("rescheduled_to") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audience_segments" ADD CONSTRAINT "audience_segments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "best_practices" ADD CONSTRAINT "best_practices_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_codes" ADD CONSTRAINT "billing_codes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_compliance" ADD CONSTRAINT "bundle_compliance_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_compliance" ADD CONSTRAINT "bundle_compliance_bundle_id_care_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."care_bundles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_compliance" ADD CONSTRAINT "bundle_compliance_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_settings" ADD CONSTRAINT "calendar_settings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_settings" ADD CONSTRAINT "calendar_settings_practitioner_id_users_id_fk" FOREIGN KEY ("practitioner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_template_id_message_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."message_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_bundles" ADD CONSTRAINT "care_bundles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_coordination_tasks" ADD CONSTRAINT "care_coordination_tasks_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_coordination_tasks" ADD CONSTRAINT "care_coordination_tasks_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_coordination_tasks" ADD CONSTRAINT "care_coordination_tasks_care_plan_id_care_plans_id_fk" FOREIGN KEY ("care_plan_id") REFERENCES "public"."care_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_coordination_tasks" ADD CONSTRAINT "care_coordination_tasks_transition_id_transitions_of_care_id_fk" FOREIGN KEY ("transition_id") REFERENCES "public"."transitions_of_care"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_coordination_tasks" ADD CONSTRAINT "care_coordination_tasks_gap_id_care_gaps_id_fk" FOREIGN KEY ("gap_id") REFERENCES "public"."care_gaps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_gaps" ADD CONSTRAINT "care_gaps_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_gaps" ADD CONSTRAINT "care_gaps_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_plans" ADD CONSTRAINT "care_plans_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_plans" ADD CONSTRAINT "care_plans_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_teams" ADD CONSTRAINT "care_teams_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_teams" ADD CONSTRAINT "care_teams_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "churn_predictions" ADD CONSTRAINT "churn_predictions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_appeals" ADD CONSTRAINT "claim_appeals_claim_id_insurance_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."insurance_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_batches" ADD CONSTRAINT "claim_batches_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_batches" ADD CONSTRAINT "claim_batches_payer_id_insurance_payers_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."insurance_payers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_eras" ADD CONSTRAINT "claim_eras_payer_id_insurance_payers_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."insurance_payers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_line_items" ADD CONSTRAINT "claim_line_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_line_items" ADD CONSTRAINT "claim_line_items_claim_id_insurance_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."insurance_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_alerts" ADD CONSTRAINT "clinical_alerts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_alerts" ADD CONSTRAINT "clinical_alerts_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_guidelines" ADD CONSTRAINT "clinical_guidelines_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_metrics" ADD CONSTRAINT "clinical_metrics_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_metrics" ADD CONSTRAINT "clinical_metrics_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_metrics" ADD CONSTRAINT "clinical_metrics_registry_id_disease_registries_id_fk" FOREIGN KEY ("registry_id") REFERENCES "public"."disease_registries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_metrics" ADD CONSTRAINT "clinical_metrics_program_id_disease_management_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."disease_management_programs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_practitioner_id_users_id_fk" FOREIGN KEY ("practitioner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_signed_by_users_id_fk" FOREIGN KEY ("signed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_relationships" ADD CONSTRAINT "company_relationships_company_a_id_companies_id_fk" FOREIGN KEY ("company_a_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_relationships" ADD CONSTRAINT "company_relationships_company_b_id_companies_id_fk" FOREIGN KEY ("company_b_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_relationships" ADD CONSTRAINT "company_relationships_initiated_by_company_id_companies_id_fk" FOREIGN KEY ("initiated_by_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_relationships" ADD CONSTRAINT "company_relationships_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection_requests" ADD CONSTRAINT "connection_requests_from_company_id_companies_id_fk" FOREIGN KEY ("from_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection_requests" ADD CONSTRAINT "connection_requests_to_company_id_companies_id_fk" FOREIGN KEY ("to_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection_requests" ADD CONSTRAINT "connection_requests_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection_requests" ADD CONSTRAINT "connection_requests_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lens_aftercare" ADD CONSTRAINT "contact_lens_aftercare_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lens_aftercare" ADD CONSTRAINT "contact_lens_aftercare_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lens_aftercare" ADD CONSTRAINT "contact_lens_aftercare_prescription_id_contact_lens_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."contact_lens_prescriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lens_aftercare" ADD CONSTRAINT "contact_lens_aftercare_practitioner_id_users_id_fk" FOREIGN KEY ("practitioner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lens_assessments" ADD CONSTRAINT "contact_lens_assessments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lens_assessments" ADD CONSTRAINT "contact_lens_assessments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lens_assessments" ADD CONSTRAINT "contact_lens_assessments_practitioner_id_users_id_fk" FOREIGN KEY ("practitioner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lens_fittings" ADD CONSTRAINT "contact_lens_fittings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lens_fittings" ADD CONSTRAINT "contact_lens_fittings_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lens_fittings" ADD CONSTRAINT "contact_lens_fittings_assessment_id_contact_lens_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."contact_lens_assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lens_fittings" ADD CONSTRAINT "contact_lens_fittings_practitioner_id_users_id_fk" FOREIGN KEY ("practitioner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lens_inventory" ADD CONSTRAINT "contact_lens_inventory_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lens_orders" ADD CONSTRAINT "contact_lens_orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lens_orders" ADD CONSTRAINT "contact_lens_orders_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lens_orders" ADD CONSTRAINT "contact_lens_orders_prescription_id_contact_lens_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."contact_lens_prescriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lens_orders" ADD CONSTRAINT "contact_lens_orders_od_inventory_id_contact_lens_inventory_id_fk" FOREIGN KEY ("od_inventory_id") REFERENCES "public"."contact_lens_inventory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lens_orders" ADD CONSTRAINT "contact_lens_orders_os_inventory_id_contact_lens_inventory_id_fk" FOREIGN KEY ("os_inventory_id") REFERENCES "public"."contact_lens_inventory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lens_prescriptions" ADD CONSTRAINT "contact_lens_prescriptions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lens_prescriptions" ADD CONSTRAINT "contact_lens_prescriptions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lens_prescriptions" ADD CONSTRAINT "contact_lens_prescriptions_fitting_id_contact_lens_fittings_id_fk" FOREIGN KEY ("fitting_id") REFERENCES "public"."contact_lens_fittings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lens_prescriptions" ADD CONSTRAINT "contact_lens_prescriptions_practitioner_id_users_id_fk" FOREIGN KEY ("practitioner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_lens_prescriptions" ADD CONSTRAINT "contact_lens_prescriptions_nhs_exemption_id_nhs_patient_exemptions_id_fk" FOREIGN KEY ("nhs_exemption_id") REFERENCES "public"."nhs_patient_exemptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_acquisition_sources" ADD CONSTRAINT "customer_acquisition_sources_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_cohorts" ADD CONSTRAINT "customer_cohorts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_health_scores" ADD CONSTRAINT "customer_health_scores_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_forecasts" ADD CONSTRAINT "demand_forecasts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_forecasts" ADD CONSTRAINT "demand_forecasts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_suggestions" ADD CONSTRAINT "diagnostic_suggestions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_suggestions" ADD CONSTRAINT "diagnostic_suggestions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disease_management_programs" ADD CONSTRAINT "disease_management_programs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disease_progression_predictions" ADD CONSTRAINT "disease_progression_predictions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disease_progression_predictions" ADD CONSTRAINT "disease_progression_predictions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disease_registries" ADD CONSTRAINT "disease_registries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drug_interactions" ADD CONSTRAINT "drug_interactions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drug_interactions" ADD CONSTRAINT "drug_interactions_drug1_id_drugs_id_fk" FOREIGN KEY ("drug1_id") REFERENCES "public"."drugs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drug_interactions" ADD CONSTRAINT "drug_interactions_drug2_id_drugs_id_fk" FOREIGN KEY ("drug2_id") REFERENCES "public"."drugs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drugs" ADD CONSTRAINT "drugs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynamic_role_permissions" ADD CONSTRAINT "dynamic_role_permissions_role_id_dynamic_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."dynamic_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynamic_role_permissions" ADD CONSTRAINT "dynamic_role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynamic_role_permissions" ADD CONSTRAINT "dynamic_role_permissions_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynamic_roles" ADD CONSTRAINT "dynamic_roles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynamic_roles" ADD CONSTRAINT "dynamic_roles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligibility_verifications" ADD CONSTRAINT "eligibility_verifications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligibility_verifications" ADD CONSTRAINT "eligibility_verifications_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligibility_verifications" ADD CONSTRAINT "eligibility_verifications_insurance_plan_id_insurance_plans_id_fk" FOREIGN KEY ("insurance_plan_id") REFERENCES "public"."insurance_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligibility_verifications" ADD CONSTRAINT "eligibility_verifications_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_log" ADD CONSTRAINT "event_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_log" ADD CONSTRAINT "event_log_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_usage_metrics" ADD CONSTRAINT "feature_usage_metrics_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_accuracy_metrics" ADD CONSTRAINT "forecast_accuracy_metrics_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_accuracy_metrics" ADD CONSTRAINT "forecast_accuracy_metrics_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frame_characteristics" ADD CONSTRAINT "frame_characteristics_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frame_characteristics" ADD CONSTRAINT "frame_characteristics_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frame_recommendation_analytics" ADD CONSTRAINT "frame_recommendation_analytics_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frame_recommendation_analytics" ADD CONSTRAINT "frame_recommendation_analytics_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frame_recommendations" ADD CONSTRAINT "frame_recommendations_face_analysis_id_patient_face_analysis_id_fk" FOREIGN KEY ("face_analysis_id") REFERENCES "public"."patient_face_analysis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frame_recommendations" ADD CONSTRAINT "frame_recommendations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frame_recommendations" ADD CONSTRAINT "frame_recommendations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frame_recommendations" ADD CONSTRAINT "frame_recommendations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_risk_assessments" ADD CONSTRAINT "health_risk_assessments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_risk_assessments" ADD CONSTRAINT "health_risk_assessments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immunizations" ADD CONSTRAINT "immunizations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immunizations" ADD CONSTRAINT "immunizations_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immunizations" ADD CONSTRAINT "immunizations_practitioner_id_users_id_fk" FOREIGN KEY ("practitioner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immunizations" ADD CONSTRAINT "immunizations_administered_by_users_id_fk" FOREIGN KEY ("administered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_payer_id_insurance_payers_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."insurance_payers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_companies" ADD CONSTRAINT "insurance_companies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_payers" ADD CONSTRAINT "insurance_payers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_plans" ADD CONSTRAINT "insurance_plans_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_plans" ADD CONSTRAINT "insurance_plans_insurance_company_id_insurance_companies_id_fk" FOREIGN KEY ("insurance_company_id") REFERENCES "public"."insurance_companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_practitioner_id_users_id_fk" FOREIGN KEY ("practitioner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_quality_control" ADD CONSTRAINT "lab_quality_control_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_quality_control" ADD CONSTRAINT "lab_quality_control_technician_id_users_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_practitioner_id_users_id_fk" FOREIGN KEY ("practitioner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_test_catalog" ADD CONSTRAINT "lab_test_catalog_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measure_calculations" ADD CONSTRAINT "measure_calculations_measure_id_quality_measures_id_fk" FOREIGN KEY ("measure_id") REFERENCES "public"."quality_measures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_claims" ADD CONSTRAINT "medical_claims_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_claims" ADD CONSTRAINT "medical_claims_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_claims" ADD CONSTRAINT "medical_claims_insurance_plan_id_insurance_plans_id_fk" FOREIGN KEY ("insurance_plan_id") REFERENCES "public"."insurance_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_claims" ADD CONSTRAINT "medical_claims_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medications" ADD CONSTRAINT "medications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medications" ADD CONSTRAINT "medications_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medications" ADD CONSTRAINT "medications_practitioner_id_users_id_fk" FOREIGN KEY ("practitioner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medications" ADD CONSTRAINT "medications_prescribed_by_users_id_fk" FOREIGN KEY ("prescribed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_template_id_message_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."message_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_models" ADD CONSTRAINT "ml_models_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_recurring_revenue" ADD CONSTRAINT "monthly_recurring_revenue_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhs_claims" ADD CONSTRAINT "nhs_claims_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhs_claims" ADD CONSTRAINT "nhs_claims_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhs_claims" ADD CONSTRAINT "nhs_claims_examination_id_eye_examinations_id_fk" FOREIGN KEY ("examination_id") REFERENCES "public"."eye_examinations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhs_claims" ADD CONSTRAINT "nhs_claims_practitioner_id_nhs_practitioners_id_fk" FOREIGN KEY ("practitioner_id") REFERENCES "public"."nhs_practitioners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhs_claims" ADD CONSTRAINT "nhs_claims_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhs_contract_details" ADD CONSTRAINT "nhs_contract_details_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhs_patient_exemptions" ADD CONSTRAINT "nhs_patient_exemptions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhs_patient_exemptions" ADD CONSTRAINT "nhs_patient_exemptions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhs_patient_exemptions" ADD CONSTRAINT "nhs_patient_exemptions_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhs_payments" ADD CONSTRAINT "nhs_payments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhs_payments" ADD CONSTRAINT "nhs_payments_reconciled_by_users_id_fk" FOREIGN KEY ("reconciled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhs_practitioners" ADD CONSTRAINT "nhs_practitioners_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhs_practitioners" ADD CONSTRAINT "nhs_practitioners_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhs_vouchers" ADD CONSTRAINT "nhs_vouchers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhs_vouchers" ADD CONSTRAINT "nhs_vouchers_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhs_vouchers" ADD CONSTRAINT "nhs_vouchers_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhs_vouchers" ADD CONSTRAINT "nhs_vouchers_claim_id_nhs_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."nhs_claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "no_show_predictions" ADD CONSTRAINT "no_show_predictions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "no_show_predictions" ADD CONSTRAINT "no_show_predictions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nps_surveys" ADD CONSTRAINT "nps_surveys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcome_tracking" ADD CONSTRAINT "outcome_tracking_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcome_tracking" ADD CONSTRAINT "outcome_tracking_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcome_tracking" ADD CONSTRAINT "outcome_tracking_program_id_disease_management_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."disease_management_programs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcome_tracking" ADD CONSTRAINT "outcome_tracking_registry_id_disease_registries_id_fk" FOREIGN KEY ("registry_id") REFERENCES "public"."disease_registries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_activity_log" ADD CONSTRAINT "patient_activity_log_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_activity_log" ADD CONSTRAINT "patient_activity_log_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_activity_log" ADD CONSTRAINT "patient_activity_log_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_activity_log" ADD CONSTRAINT "patient_activity_log_examination_id_eye_examinations_id_fk" FOREIGN KEY ("examination_id") REFERENCES "public"."eye_examinations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_activity_log" ADD CONSTRAINT "patient_activity_log_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_documents" ADD CONSTRAINT "patient_documents_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_documents" ADD CONSTRAINT "patient_documents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_documents" ADD CONSTRAINT "patient_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_engagement" ADD CONSTRAINT "patient_engagement_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_engagement" ADD CONSTRAINT "patient_engagement_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_engagement" ADD CONSTRAINT "patient_engagement_program_id_disease_management_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."disease_management_programs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_face_analysis" ADD CONSTRAINT "patient_face_analysis_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_face_analysis" ADD CONSTRAINT "patient_face_analysis_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_health_metrics" ADD CONSTRAINT "patient_health_metrics_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_health_metrics" ADD CONSTRAINT "patient_health_metrics_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_insurance" ADD CONSTRAINT "patient_insurance_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_insurance" ADD CONSTRAINT "patient_insurance_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_insurance" ADD CONSTRAINT "patient_insurance_insurance_plan_id_insurance_plans_id_fk" FOREIGN KEY ("insurance_plan_id") REFERENCES "public"."insurance_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_outreach" ADD CONSTRAINT "patient_outreach_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_outreach" ADD CONSTRAINT "patient_outreach_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_outreach" ADD CONSTRAINT "patient_outreach_task_id_care_coordination_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."care_coordination_tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_portal_access_logs" ADD CONSTRAINT "patient_portal_access_logs_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_portal_access_logs" ADD CONSTRAINT "patient_portal_access_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_portal_settings" ADD CONSTRAINT "patient_portal_settings_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_claim_id_medical_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."medical_claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdsa_cycles" ADD CONSTRAINT "pdsa_cycles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdsa_cycles" ADD CONSTRAINT "pdsa_cycles_project_id_quality_improvement_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."quality_improvement_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_improvements" ADD CONSTRAINT "performance_improvements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_conversations" ADD CONSTRAINT "portal_conversations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_conversations" ADD CONSTRAINT "portal_conversations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_messages" ADD CONSTRAINT "portal_messages_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_messages" ADD CONSTRAINT "portal_messages_conversation_id_portal_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."portal_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_payments" ADD CONSTRAINT "portal_payments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_payments" ADD CONSTRAINT "portal_payments_bill_id_invoices_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."invoices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_payments" ADD CONSTRAINT "portal_payments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preauthorizations" ADD CONSTRAINT "preauthorizations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preauthorizations" ADD CONSTRAINT "preauthorizations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preauthorizations" ADD CONSTRAINT "preauthorizations_insurance_plan_id_insurance_plans_id_fk" FOREIGN KEY ("insurance_plan_id") REFERENCES "public"."insurance_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preauthorizations" ADD CONSTRAINT "preauthorizations_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictive_analyses" ADD CONSTRAINT "predictive_analyses_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictive_analyses" ADD CONSTRAINT "predictive_analyses_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictive_analyses" ADD CONSTRAINT "predictive_analyses_model_id_predictive_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."predictive_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictive_models" ADD CONSTRAINT "predictive_models_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_uploads" ADD CONSTRAINT "prescription_uploads_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_uploads" ADD CONSTRAINT "prescription_uploads_shopify_order_id_shopify_orders_id_fk" FOREIGN KEY ("shopify_order_id") REFERENCES "public"."shopify_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_uploads" ADD CONSTRAINT "prescription_uploads_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preventive_care_recommendations" ADD CONSTRAINT "preventive_care_recommendations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preventive_care_recommendations" ADD CONSTRAINT "preventive_care_recommendations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_program_id_disease_management_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."disease_management_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_availability" ADD CONSTRAINT "provider_availability_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_dashboards" ADD CONSTRAINT "quality_dashboards_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_gap_analyses" ADD CONSTRAINT "quality_gap_analyses_measure_id_quality_measures_id_fk" FOREIGN KEY ("measure_id") REFERENCES "public"."quality_measures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_improvement_projects" ADD CONSTRAINT "quality_improvement_projects_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_measures" ADD CONSTRAINT "quality_measures_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readmission_predictions" ADD CONSTRAINT "readmission_predictions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readmission_predictions" ADD CONSTRAINT "readmission_predictions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registry_enrollments" ADD CONSTRAINT "registry_enrollments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registry_enrollments" ADD CONSTRAINT "registry_enrollments_registry_id_disease_registries_id_fk" FOREIGN KEY ("registry_id") REFERENCES "public"."disease_registries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registry_enrollments" ADD CONSTRAINT "registry_enrollments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_scores" ADD CONSTRAINT "risk_scores_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_scores" ADD CONSTRAINT "risk_scores_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_stratification_cohorts" ADD CONSTRAINT "risk_stratification_cohorts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_stratifications" ADD CONSTRAINT "risk_stratifications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_stratifications" ADD CONSTRAINT "risk_stratifications_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_change_audit" ADD CONSTRAINT "role_change_audit_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_change_audit" ADD CONSTRAINT "role_change_audit_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_change_audit" ADD CONSTRAINT "role_change_audit_role_id_dynamic_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."dynamic_roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_change_audit" ADD CONSTRAINT "role_change_audit_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seasonal_patterns" ADD CONSTRAINT "seasonal_patterns_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seasonal_patterns" ADD CONSTRAINT "seasonal_patterns_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopify_orders" ADD CONSTRAINT "shopify_orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopify_orders" ADD CONSTRAINT "shopify_orders_shopify_store_id_shopify_stores_id_fk" FOREIGN KEY ("shopify_store_id") REFERENCES "public"."shopify_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopify_orders" ADD CONSTRAINT "shopify_orders_ils_order_id_orders_id_fk" FOREIGN KEY ("ils_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopify_orders" ADD CONSTRAINT "shopify_orders_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopify_orders" ADD CONSTRAINT "shopify_orders_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopify_products" ADD CONSTRAINT "shopify_products_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopify_products" ADD CONSTRAINT "shopify_products_shopify_store_id_shopify_stores_id_fk" FOREIGN KEY ("shopify_store_id") REFERENCES "public"."shopify_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopify_stores" ADD CONSTRAINT "shopify_stores_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopify_webhooks" ADD CONSTRAINT "shopify_webhooks_shopify_store_id_shopify_stores_id_fk" FOREIGN KEY ("shopify_store_id") REFERENCES "public"."shopify_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_determinants" ADD CONSTRAINT "social_determinants_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_determinants" ADD CONSTRAINT "social_determinants_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "star_ratings" ADD CONSTRAINT "star_ratings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transitions_of_care" ADD CONSTRAINT "transitions_of_care_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transitions_of_care" ADD CONSTRAINT "transitions_of_care_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_outcome_predictions" ADD CONSTRAINT "treatment_outcome_predictions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_outcome_predictions" ADD CONSTRAINT "treatment_outcome_predictions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_recommendations" ADD CONSTRAINT "treatment_recommendations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_recommendations" ADD CONSTRAINT "treatment_recommendations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unsubscribes" ADD CONSTRAINT "unsubscribes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_dynamic_roles" ADD CONSTRAINT "user_dynamic_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_dynamic_roles" ADD CONSTRAINT "user_dynamic_roles_role_id_dynamic_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."dynamic_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_dynamic_roles" ADD CONSTRAINT "user_dynamic_roles_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vital_signs" ADD CONSTRAINT "vital_signs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vital_signs" ADD CONSTRAINT "vital_signs_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vital_signs" ADD CONSTRAINT "vital_signs_practitioner_id_users_id_fk" FOREIGN KEY ("practitioner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vital_signs" ADD CONSTRAINT "vital_signs_measured_by_users_id_fk" FOREIGN KEY ("measured_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vital_signs" ADD CONSTRAINT "vital_signs_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_subscription_id_webhook_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."webhook_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_event_id_event_log_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event_log"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_subscriptions" ADD CONSTRAINT "webhook_subscriptions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_run_counts" ADD CONSTRAINT "workflow_run_counts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_run_counts" ADD CONSTRAINT "workflow_run_counts_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_run_counts" ADD CONSTRAINT "workflow_run_counts_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_aggregated_metrics_type" ON "aggregated_metrics" USING btree ("metric_type");--> statement-breakpoint
CREATE INDEX "idx_aggregated_metrics_category" ON "aggregated_metrics" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_aggregated_metrics_period" ON "aggregated_metrics" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_aggregated_metrics_dimensions" ON "aggregated_metrics" USING btree ("company_type","region","product_type");--> statement-breakpoint
CREATE INDEX "idx_aggregated_metrics_refresh" ON "aggregated_metrics" USING btree ("refresh_status","next_refresh_at");--> statement-breakpoint
CREATE INDEX "idx_ai_po_items_po" ON "ai_purchase_order_items" USING btree ("ai_po_id");--> statement-breakpoint
CREATE INDEX "idx_ai_po_items_product" ON "ai_purchase_order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_ai_po_company_status" ON "ai_purchase_orders" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "idx_ai_po_generated_at" ON "ai_purchase_orders" USING btree ("generated_at");--> statement-breakpoint
CREATE INDEX "idx_ai_po_supplier" ON "ai_purchase_orders" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_allergies_company" ON "allergies" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_allergies_patient" ON "allergies" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_allergies_severity" ON "allergies" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_allergies_status" ON "allergies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_allergies_allergen" ON "allergies" USING btree ("allergen");--> statement-breakpoint
CREATE INDEX "idx_appointment_availability_company" ON "appointment_availability" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_appointment_availability_resource" ON "appointment_availability" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "idx_appointment_availability_type" ON "appointment_availability" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "idx_appointment_availability_day" ON "appointment_availability" USING btree ("day_of_week");--> statement-breakpoint
CREATE INDEX "idx_appointment_availability_time" ON "appointment_availability" USING btree ("start_time","end_time");--> statement-breakpoint
CREATE INDEX "appointment_bookings_company_idx" ON "appointment_bookings" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "appointment_bookings_patient_idx" ON "appointment_bookings" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "appointment_bookings_provider_idx" ON "appointment_bookings" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "appointment_bookings_date_idx" ON "appointment_bookings" USING btree ("date");--> statement-breakpoint
CREATE INDEX "appointment_bookings_status_idx" ON "appointment_bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "appointment_bookings_confirmation_code_idx" ON "appointment_bookings" USING btree ("confirmation_code");--> statement-breakpoint
CREATE INDEX "appointment_bookings_created_at_idx" ON "appointment_bookings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_appointment_reminders_appointment" ON "appointment_reminders" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "idx_appointment_reminders_status" ON "appointment_reminders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_appointment_reminders_scheduled" ON "appointment_reminders" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "idx_appointment_reminders_type" ON "appointment_reminders" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_appointment_resources_appointment" ON "appointment_resources" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "idx_appointment_resources_resource" ON "appointment_resources" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "idx_appointment_resources_type" ON "appointment_resources" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "idx_appointment_resources_time" ON "appointment_resources" USING btree ("start_time","end_time");--> statement-breakpoint
CREATE INDEX "appointment_types_company_idx" ON "appointment_types" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "appointment_types_name_idx" ON "appointment_types" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_appointment_waitlist_company" ON "appointment_waitlist" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_appointment_waitlist_patient" ON "appointment_waitlist" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_appointment_waitlist_status" ON "appointment_waitlist" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_appointment_waitlist_priority" ON "appointment_waitlist" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_appointment_waitlist_created" ON "appointment_waitlist" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_appointments_company" ON "appointments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_appointments_patient" ON "appointments" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_appointments_practitioner" ON "appointments" USING btree ("practitioner_id");--> statement-breakpoint
CREATE INDEX "idx_appointments_start_time" ON "appointments" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "idx_appointments_status" ON "appointments" USING btree ("appointment_status");--> statement-breakpoint
CREATE INDEX "idx_appointments_type" ON "appointments" USING btree ("appointment_type");--> statement-breakpoint
CREATE INDEX "idx_appointments_created_at" ON "appointments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audience_segments_company_idx" ON "audience_segments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "audience_segments_name_idx" ON "audience_segments" USING btree ("name");--> statement-breakpoint
CREATE INDEX "best_practices_company_idx" ON "best_practices" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "best_practices_practice_id_idx" ON "best_practices" USING btree ("practice_id");--> statement-breakpoint
CREATE INDEX "best_practices_category_idx" ON "best_practices" USING btree ("category");--> statement-breakpoint
CREATE INDEX "best_practices_clinical_area_idx" ON "best_practices" USING btree ("clinical_area");--> statement-breakpoint
CREATE INDEX "best_practices_adoption_status_idx" ON "best_practices" USING btree ("adoption_status");--> statement-breakpoint
CREATE INDEX "best_practices_active_idx" ON "best_practices" USING btree ("active");--> statement-breakpoint
CREATE INDEX "bundle_compliance_company_idx" ON "bundle_compliance" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "bundle_compliance_bundle_idx" ON "bundle_compliance" USING btree ("bundle_id");--> statement-breakpoint
CREATE INDEX "bundle_compliance_patient_idx" ON "bundle_compliance" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "bundle_compliance_encounter_idx" ON "bundle_compliance" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX "bundle_compliance_assessment_date_idx" ON "bundle_compliance" USING btree ("assessment_date");--> statement-breakpoint
CREATE INDEX "idx_calendar_settings_company" ON "calendar_settings" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_calendar_settings_practitioner" ON "calendar_settings" USING btree ("practitioner_id");--> statement-breakpoint
CREATE INDEX "campaign_recipients_campaign_idx" ON "campaign_recipients" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_recipients_recipient_idx" ON "campaign_recipients" USING btree ("recipient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_recipient_unique" ON "campaign_recipients" USING btree ("campaign_id","recipient_id");--> statement-breakpoint
CREATE INDEX "campaigns_company_idx" ON "campaigns" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "campaigns_status_idx" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campaigns_type_idx" ON "campaigns" USING btree ("type");--> statement-breakpoint
CREATE INDEX "campaigns_channel_idx" ON "campaigns" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "campaigns_start_date_idx" ON "campaigns" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "care_bundles_company_idx" ON "care_bundles" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "care_bundles_bundle_id_idx" ON "care_bundles" USING btree ("bundle_id");--> statement-breakpoint
CREATE INDEX "care_bundles_category_idx" ON "care_bundles" USING btree ("category");--> statement-breakpoint
CREATE INDEX "care_bundles_active_idx" ON "care_bundles" USING btree ("active");--> statement-breakpoint
CREATE INDEX "coordination_tasks_company_idx" ON "care_coordination_tasks" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "coordination_tasks_patient_idx" ON "care_coordination_tasks" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "coordination_tasks_care_plan_idx" ON "care_coordination_tasks" USING btree ("care_plan_id");--> statement-breakpoint
CREATE INDEX "coordination_tasks_status_idx" ON "care_coordination_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "coordination_tasks_priority_idx" ON "care_coordination_tasks" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "coordination_tasks_due_date_idx" ON "care_coordination_tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "coordination_tasks_assigned_to_idx" ON "care_coordination_tasks" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "care_gaps_company_idx" ON "care_gaps" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "care_gaps_patient_idx" ON "care_gaps" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "care_gaps_category_idx" ON "care_gaps" USING btree ("category");--> statement-breakpoint
CREATE INDEX "care_gaps_severity_idx" ON "care_gaps" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "care_gaps_status_idx" ON "care_gaps" USING btree ("status");--> statement-breakpoint
CREATE INDEX "care_gaps_due_date_idx" ON "care_gaps" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "care_plans_company_idx" ON "care_plans" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "care_plans_patient_idx" ON "care_plans" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "care_plans_status_idx" ON "care_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "care_plans_category_idx" ON "care_plans" USING btree ("category");--> statement-breakpoint
CREATE INDEX "care_plans_next_review_idx" ON "care_plans" USING btree ("next_review_date");--> statement-breakpoint
CREATE INDEX "care_teams_company_idx" ON "care_teams" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "care_teams_patient_idx" ON "care_teams" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "care_teams_status_idx" ON "care_teams" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_churn_predictions_company" ON "churn_predictions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_churn_predictions_probability" ON "churn_predictions" USING btree ("churn_probability");--> statement-breakpoint
CREATE INDEX "idx_churn_predictions_risk" ON "churn_predictions" USING btree ("predicted_churn_date");--> statement-breakpoint
CREATE INDEX "claim_appeals_claim_idx" ON "claim_appeals" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "claim_appeals_status_idx" ON "claim_appeals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "claim_appeals_date_idx" ON "claim_appeals" USING btree ("appeal_date");--> statement-breakpoint
CREATE INDEX "claim_batches_company_idx" ON "claim_batches" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "claim_batches_payer_idx" ON "claim_batches" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "claim_batches_status_idx" ON "claim_batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "claim_batches_submitted_idx" ON "claim_batches" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "claim_eras_payer_idx" ON "claim_eras" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "claim_eras_payment_date_idx" ON "claim_eras" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "claim_eras_received_idx" ON "claim_eras" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "claim_line_items_claim_idx" ON "claim_line_items" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "claim_line_items_service_date_idx" ON "claim_line_items" USING btree ("service_date");--> statement-breakpoint
CREATE INDEX "clinical_alerts_company_idx" ON "clinical_alerts" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "clinical_alerts_patient_idx" ON "clinical_alerts" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "clinical_alerts_type_idx" ON "clinical_alerts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "clinical_alerts_severity_idx" ON "clinical_alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "clinical_alerts_created_at_idx" ON "clinical_alerts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "clinical_guidelines_company_idx" ON "clinical_guidelines" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "clinical_guidelines_condition_idx" ON "clinical_guidelines" USING btree ("condition");--> statement-breakpoint
CREATE INDEX "clinical_guidelines_organization_idx" ON "clinical_guidelines" USING btree ("organization");--> statement-breakpoint
CREATE INDEX "clinical_metrics_company_idx" ON "clinical_metrics" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "clinical_metrics_patient_idx" ON "clinical_metrics" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "clinical_metrics_registry_idx" ON "clinical_metrics" USING btree ("registry_id");--> statement-breakpoint
CREATE INDEX "clinical_metrics_program_idx" ON "clinical_metrics" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "clinical_metrics_metric_type_idx" ON "clinical_metrics" USING btree ("metric_type");--> statement-breakpoint
CREATE INDEX "clinical_metrics_measurement_date_idx" ON "clinical_metrics" USING btree ("measurement_date");--> statement-breakpoint
CREATE INDEX "idx_clinical_notes_company" ON "clinical_notes" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_clinical_notes_patient" ON "clinical_notes" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_clinical_notes_practitioner" ON "clinical_notes" USING btree ("practitioner_id");--> statement-breakpoint
CREATE INDEX "idx_clinical_notes_type" ON "clinical_notes" USING btree ("note_type");--> statement-breakpoint
CREATE INDEX "idx_clinical_notes_date" ON "clinical_notes" USING btree ("note_date");--> statement-breakpoint
CREATE INDEX "idx_clinical_notes_status" ON "clinical_notes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_clinical_notes_appointment" ON "clinical_notes" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "idx_company_profiles_visible" ON "company_profiles" USING btree ("is_marketplace_visible");--> statement-breakpoint
CREATE INDEX "idx_company_profiles_slug" ON "company_profiles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_company_profiles_service_area" ON "company_profiles" USING btree ("service_area");--> statement-breakpoint
CREATE INDEX "idx_company_relationships_a" ON "company_relationships" USING btree ("company_a_id");--> statement-breakpoint
CREATE INDEX "idx_company_relationships_b" ON "company_relationships" USING btree ("company_b_id");--> statement-breakpoint
CREATE INDEX "idx_company_relationships_status" ON "company_relationships" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_company_relationships_type" ON "company_relationships" USING btree ("relationship_type");--> statement-breakpoint
CREATE INDEX "idx_connection_requests_from" ON "connection_requests" USING btree ("from_company_id");--> statement-breakpoint
CREATE INDEX "idx_connection_requests_to" ON "connection_requests" USING btree ("to_company_id");--> statement-breakpoint
CREATE INDEX "idx_connection_requests_status" ON "connection_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cl_aftercare_company_idx" ON "contact_lens_aftercare" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "cl_aftercare_patient_idx" ON "contact_lens_aftercare" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "cl_aftercare_date_idx" ON "contact_lens_aftercare" USING btree ("appointment_date");--> statement-breakpoint
CREATE INDEX "cl_aftercare_status_idx" ON "contact_lens_aftercare" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cl_assessments_company_idx" ON "contact_lens_assessments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "cl_assessments_patient_idx" ON "contact_lens_assessments" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "cl_assessments_date_idx" ON "contact_lens_assessments" USING btree ("assessment_date");--> statement-breakpoint
CREATE INDEX "cl_fittings_company_idx" ON "contact_lens_fittings" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "cl_fittings_patient_idx" ON "contact_lens_fittings" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "cl_fittings_date_idx" ON "contact_lens_fittings" USING btree ("fitting_date");--> statement-breakpoint
CREATE INDEX "cl_inventory_company_idx" ON "contact_lens_inventory" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "cl_inventory_brand_idx" ON "contact_lens_inventory" USING btree ("brand");--> statement-breakpoint
CREATE INDEX "cl_inventory_stock_idx" ON "contact_lens_inventory" USING btree ("quantity_in_stock");--> statement-breakpoint
CREATE INDEX "cl_inventory_active_idx" ON "contact_lens_inventory" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "cl_inventory_unique" ON "contact_lens_inventory" USING btree ("company_id","brand","base_curve","diameter","power","cylinder","axis","addition");--> statement-breakpoint
CREATE INDEX "cl_orders_company_idx" ON "contact_lens_orders" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "cl_orders_patient_idx" ON "contact_lens_orders" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "cl_orders_date_idx" ON "contact_lens_orders" USING btree ("order_date");--> statement-breakpoint
CREATE INDEX "cl_orders_status_idx" ON "contact_lens_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cl_prescriptions_company_idx" ON "contact_lens_prescriptions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "cl_prescriptions_patient_idx" ON "contact_lens_prescriptions" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "cl_prescriptions_date_idx" ON "contact_lens_prescriptions" USING btree ("prescription_date");--> statement-breakpoint
CREATE INDEX "cl_prescriptions_active_idx" ON "contact_lens_prescriptions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_acq_source_company" ON "customer_acquisition_sources" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_acq_source_name" ON "customer_acquisition_sources" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_acq_source_period" ON "customer_acquisition_sources" USING btree ("period_start");--> statement-breakpoint
CREATE INDEX "idx_cohorts_company" ON "customer_cohorts" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_cohorts_period" ON "customer_cohorts" USING btree ("period_start");--> statement-breakpoint
CREATE INDEX "idx_cohorts_segment" ON "customer_cohorts" USING btree ("segment");--> statement-breakpoint
CREATE INDEX "idx_health_scores_company" ON "customer_health_scores" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_health_scores_risk" ON "customer_health_scores" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "idx_demand_forecasts_company" ON "demand_forecasts" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_demand_forecasts_product" ON "demand_forecasts" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_demand_forecasts_date" ON "demand_forecasts" USING btree ("forecast_date");--> statement-breakpoint
CREATE INDEX "idx_demand_forecasts_generated" ON "demand_forecasts" USING btree ("generated_at");--> statement-breakpoint
CREATE INDEX "diagnostic_suggestions_company_idx" ON "diagnostic_suggestions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "diagnostic_suggestions_patient_idx" ON "diagnostic_suggestions" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "diagnostic_suggestions_confidence_idx" ON "diagnostic_suggestions" USING btree ("confidence");--> statement-breakpoint
CREATE INDEX "diagnostic_suggestions_created_at_idx" ON "diagnostic_suggestions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "disease_programs_company_idx" ON "disease_management_programs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "disease_programs_disease_type_idx" ON "disease_management_programs" USING btree ("disease_type");--> statement-breakpoint
CREATE INDEX "disease_programs_active_idx" ON "disease_management_programs" USING btree ("active");--> statement-breakpoint
CREATE INDEX "disease_progression_predictions_company_idx" ON "disease_progression_predictions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "disease_progression_predictions_patient_idx" ON "disease_progression_predictions" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "disease_progression_predictions_disease_idx" ON "disease_progression_predictions" USING btree ("disease");--> statement-breakpoint
CREATE INDEX "disease_progression_predictions_created_at_idx" ON "disease_progression_predictions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "disease_registries_company_idx" ON "disease_registries" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "disease_registries_disease_code_idx" ON "disease_registries" USING btree ("disease_code");--> statement-breakpoint
CREATE INDEX "disease_registries_active_idx" ON "disease_registries" USING btree ("active");--> statement-breakpoint
CREATE INDEX "drug_interactions_company_idx" ON "drug_interactions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "drug_interactions_drug1_idx" ON "drug_interactions" USING btree ("drug1_id");--> statement-breakpoint
CREATE INDEX "drug_interactions_drug2_idx" ON "drug_interactions" USING btree ("drug2_id");--> statement-breakpoint
CREATE INDEX "drug_interactions_severity_idx" ON "drug_interactions" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "drugs_company_idx" ON "drugs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "drugs_name_idx" ON "drugs" USING btree ("name");--> statement-breakpoint
CREATE INDEX "drugs_generic_name_idx" ON "drugs" USING btree ("generic_name");--> statement-breakpoint
CREATE INDEX "idx_dynamic_role_permissions_role" ON "dynamic_role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_dynamic_role_permissions_permission" ON "dynamic_role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_role_permission" ON "dynamic_role_permissions" USING btree ("role_id","permission_id");--> statement-breakpoint
CREATE INDEX "idx_dynamic_roles_company" ON "dynamic_roles" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_dynamic_roles_name" ON "dynamic_roles" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_dynamic_roles_system_default" ON "dynamic_roles" USING btree ("is_system_default");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_role_per_company" ON "dynamic_roles" USING btree ("company_id","name");--> statement-breakpoint
CREATE INDEX "idx_event_log_type" ON "event_log" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_event_log_user" ON "event_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_event_log_company" ON "event_log" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_event_log_timestamp" ON "event_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_event_log_created" ON "event_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_feature_usage_company" ON "feature_usage_metrics" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_feature_usage_name" ON "feature_usage_metrics" USING btree ("feature_name");--> statement-breakpoint
CREATE INDEX "idx_feature_usage_tier" ON "feature_usage_metrics" USING btree ("tier");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_feature_usage_unique" ON "feature_usage_metrics" USING btree ("company_id","feature_name");--> statement-breakpoint
CREATE INDEX "feedback_user_id_idx" ON "feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "feedback_type_idx" ON "feedback" USING btree ("type");--> statement-breakpoint
CREATE INDEX "feedback_status_idx" ON "feedback" USING btree ("status");--> statement-breakpoint
CREATE INDEX "feedback_created_at_idx" ON "feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_forecast_accuracy_company" ON "forecast_accuracy_metrics" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_forecast_accuracy_period" ON "forecast_accuracy_metrics" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_frame_chars_product" ON "frame_characteristics" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_frame_chars_company" ON "frame_characteristics" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_frame_chars_style" ON "frame_characteristics" USING btree ("frame_style");--> statement-breakpoint
CREATE INDEX "idx_frame_chars_material" ON "frame_characteristics" USING btree ("frame_material");--> statement-breakpoint
CREATE INDEX "idx_frame_rec_analytics_company" ON "frame_recommendation_analytics" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_frame_rec_analytics_product" ON "frame_recommendation_analytics" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_frame_rec_analytics_period" ON "frame_recommendation_analytics" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_frame_recs_analysis" ON "frame_recommendations" USING btree ("face_analysis_id");--> statement-breakpoint
CREATE INDEX "idx_frame_recs_patient" ON "frame_recommendations" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_frame_recs_product" ON "frame_recommendations" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_frame_recs_company" ON "frame_recommendations" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_frame_recs_match_score" ON "frame_recommendations" USING btree ("match_score");--> statement-breakpoint
CREATE INDEX "idx_frame_recs_rank" ON "frame_recommendations" USING btree ("rank");--> statement-breakpoint
CREATE INDEX "health_risk_assessments_company_idx" ON "health_risk_assessments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "health_risk_assessments_patient_idx" ON "health_risk_assessments" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "health_risk_assessments_status_idx" ON "health_risk_assessments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "health_risk_assessments_risk_level_idx" ON "health_risk_assessments" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "idx_immunizations_company" ON "immunizations" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_immunizations_patient" ON "immunizations" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_immunizations_vaccine" ON "immunizations" USING btree ("vaccine_name");--> statement-breakpoint
CREATE INDEX "idx_immunizations_date" ON "immunizations" USING btree ("administration_date");--> statement-breakpoint
CREATE INDEX "idx_immunizations_status" ON "immunizations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "insurance_claims_company_idx" ON "insurance_claims" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "insurance_claims_patient_idx" ON "insurance_claims" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "insurance_claims_payer_idx" ON "insurance_claims" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "insurance_claims_status_idx" ON "insurance_claims" USING btree ("status");--> statement-breakpoint
CREATE INDEX "insurance_claims_service_date_idx" ON "insurance_claims" USING btree ("service_date");--> statement-breakpoint
CREATE INDEX "insurance_payers_company_idx" ON "insurance_payers" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "insurance_payers_company_payer_id" ON "insurance_payers" USING btree ("company_id","payer_id");--> statement-breakpoint
CREATE INDEX "idx_lab_orders_company" ON "lab_orders" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_lab_orders_patient" ON "lab_orders" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_lab_orders_practitioner" ON "lab_orders" USING btree ("practitioner_id");--> statement-breakpoint
CREATE INDEX "idx_lab_orders_order_number" ON "lab_orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "idx_lab_orders_status" ON "lab_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_lab_orders_ordered_date" ON "lab_orders" USING btree ("ordered_date");--> statement-breakpoint
CREATE INDEX "idx_lab_qc_company" ON "lab_quality_control" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_lab_qc_test_code" ON "lab_quality_control" USING btree ("test_code");--> statement-breakpoint
CREATE INDEX "idx_lab_qc_test_date" ON "lab_quality_control" USING btree ("test_date");--> statement-breakpoint
CREATE INDEX "idx_lab_qc_instrument" ON "lab_quality_control" USING btree ("instrument_id");--> statement-breakpoint
CREATE INDEX "idx_lab_qc_within_range" ON "lab_quality_control" USING btree ("is_within_range");--> statement-breakpoint
CREATE INDEX "idx_lab_results_company" ON "lab_results" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_lab_results_patient" ON "lab_results" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_lab_results_test" ON "lab_results" USING btree ("test_name");--> statement-breakpoint
CREATE INDEX "idx_lab_results_date" ON "lab_results" USING btree ("result_date");--> statement-breakpoint
CREATE INDEX "idx_lab_results_status" ON "lab_results" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_lab_test_catalog_company" ON "lab_test_catalog" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_lab_test_catalog_code" ON "lab_test_catalog" USING btree ("test_code");--> statement-breakpoint
CREATE INDEX "idx_lab_test_catalog_category" ON "lab_test_catalog" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_lab_test_catalog_active" ON "lab_test_catalog" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_market_insights_type" ON "market_insights" USING btree ("insight_type");--> statement-breakpoint
CREATE INDEX "idx_market_insights_category" ON "market_insights" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_market_insights_region" ON "market_insights" USING btree ("region");--> statement-breakpoint
CREATE INDEX "idx_market_insights_period" ON "market_insights" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_market_insights_status" ON "market_insights" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_market_insights_access" ON "market_insights" USING btree ("access_level");--> statement-breakpoint
CREATE INDEX "measure_calculations_measure_idx" ON "measure_calculations" USING btree ("measure_id");--> statement-breakpoint
CREATE INDEX "measure_calculations_date_idx" ON "measure_calculations" USING btree ("calculation_date");--> statement-breakpoint
CREATE INDEX "medical_records_company_idx" ON "medical_records" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "medical_records_patient_idx" ON "medical_records" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "medical_records_type_idx" ON "medical_records" USING btree ("type");--> statement-breakpoint
CREATE INDEX "medical_records_date_idx" ON "medical_records" USING btree ("date");--> statement-breakpoint
CREATE INDEX "medical_records_created_at_idx" ON "medical_records" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_medications_company" ON "medications" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_medications_patient" ON "medications" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_medications_practitioner" ON "medications" USING btree ("practitioner_id");--> statement-breakpoint
CREATE INDEX "idx_medications_status" ON "medications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_medications_name" ON "medications" USING btree ("medication_name");--> statement-breakpoint
CREATE INDEX "idx_medications_prescribed_date" ON "medications" USING btree ("prescribed_date");--> statement-breakpoint
CREATE INDEX "message_templates_company_idx" ON "message_templates" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "message_templates_channel_idx" ON "message_templates" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "message_templates_category_idx" ON "message_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "message_templates_active_idx" ON "message_templates" USING btree ("active");--> statement-breakpoint
CREATE INDEX "messages_company_idx" ON "messages" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "messages_recipient_idx" ON "messages" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "messages_status_idx" ON "messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "messages_channel_idx" ON "messages" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "messages_template_idx" ON "messages" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "messages_campaign_idx" ON "messages" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "messages_scheduled_for_idx" ON "messages" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "messages_sent_at_idx" ON "messages" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "ml_models_company_idx" ON "ml_models" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "ml_models_status_idx" ON "ml_models" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ml_models_type_idx" ON "ml_models" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_mrr_company" ON "monthly_recurring_revenue" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_mrr_period" ON "monthly_recurring_revenue" USING btree ("year","month");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_mrr_unique" ON "monthly_recurring_revenue" USING btree ("company_id","year","month");--> statement-breakpoint
CREATE INDEX "idx_nhs_claims_company" ON "nhs_claims" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_nhs_claims_patient" ON "nhs_claims" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_nhs_claims_examination" ON "nhs_claims" USING btree ("examination_id");--> statement-breakpoint
CREATE INDEX "idx_nhs_claims_practitioner" ON "nhs_claims" USING btree ("practitioner_id");--> statement-breakpoint
CREATE INDEX "idx_nhs_claims_status" ON "nhs_claims" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_nhs_claims_date" ON "nhs_claims" USING btree ("claim_date");--> statement-breakpoint
CREATE INDEX "idx_nhs_contracts_company" ON "nhs_contract_details" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_nhs_contracts_ods" ON "nhs_contract_details" USING btree ("ods_code");--> statement-breakpoint
CREATE INDEX "idx_nhs_exemptions_company" ON "nhs_patient_exemptions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_nhs_exemptions_patient" ON "nhs_patient_exemptions" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_nhs_exemptions_status" ON "nhs_patient_exemptions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_nhs_exemptions_expiry" ON "nhs_patient_exemptions" USING btree ("valid_until");--> statement-breakpoint
CREATE INDEX "idx_nhs_payments_company" ON "nhs_payments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_nhs_payments_date" ON "nhs_payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "idx_nhs_payments_reconciled" ON "nhs_payments" USING btree ("is_reconciled");--> statement-breakpoint
CREATE INDEX "idx_nhs_practitioners_user" ON "nhs_practitioners" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_nhs_practitioners_company" ON "nhs_practitioners" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_nhs_practitioners_goc" ON "nhs_practitioners" USING btree ("goc_number");--> statement-breakpoint
CREATE INDEX "idx_nhs_vouchers_company" ON "nhs_vouchers" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_nhs_vouchers_patient" ON "nhs_vouchers" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_nhs_vouchers_status" ON "nhs_vouchers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_nhs_vouchers_expiry" ON "nhs_vouchers" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "no_show_predictions_company_idx" ON "no_show_predictions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "no_show_predictions_patient_idx" ON "no_show_predictions" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "no_show_predictions_appointment_idx" ON "no_show_predictions" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "no_show_predictions_risk_level_idx" ON "no_show_predictions" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "no_show_predictions_created_at_idx" ON "no_show_predictions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "nps_user_id_idx" ON "nps_surveys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "nps_category_idx" ON "nps_surveys" USING btree ("category");--> statement-breakpoint
CREATE INDEX "nps_score_idx" ON "nps_surveys" USING btree ("score");--> statement-breakpoint
CREATE INDEX "nps_created_at_idx" ON "nps_surveys" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "nps_trigger_idx" ON "nps_surveys" USING btree ("trigger");--> statement-breakpoint
CREATE INDEX "outcome_tracking_company_idx" ON "outcome_tracking" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "outcome_tracking_patient_idx" ON "outcome_tracking" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "outcome_tracking_program_idx" ON "outcome_tracking" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "outcome_tracking_registry_idx" ON "outcome_tracking" USING btree ("registry_id");--> statement-breakpoint
CREATE INDEX "outcome_tracking_outcome_type_idx" ON "outcome_tracking" USING btree ("outcome_type");--> statement-breakpoint
CREATE INDEX "idx_patient_activity_patient" ON "patient_activity_log" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_patient_activity_type" ON "patient_activity_log" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "idx_patient_activity_date" ON "patient_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_patient_activity_company" ON "patient_activity_log" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "patient_engagement_company_idx" ON "patient_engagement" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "patient_engagement_patient_idx" ON "patient_engagement" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "patient_engagement_program_idx" ON "patient_engagement" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "patient_engagement_type_idx" ON "patient_engagement" USING btree ("engagement_type");--> statement-breakpoint
CREATE INDEX "patient_engagement_date_idx" ON "patient_engagement" USING btree ("engagement_date");--> statement-breakpoint
CREATE INDEX "idx_face_analysis_patient" ON "patient_face_analysis" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_face_analysis_company" ON "patient_face_analysis" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_face_analysis_face_shape" ON "patient_face_analysis" USING btree ("face_shape");--> statement-breakpoint
CREATE INDEX "patient_outreach_company_idx" ON "patient_outreach" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "patient_outreach_patient_idx" ON "patient_outreach" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "patient_outreach_task_idx" ON "patient_outreach" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "patient_outreach_status_idx" ON "patient_outreach" USING btree ("status");--> statement-breakpoint
CREATE INDEX "patient_outreach_scheduled_date_idx" ON "patient_outreach" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "patient_outreach_type_idx" ON "patient_outreach" USING btree ("outreach_type");--> statement-breakpoint
CREATE INDEX "pdsa_cycles_company_idx" ON "pdsa_cycles" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "pdsa_cycles_project_idx" ON "pdsa_cycles" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "pdsa_cycles_status_idx" ON "pdsa_cycles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "performance_improvements_company_idx" ON "performance_improvements" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "performance_improvements_metric_idx" ON "performance_improvements" USING btree ("metric");--> statement-breakpoint
CREATE INDEX "performance_improvements_status_idx" ON "performance_improvements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "performance_improvements_trend_idx" ON "performance_improvements" USING btree ("trend");--> statement-breakpoint
CREATE INDEX "idx_platform_statistics_date" ON "platform_statistics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_platform_statistics_period" ON "platform_statistics" USING btree ("period_type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_platform_statistics_date_period" ON "platform_statistics" USING btree ("date","period_type");--> statement-breakpoint
CREATE INDEX "portal_conversations_company_idx" ON "portal_conversations" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "portal_conversations_patient_idx" ON "portal_conversations" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "portal_conversations_provider_idx" ON "portal_conversations" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "portal_conversations_status_idx" ON "portal_conversations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "portal_conversations_last_message_at_idx" ON "portal_conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "portal_messages_company_idx" ON "portal_messages" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "portal_messages_conversation_idx" ON "portal_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "portal_messages_sender_idx" ON "portal_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "portal_messages_recipient_idx" ON "portal_messages" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "portal_messages_sent_at_idx" ON "portal_messages" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "portal_payments_company_idx" ON "portal_payments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "portal_payments_bill_idx" ON "portal_payments" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "portal_payments_patient_idx" ON "portal_payments" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "portal_payments_status_idx" ON "portal_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "portal_payments_created_at_idx" ON "portal_payments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "predictive_analyses_company_idx" ON "predictive_analyses" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "predictive_analyses_patient_idx" ON "predictive_analyses" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "predictive_analyses_model_idx" ON "predictive_analyses" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "predictive_analyses_risk_level_idx" ON "predictive_analyses" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "predictive_analyses_analyzed_date_idx" ON "predictive_analyses" USING btree ("analyzed_date");--> statement-breakpoint
CREATE INDEX "predictive_models_company_idx" ON "predictive_models" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "predictive_models_active_idx" ON "predictive_models" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "predictive_models_model_type_idx" ON "predictive_models" USING btree ("model_type");--> statement-breakpoint
CREATE INDEX "prescription_uploads_company_idx" ON "prescription_uploads" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "prescription_uploads_order_idx" ON "prescription_uploads" USING btree ("shopify_order_id");--> statement-breakpoint
CREATE INDEX "prescription_uploads_status_idx" ON "prescription_uploads" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "prescription_uploads_requires_review_idx" ON "prescription_uploads" USING btree ("requires_review");--> statement-breakpoint
CREATE INDEX "preventive_care_company_idx" ON "preventive_care_recommendations" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "preventive_care_patient_idx" ON "preventive_care_recommendations" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "preventive_care_type_idx" ON "preventive_care_recommendations" USING btree ("recommendation_type");--> statement-breakpoint
CREATE INDEX "preventive_care_status_idx" ON "preventive_care_recommendations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "preventive_care_due_date_idx" ON "preventive_care_recommendations" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "program_enrollments_company_idx" ON "program_enrollments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "program_enrollments_program_idx" ON "program_enrollments" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "program_enrollments_patient_idx" ON "program_enrollments" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "program_enrollments_status_idx" ON "program_enrollments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "program_enrollments_coach_idx" ON "program_enrollments" USING btree ("assigned_coach");--> statement-breakpoint
CREATE INDEX "provider_availability_company_idx" ON "provider_availability" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "provider_availability_provider_idx" ON "provider_availability" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "provider_availability_day_of_week_idx" ON "provider_availability" USING btree ("day_of_week");--> statement-breakpoint
CREATE INDEX "quality_dashboards_company_idx" ON "quality_dashboards" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "quality_dashboards_created_by_idx" ON "quality_dashboards" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "quality_gap_analyses_measure_idx" ON "quality_gap_analyses" USING btree ("measure_id");--> statement-breakpoint
CREATE INDEX "quality_gap_analyses_date_idx" ON "quality_gap_analyses" USING btree ("analysis_date");--> statement-breakpoint
CREATE INDEX "qi_projects_company_idx" ON "quality_improvement_projects" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "qi_projects_status_idx" ON "quality_improvement_projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "qi_projects_priority_idx" ON "quality_improvement_projects" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "qi_projects_project_number_idx" ON "quality_improvement_projects" USING btree ("project_number");--> statement-breakpoint
CREATE INDEX "quality_measures_company_idx" ON "quality_measures" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "quality_measures_type_idx" ON "quality_measures" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "quality_measures_company_measure_year" ON "quality_measures" USING btree ("company_id","measure_id","reporting_year");--> statement-breakpoint
CREATE INDEX "readmission_predictions_company_idx" ON "readmission_predictions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "readmission_predictions_patient_idx" ON "readmission_predictions" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "readmission_predictions_admission_idx" ON "readmission_predictions" USING btree ("admission_id");--> statement-breakpoint
CREATE INDEX "readmission_predictions_risk_level_idx" ON "readmission_predictions" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "readmission_predictions_created_at_idx" ON "readmission_predictions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "registry_enrollments_company_idx" ON "registry_enrollments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "registry_enrollments_registry_idx" ON "registry_enrollments" USING btree ("registry_id");--> statement-breakpoint
CREATE INDEX "registry_enrollments_patient_idx" ON "registry_enrollments" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "registry_enrollments_status_idx" ON "registry_enrollments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "risk_scores_company_idx" ON "risk_scores" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "risk_scores_patient_idx" ON "risk_scores" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "risk_scores_risk_level_idx" ON "risk_scores" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "risk_scores_category_idx" ON "risk_scores" USING btree ("category");--> statement-breakpoint
CREATE INDEX "risk_scores_calculated_date_idx" ON "risk_scores" USING btree ("calculated_date");--> statement-breakpoint
CREATE INDEX "risk_stratification_cohorts_company_idx" ON "risk_stratification_cohorts" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "risk_stratification_cohorts_active_idx" ON "risk_stratification_cohorts" USING btree ("active");--> statement-breakpoint
CREATE INDEX "risk_stratification_cohorts_name_idx" ON "risk_stratification_cohorts" USING btree ("name");--> statement-breakpoint
CREATE INDEX "risk_stratifications_company_idx" ON "risk_stratifications" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "risk_stratifications_patient_idx" ON "risk_stratifications" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "risk_stratifications_risk_type_idx" ON "risk_stratifications" USING btree ("risk_type");--> statement-breakpoint
CREATE INDEX "risk_stratifications_risk_level_idx" ON "risk_stratifications" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "risk_stratifications_created_at_idx" ON "risk_stratifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_role_change_audit_company" ON "role_change_audit" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_role_change_audit_changed_by" ON "role_change_audit" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "idx_role_change_audit_role" ON "role_change_audit" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_role_change_audit_timestamp" ON "role_change_audit" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "idx_role_change_audit_action" ON "role_change_audit" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "idx_seasonal_patterns_company" ON "seasonal_patterns" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_seasonal_patterns_product" ON "seasonal_patterns" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_seasonal_patterns_type" ON "seasonal_patterns" USING btree ("pattern_type");--> statement-breakpoint
CREATE INDEX "shopify_orders_company_idx" ON "shopify_orders" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "shopify_orders_store_idx" ON "shopify_orders" USING btree ("shopify_store_id");--> statement-breakpoint
CREATE INDEX "shopify_orders_sync_status_idx" ON "shopify_orders" USING btree ("sync_status");--> statement-breakpoint
CREATE INDEX "shopify_orders_shopify_id_idx" ON "shopify_orders" USING btree ("shopify_order_id");--> statement-breakpoint
CREATE INDEX "shopify_orders_ils_order_idx" ON "shopify_orders" USING btree ("ils_order_id");--> statement-breakpoint
CREATE INDEX "shopify_products_company_idx" ON "shopify_products" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "shopify_products_store_idx" ON "shopify_products" USING btree ("shopify_store_id");--> statement-breakpoint
CREATE INDEX "shopify_products_shopify_id_idx" ON "shopify_products" USING btree ("shopify_product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shopify_products_unique" ON "shopify_products" USING btree ("shopify_store_id","shopify_product_id","shopify_variant_id");--> statement-breakpoint
CREATE INDEX "shopify_stores_company_idx" ON "shopify_stores" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "shopify_stores_status_idx" ON "shopify_stores" USING btree ("status");--> statement-breakpoint
CREATE INDEX "shopify_webhooks_store_idx" ON "shopify_webhooks" USING btree ("shopify_store_id");--> statement-breakpoint
CREATE INDEX "shopify_webhooks_topic_idx" ON "shopify_webhooks" USING btree ("webhook_topic");--> statement-breakpoint
CREATE INDEX "shopify_webhooks_processed_idx" ON "shopify_webhooks" USING btree ("processed");--> statement-breakpoint
CREATE INDEX "shopify_webhooks_received_idx" ON "shopify_webhooks" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "social_determinants_company_idx" ON "social_determinants" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "social_determinants_patient_idx" ON "social_determinants" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "social_determinants_category_idx" ON "social_determinants" USING btree ("category");--> statement-breakpoint
CREATE INDEX "social_determinants_status_idx" ON "social_determinants" USING btree ("status");--> statement-breakpoint
CREATE INDEX "social_determinants_severity_idx" ON "social_determinants" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "star_ratings_company_idx" ON "star_ratings" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "star_ratings_year_idx" ON "star_ratings" USING btree ("measurement_year");--> statement-breakpoint
CREATE UNIQUE INDEX "star_ratings_contract_year" ON "star_ratings" USING btree ("contract_id","measurement_year");--> statement-breakpoint
CREATE INDEX "transitions_company_idx" ON "transitions_of_care" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "transitions_patient_idx" ON "transitions_of_care" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "transitions_type_idx" ON "transitions_of_care" USING btree ("transition_type");--> statement-breakpoint
CREATE INDEX "transitions_status_idx" ON "transitions_of_care" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transitions_follow_up_idx" ON "transitions_of_care" USING btree ("follow_up_date");--> statement-breakpoint
CREATE INDEX "treatment_outcome_predictions_company_idx" ON "treatment_outcome_predictions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "treatment_outcome_predictions_patient_idx" ON "treatment_outcome_predictions" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "treatment_outcome_predictions_treatment_idx" ON "treatment_outcome_predictions" USING btree ("treatment");--> statement-breakpoint
CREATE INDEX "treatment_outcome_predictions_created_at_idx" ON "treatment_outcome_predictions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "treatment_recommendations_company_idx" ON "treatment_recommendations" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "treatment_recommendations_patient_idx" ON "treatment_recommendations" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "treatment_recommendations_condition_idx" ON "treatment_recommendations" USING btree ("condition");--> statement-breakpoint
CREATE INDEX "treatment_recommendations_created_at_idx" ON "treatment_recommendations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "unsubscribes_company_idx" ON "unsubscribes" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "unsubscribes_recipient_idx" ON "unsubscribes" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "unsubscribes_channel_idx" ON "unsubscribes" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "unsubscribes_category_idx" ON "unsubscribes" USING btree ("category");--> statement-breakpoint
CREATE INDEX "unsubscribes_unique_idx" ON "unsubscribes" USING btree ("recipient_id","channel","category");--> statement-breakpoint
CREATE INDEX "idx_usage_events_company" ON "usage_events" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_usage_events_type" ON "usage_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_usage_events_user" ON "usage_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_usage_events_created" ON "usage_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_user_dynamic_roles_user" ON "user_dynamic_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_dynamic_roles_role" ON "user_dynamic_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_user_dynamic_roles_primary" ON "user_dynamic_roles" USING btree ("is_primary");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_role" ON "user_dynamic_roles" USING btree ("user_id","role_id");--> statement-breakpoint
CREATE INDEX "idx_vital_signs_company" ON "vital_signs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_vital_signs_patient" ON "vital_signs" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_vital_signs_type" ON "vital_signs" USING btree ("vital_type");--> statement-breakpoint
CREATE INDEX "idx_vital_signs_date" ON "vital_signs" USING btree ("measurement_date");--> statement-breakpoint
CREATE INDEX "idx_vital_signs_interpretation" ON "vital_signs" USING btree ("interpretation");--> statement-breakpoint
CREATE INDEX "idx_webhook_deliveries_subscription" ON "webhook_deliveries" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_deliveries_event" ON "webhook_deliveries" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_deliveries_status" ON "webhook_deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_webhook_deliveries_next_retry" ON "webhook_deliveries" USING btree ("next_retry_at");--> statement-breakpoint
CREATE INDEX "idx_webhook_subscriptions_company" ON "webhook_subscriptions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_subscriptions_active" ON "webhook_subscriptions" USING btree ("active");--> statement-breakpoint
CREATE INDEX "workflow_instances_company_idx" ON "workflow_instances" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "workflow_instances_workflow_idx" ON "workflow_instances" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "workflow_instances_patient_idx" ON "workflow_instances" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "workflow_instances_status_idx" ON "workflow_instances" USING btree ("status");--> statement-breakpoint
CREATE INDEX "workflow_instances_started_at_idx" ON "workflow_instances" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "workflow_run_counts_company_idx" ON "workflow_run_counts" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_run_counts_workflow_patient_unique" ON "workflow_run_counts" USING btree ("workflow_id","patient_id");--> statement-breakpoint
CREATE INDEX "workflows_company_idx" ON "workflows" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "workflows_trigger_idx" ON "workflows" USING btree ("trigger");--> statement-breakpoint
CREATE INDEX "workflows_status_idx" ON "workflows" USING btree ("status");--> statement-breakpoint
ALTER TABLE "ai_model_versions" ADD CONSTRAINT "ai_model_versions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_training_jobs" ADD CONSTRAINT "ai_training_jobs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_training_datasets" ADD CONSTRAINT "master_training_datasets_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
DROP TYPE "public"."user_role_enhanced";--> statement-breakpoint
DROP TYPE "public"."user_role";