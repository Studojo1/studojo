CREATE TABLE "dissertation_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone_number" text NOT NULL,
	"dissertation_title" text NOT NULL,
	"data_type" text NOT NULL,
	"current_stage" text NOT NULL,
	"additional_notes" text,
	"form_data" jsonb,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "career_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone_number" text NOT NULL,
	"city" text NOT NULL,
	"institution_name" text NOT NULL,
	"current_year" text NOT NULL,
	"course" text NOT NULL,
	"areas_of_interest" jsonb NOT NULL,
	"form_data" jsonb,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "dissertation_submissions_email_idx" ON "dissertation_submissions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "dissertation_submissions_phone_idx" ON "dissertation_submissions" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "dissertation_submissions_created_idx" ON "dissertation_submissions" USING btree ("created_at" DESC);--> statement-breakpoint
CREATE INDEX "dissertation_submissions_payment_status_idx" ON "dissertation_submissions" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "career_applications_email_idx" ON "career_applications" USING btree ("email");--> statement-breakpoint
CREATE INDEX "career_applications_phone_idx" ON "career_applications" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "career_applications_created_idx" ON "career_applications" USING btree ("created_at" DESC);--> statement-breakpoint
CREATE INDEX "career_applications_payment_status_idx" ON "career_applications" USING btree ("payment_status");

