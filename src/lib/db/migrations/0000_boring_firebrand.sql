CREATE TABLE "agencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"branding" jsonb DEFAULT '{}'::jsonb,
	"subscription_tier" text DEFAULT 'free',
	"billing" jsonb DEFAULT '{}'::jsonb,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "agencies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "api_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid,
	"tier" text NOT NULL,
	"provider" text NOT NULL,
	"model" text,
	"tokens_in" integer,
	"tokens_out" integer,
	"cost_inr" numeric,
	"duration_ms" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"business_type" text NOT NULL,
	"status" text DEFAULT 'onboarding',
	"landmark_description" text,
	"languages" text[] DEFAULT '{"en"}',
	"subscription_tier" text DEFAULT 'physical',
	"monthly_fee_inr" integer,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "clients_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "data_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"source_type" text NOT NULL,
	"status" text DEFAULT 'pending',
	"credentials" jsonb DEFAULT '{}'::jsonb,
	"last_sync_at" timestamp with time zone,
	"next_sync_at" timestamp with time zone,
	"sync_frequency_hours" integer DEFAULT 6,
	"raw_data" jsonb DEFAULT '{}'::jsonb,
	"error_log" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "experiments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft',
	"experiment_type" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"results" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "knowledge_graph_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"knowledge_graph_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"changed_by" text,
	"change_reason" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_graphs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"version" integer DEFAULT 1,
	"business_profile" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"services" jsonb DEFAULT '[]'::jsonb,
	"products" jsonb DEFAULT '[]'::jsonb,
	"competitors" jsonb DEFAULT '[]'::jsonb,
	"presence_state" jsonb DEFAULT '{}'::jsonb,
	"search_state" jsonb DEFAULT '{}'::jsonb,
	"decision_radius_map" jsonb DEFAULT '{}'::jsonb,
	"confidence_scores" jsonb DEFAULT '{}'::jsonb,
	"conflicts" jsonb DEFAULT '[]'::jsonb,
	"last_strategist_run" timestamp with time zone,
	"last_worker_run" timestamp with time zone,
	"strategist_cooldown_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "knowledge_graphs_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "meta_intelligence_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_type" text NOT NULL,
	"input_summary" jsonb DEFAULT '{}'::jsonb,
	"findings" jsonb DEFAULT '{}'::jsonb,
	"actions_taken" jsonb DEFAULT '[]'::jsonb,
	"roadmap_suggestions" jsonb DEFAULT '[]'::jsonb,
	"model_used" text,
	"tokens_used" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "monitoring_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"query_text" text NOT NULL,
	"language" text DEFAULT 'en',
	"source_keyword" text,
	"source_cpc_inr" numeric,
	"focus_item_type" text,
	"focus_item_id" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "monitoring_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"query_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"client_mentioned" boolean DEFAULT false,
	"client_position" integer,
	"information_accurate" boolean,
	"accuracy_issues" jsonb DEFAULT '[]'::jsonb,
	"competitor_mentions" jsonb DEFAULT '[]'::jsonb,
	"raw_response" text,
	"response_summary" text,
	"query_method" text,
	"response_time_ms" integer,
	"queried_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "presence_deployments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"format" text NOT NULL,
	"language" text DEFAULT 'en',
	"deployment_method" text NOT NULL,
	"content" text,
	"content_hash" text,
	"deployment_url" text,
	"status" text DEFAULT 'draft',
	"health_check" jsonb DEFAULT '{}'::jsonb,
	"last_deployed_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"generated_by" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"priority" text DEFAULT 'medium',
	"status" text DEFAULT 'pending',
	"action_data" jsonb DEFAULT '{}'::jsonb,
	"result_data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"acted_on_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "system_health_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service" text NOT NULL,
	"status" text NOT NULL,
	"response_time_ms" integer,
	"error_message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"checked_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"role" text NOT NULL,
	"agency_id" uuid,
	"client_id" uuid,
	"auth_provider_id" text,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"last_login_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "visibility_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"date" date NOT NULL,
	"overall_score" numeric,
	"platform_scores" jsonb DEFAULT '{}'::jsonb,
	"item_scores" jsonb DEFAULT '{}'::jsonb,
	"gads_equivalent_value_inr" numeric,
	"branded_search_trend" jsonb DEFAULT '{}'::jsonb,
	"gbp_actions_trend" jsonb DEFAULT '{}'::jsonb,
	"competitor_comparison" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "visibility_scores_client_date" UNIQUE("client_id","date")
);
--> statement-breakpoint
ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_sources" ADD CONSTRAINT "data_sources_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_graph_history" ADD CONSTRAINT "knowledge_graph_history_knowledge_graph_id_knowledge_graphs_id_fk" FOREIGN KEY ("knowledge_graph_id") REFERENCES "public"."knowledge_graphs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_graphs" ADD CONSTRAINT "knowledge_graphs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_queries" ADD CONSTRAINT "monitoring_queries_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_results" ADD CONSTRAINT "monitoring_results_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_results" ADD CONSTRAINT "monitoring_results_query_id_monitoring_queries_id_fk" FOREIGN KEY ("query_id") REFERENCES "public"."monitoring_queries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presence_deployments" ADD CONSTRAINT "presence_deployments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visibility_scores" ADD CONSTRAINT "visibility_scores_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_api_usage_client" ON "api_usage_logs" USING btree ("client_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_api_usage_tier" ON "api_usage_logs" USING btree ("tier","created_at");--> statement-breakpoint
CREATE INDEX "idx_clients_agency" ON "clients" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_clients_status" ON "clients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_data_sources_client" ON "data_sources" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_data_sources_type" ON "data_sources" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "idx_monitoring_results_client_date" ON "monitoring_results" USING btree ("client_id","queried_at");--> statement-breakpoint
CREATE INDEX "idx_monitoring_results_platform" ON "monitoring_results" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "idx_recommendations_client" ON "recommendations" USING btree ("client_id","status");--> statement-breakpoint
CREATE INDEX "idx_system_health" ON "system_health_logs" USING btree ("service","checked_at");--> statement-breakpoint
CREATE INDEX "idx_visibility_scores_client_date" ON "visibility_scores" USING btree ("client_id","date");