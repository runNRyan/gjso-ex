-- Admin RLS Policies for Suggestions and Comments Management
--
-- NOTE: These policies are required for the admin page to function correctly.
-- The admin needs to:
-- 1. View ALL suggested questions (not just their own)
-- 2. Update suggested question status (new, reviewed, used)
-- 3. View ALL comments including deleted ones
-- 4. Soft delete any comment (set is_deleted = true)

-- Admin can view all suggested questions
CREATE POLICY "Admins can view all suggested questions"
  ON public.suggested_questions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Admin can update suggested question status
CREATE POLICY "Admins can update suggested questions"
  ON public.suggested_questions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Admin can view all comments (including deleted)
CREATE POLICY "Admins can view all comments"
  ON public.comments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Admin can update any comment (for soft delete)
CREATE POLICY "Admins can update any comment"
  ON public.comments FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
  );
