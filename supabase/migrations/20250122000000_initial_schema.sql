-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs (users)
-- Modified to integrate with Supabase Auth: id references auth.users, removed encrypted_password
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    -- encrypted_password VARCHAR(255) NOT NULL, -- Managed by Supabase Auth
    role VARCHAR(20) DEFAULT 'volunteer' CHECK (role IN ('volunteer', 'admin')),
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Table des produits (products)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit VARCHAR(50) DEFAULT 'boîte' CHECK (unit IN ('boîte', 'carton', 'kg', 'litre')),
    boxes_per_carton INTEGER DEFAULT 1 CHECK (boxes_per_carton > 0),
    current_stock INTEGER DEFAULT 0 CHECK (current_stock >= 0),
    alert_threshold INTEGER DEFAULT 10 CHECK (alert_threshold >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(current_stock);

-- Table des mouvements de stock (stock_movements)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    user_id UUID NOT NULL REFERENCES users(id),
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('entree', 'sortie')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user ON stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON users;
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" ON users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Les administrateurs peuvent voir tous les utilisateurs" ON users;
CREATE POLICY "Les administrateurs peuvent voir tous les utilisateurs" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Products policies
DROP POLICY IF EXISTS "Tous les utilisateurs authentifiés peuvent lire les produits" ON products;
CREATE POLICY "Tous les utilisateurs authentifiés peuvent lire les produits" ON products
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Les administrateurs peuvent gérer les produits" ON products;
CREATE POLICY "Les administrateurs peuvent gérer les produits" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Stock movements policies
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des mouvements" ON stock_movements;
CREATE POLICY "Les utilisateurs peuvent créer des mouvements" ON stock_movements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les utilisateurs peuvent voir les mouvements" ON stock_movements;
CREATE POLICY "Les utilisateurs peuvent voir les mouvements" ON stock_movements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Grants
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON products TO authenticated;
GRANT ALL ON stock_movements TO authenticated;

-- Grant permissions for admin to manage products
GRANT INSERT, UPDATE, DELETE ON products TO authenticated;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', new.email), COALESCE(new.raw_user_meta_data->>'role', 'volunteer'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Ensure permissions are set for anon and authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
