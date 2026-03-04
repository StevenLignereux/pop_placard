import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Product, ProductLot } from '../lib/types';

export type ProductFilters = {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
  sortBy?: keyof Product;
  sortOrder?: 'asc' | 'desc';
};

export type ProductsResponse = {
  data: Product[];
  count: number;
};

// Fetch products with server-side filtering and pagination
const fetchProducts = async (filters: ProductFilters): Promise<ProductsResponse> => {
  const {
    search = '',
    page = 1,
    pageSize = 10,
    sortBy = 'name',
    sortOrder = 'asc'
  } = filters;

  let query = supabase
    .from('products')
    .select('*, lots:product_lots(*)', { count: 'exact' })
    .eq('is_active', true);

  // Apply search filter
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    data: data as Product[],
    count: count || 0,
  };
};

export const useProducts = (filters: ProductFilters = {}) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new
    staleTime: 1000 * 60, // 1 minute
  });
};

// Hook for infinite scrolling (used in select inputs)
export const useInfiniteProducts = (search: string) => {
  return useQuery({
    queryKey: ['products', 'infinite', search],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, unit, boxes_per_carton, current_stock')
        .eq('is_active', true)
        .ilike('name', `%${search}%`)
        .order('name')
        .limit(20);

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: (previousData) => previousData,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newProduct: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false }) // Soft delete
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useCreateProductLot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newLot: Omit<ProductLot, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('product_lots')
        .insert([newLot])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteProductLot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_lots')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
