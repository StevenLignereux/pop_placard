
-- 1. Helper functions to avoid recursion (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing problematic policies on users
DROP POLICY IF EXISTS "Les administrateurs peuvent voir tous les utilisateurs" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- 3. Recreate policies on users using helper functions
CREATE POLICY "Les administrateurs peuvent voir tous les utilisateurs" ON users
    FOR SELECT USING (
        is_admin()
    );

CREATE POLICY "Admins can update users" ON users
    FOR UPDATE USING (
        is_admin()
    );

CREATE POLICY "Admins can delete users" ON users
    FOR DELETE USING (
        is_admin()
    );

-- 4. Update other tables policies to use helpers (cleaner and safer)

-- Products
DROP POLICY IF EXISTS "Les administrateurs peuvent gérer les produits" ON products;
CREATE POLICY "Les administrateurs peuvent gérer les produits" ON products
    FOR ALL USING (
        is_admin()
    );

-- Stock Movements
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir les mouvements" ON stock_movements;
CREATE POLICY "Les utilisateurs peuvent voir les mouvements" ON stock_movements
    FOR SELECT USING (
        is_active_user()
    );

-- Audit Logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        is_admin()
    );
