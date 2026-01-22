
-- Ensure the first user ever created is an admin (fixes the issue for the existing user)
UPDATE public.users 
SET role = 'admin', is_active = true
WHERE id = (
    SELECT id 
    FROM public.users 
    ORDER BY created_at ASC 
    LIMIT 1
);
