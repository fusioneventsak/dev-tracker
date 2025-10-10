-- Create user_invitations table for team member invitations
CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted BOOLEAN DEFAULT FALSE,
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on token for fast lookups
CREATE INDEX idx_user_invitations_token ON user_invitations(token);
CREATE INDEX idx_user_invitations_email ON user_invitations(email);
CREATE INDEX idx_user_invitations_expires_at ON user_invitations(expires_at);

-- RLS Policies
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view invitations
CREATE POLICY "Authenticated users can view invitations"
ON user_invitations FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to create invitations
CREATE POLICY "Authenticated users can create invitations"
ON user_invitations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update invitations (for accepting)
CREATE POLICY "Authenticated users can update invitations"
ON user_invitations FOR UPDATE
TO authenticated
USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER update_user_invitations_timestamp
BEFORE UPDATE ON user_invitations
FOR EACH ROW
EXECUTE FUNCTION update_user_invitations_updated_at();
