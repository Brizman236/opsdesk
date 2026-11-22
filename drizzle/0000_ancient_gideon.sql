CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(254) NOT NULL,
	"subject" varchar(150) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tickets_name_length_check" CHECK (char_length("tickets"."name") BETWEEN 2 AND 100 AND btrim("tickets"."name") <> ''),
	CONSTRAINT "tickets_email_length_check" CHECK (char_length("tickets"."email") BETWEEN 3 AND 254 AND btrim("tickets"."email") <> ''),
	CONSTRAINT "tickets_subject_length_check" CHECK (char_length("tickets"."subject") BETWEEN 5 AND 150 AND btrim("tickets"."subject") <> ''),
	CONSTRAINT "tickets_description_length_check" CHECK (char_length("tickets"."description") BETWEEN 10 AND 5000 AND btrim("tickets"."description") <> ''),
	CONSTRAINT "tickets_status_check" CHECK ("tickets"."status" IN ('open', 'in_progress', 'closed'))
);
