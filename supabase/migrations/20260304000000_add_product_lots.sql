-- Create product_lots table
CREATE TABLE IF NOT EXISTS public.product_lots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    lot_number VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT product_lots_product_id_lot_number_key UNIQUE (product_id, lot_number)
);

-- Enable RLS
ALTER TABLE public.product_lots ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for authenticated users" ON public.product_lots
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.product_lots
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON public.product_lots
    FOR DELETE
    TO authenticated
    USING (true);

-- Grant permissions
GRANT ALL ON public.product_lots TO authenticated;
GRANT ALL ON public.product_lots TO service_role;
