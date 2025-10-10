-- Allow all authenticated users to view all profiles (for chat sender names)
CREATE POLICY "Users can view all profiles for chat" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');
