export type UserRole = 'volunteer' | 'admin';
export type ProductUnit = 'boîte' | 'carton' | 'kg' | 'litre';
export type MovementType = 'entree' | 'sortie';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  unit: ProductUnit;
  boxes_per_carton: number;
  current_stock: number;
  alert_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  user_id: string;
  movement_type: MovementType;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  reference: string | null;
  notes: string | null;
  created_at: string;
  
  // Joined fields
  product?: Product;
  user?: User;
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'created_at' | 'updated_at'>>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>;
      };
      stock_movements: {
        Row: StockMovement;
        Insert: Omit<StockMovement, 'id' | 'created_at' | 'product' | 'user'>;
        Update: never; // Stock movements should generally not be updated after creation
      };
    };
    Functions: {
      record_stock_movement: {
        Args: {
          p_product_id: string;
          p_movement_type: string;
          p_quantity: number;
          p_reference?: string | null;
          p_notes?: string | null;
        };
        Returns: string;
      };
    };
  };
};
