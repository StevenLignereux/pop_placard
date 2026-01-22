
-- Allow admins to update users (for role changes and activation/deactivation)
CREATE POLICY "Admins can update users" ON users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Ensure admins can insert into users (though usually done via Auth trigger, 
-- but sometimes useful if direct insert needed, mostly Trigger handles it)
-- The Trigger runs as SECURITY DEFINER so it bypasses RLS for the INSERT.
-- But if we wanted to allow direct inserts (not recommended for auth linked tables), we would need a policy.
-- We'll stick to Auth Trigger for creation.

-- Fix for Products RLS if needed (already has "Les administrateurs peuvent gérer les produits" FOR ALL)
-- Verify that policy covers INSERT/UPDATE/DELETE. Yes "FOR ALL".

-- Allow admins to DELETE users?
CREATE POLICY "Admins can delete users" ON users
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
