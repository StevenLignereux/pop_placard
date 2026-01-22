
-- Create Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- 'create_user', 'delete_user', 'update_role', etc.
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can create logs (for their actions) - usually handled by backend/triggers but allowing insert for now
CREATE POLICY "Authenticated users can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update handle_new_user to make the first user an admin automatically
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  -- Check if this is the first user in the table
  SELECT NOT EXISTS (SELECT 1 FROM public.users) INTO is_first_user;
  
  INSERT INTO public.users (id, email, name, role, is_active)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', new.email), 
    CASE 
      WHEN is_first_user THEN 'admin' 
      ELSE COALESCE(new.raw_user_meta_data->>'role', 'volunteer') 
    END,
    CASE
      WHEN is_first_user THEN true -- First user is always active
      ELSE true -- Volunteers are active by default (can be changed to false if approval needed)
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT ON audit_logs TO authenticated;
