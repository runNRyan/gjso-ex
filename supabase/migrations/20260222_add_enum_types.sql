-- Migration: Convert string columns to PostgreSQL enums
-- Date: 2026-02-22
-- Description: Create 6 enum types and convert corresponding table columns

-- 1. question_status
CREATE TYPE public.question_status AS ENUM ('draft', 'published', 'closed');
ALTER TABLE public.questions
  ALTER COLUMN status TYPE public.question_status USING status::public.question_status;

-- 2. balance_type
CREATE TYPE public.balance_type AS ENUM ('golden', 'silver', 'normal');
ALTER TABLE public.questions
  ALTER COLUMN balance_type TYPE public.balance_type USING balance_type::public.balance_type;

-- 3. vote_choice
CREATE TYPE public.vote_choice AS ENUM ('a', 'b');
ALTER TABLE public.votes
  ALTER COLUMN choice TYPE public.vote_choice USING choice::public.vote_choice;

-- 4. prediction_choice
CREATE TYPE public.prediction_choice AS ENUM ('a', 'b', 'golden');
ALTER TABLE public.predictions
  ALTER COLUMN prediction TYPE public.prediction_choice USING prediction::public.prediction_choice;

-- 5. suggestion_status
CREATE TYPE public.suggestion_status AS ENUM ('new', 'reviewed', 'used');
ALTER TABLE public.suggested_questions
  ALTER COLUMN status TYPE public.suggestion_status USING status::public.suggestion_status;

-- 6. point_type
CREATE TYPE public.point_type AS ENUM ('vote_bonus', 'prediction_reward');
ALTER TABLE public.point_history
  ALTER COLUMN type TYPE public.point_type USING type::public.point_type;
