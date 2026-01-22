CREATE OR REPLACE FUNCTION record_stock_movement(
  p_product_id UUID,
  p_movement_type VARCHAR,
  p_quantity INTEGER,
  p_reference VARCHAR DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_current_stock INTEGER;
  v_new_stock INTEGER;
  v_movement_id UUID;
BEGIN
  -- Get current stock and lock the row
  SELECT current_stock INTO v_current_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF v_current_stock IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- Calculate new stock
  IF p_movement_type = 'entree' THEN
    v_new_stock := v_current_stock + p_quantity;
  ELSIF p_movement_type = 'sortie' THEN
    IF v_current_stock < p_quantity THEN
      RAISE EXCEPTION 'Insufficient stock';
    END IF;
    v_new_stock := v_current_stock - p_quantity;
  ELSE
    RAISE EXCEPTION 'Invalid movement type';
  END IF;

  -- Update product stock
  UPDATE products
  SET current_stock = v_new_stock,
      updated_at = NOW()
  WHERE id = p_product_id;

  -- Insert movement record
  INSERT INTO stock_movements (
    product_id,
    user_id,
    movement_type,
    quantity,
    quantity_before,
    quantity_after,
    reference,
    notes
  ) VALUES (
    p_product_id,
    auth.uid(),
    p_movement_type,
    p_quantity,
    v_current_stock,
    v_new_stock,
    p_reference,
    p_notes
  ) RETURNING id INTO v_movement_id;

  RETURN v_movement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION record_stock_movement TO authenticated;
