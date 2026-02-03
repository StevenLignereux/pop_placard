-- Update policies for products table to allow volunteers to perform CRUD operations

-- Drop existing policies if they exist (to ensure clean slate or update)
DROP POLICY IF EXISTS "Allow read access for all authenticated users" ON public.products;
DROP POLICY IF EXISTS "Allow full access for admins" ON public.products;
DROP POLICY IF EXISTS "Allow write access for volunteers" ON public.products;

-- Re-create policies

-- 1. Read access: All authenticated users can read products
CREATE POLICY "Allow read access for all authenticated users"
ON public.products
FOR SELECT
TO authenticated
USING (true);

-- 2. Write access (Insert, Update, Delete): Allow both admins and volunteers
-- Ideally, we might want to separate them, but if the requirement is "volunteers can edit and delete", 
-- we can simply allow all authenticated users OR specifically check for roles.
-- Since the requirement is specifically "volunteers", and we assume 'admin' also keeps access.

CREATE POLICY "Allow write access for authenticated users"
ON public.products
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND (users.role = 'admin' OR users.role = 'volunteer')
  )
);
