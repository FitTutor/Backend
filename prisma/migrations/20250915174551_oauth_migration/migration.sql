-- CreateEnum
CREATE TYPE "public"."OAuthProvider" AS ENUM ('GOOGLE', 'APPLE', 'FACEBOOK');

-- CreateEnum
CREATE TYPE "public"."SessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "nickname" VARCHAR(50) NOT NULL,
    "display_name" VARCHAR(100),
    "profile_image" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Asia/Seoul',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."oauth_accounts" (
    "id" TEXT NOT NULL,
    "provider" "public"."OAuthProvider" NOT NULL,
    "provider_id" VARCHAR(100) NOT NULL,
    "provider_data" JSONB,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subjects" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    "icon" VARCHAR(10),
    "description" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."study_sessions" (
    "id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMP(3),
    "duration" INTEGER,
    "status" "public"."SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "user_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."study_plans" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "public"."PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."plan_tasks" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "priority" "public"."TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "plan_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."daily_summaries" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_minutes" INTEGER NOT NULL DEFAULT 0,
    "session_count" INTEGER NOT NULL DEFAULT 0,
    "reflection" TEXT,
    "mood" SMALLINT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "idx_oauth_accounts_user" ON "public"."oauth_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_provider_id_key" ON "public"."oauth_accounts"("provider", "provider_id");

-- CreateIndex
CREATE INDEX "idx_subjects_user_id" ON "public"."subjects"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_user_id_name_key" ON "public"."subjects"("user_id", "name");

-- CreateIndex
CREATE INDEX "idx_study_sessions_user_date" ON "public"."study_sessions"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_study_sessions_user_status" ON "public"."study_sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_study_sessions_subject" ON "public"."study_sessions"("subject_id");

-- CreateIndex
CREATE INDEX "idx_study_plans_user_date" ON "public"."study_plans"("user_id", "start_date");

-- CreateIndex
CREATE INDEX "idx_study_plans_user_status" ON "public"."study_plans"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_plan_tasks_plan_order" ON "public"."plan_tasks"("plan_id", "order");

-- CreateIndex
CREATE INDEX "idx_plan_tasks_subject" ON "public"."plan_tasks"("subject_id");

-- CreateIndex
CREATE INDEX "idx_daily_summaries_user_date" ON "public"."daily_summaries"("user_id", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "daily_summaries_user_id_date_key" ON "public"."daily_summaries"("user_id", "date");

-- AddForeignKey
ALTER TABLE "public"."oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subjects" ADD CONSTRAINT "subjects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_sessions" ADD CONSTRAINT "study_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_sessions" ADD CONSTRAINT "study_sessions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_plans" ADD CONSTRAINT "study_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."plan_tasks" ADD CONSTRAINT "plan_tasks_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."plan_tasks" ADD CONSTRAINT "plan_tasks_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."daily_summaries" ADD CONSTRAINT "daily_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
