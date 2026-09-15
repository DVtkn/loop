ALTER TABLE "test_answers" ALTER COLUMN "selected_value" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "couple_reports" ADD COLUMN "radar_lifestyle" numeric(5, 2) DEFAULT '50.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "couple_reports" ADD COLUMN "personality_types" jsonb;