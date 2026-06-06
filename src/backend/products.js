import { supabase } from '../lib/supabase';

/**
 * Fetch all products
 */
export const fetchProducts = async () => {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('products')
    .select('*');
  
  if (error) throw error;
  return data;
};

/**
 * Fetch a single product by ID
 */
export const fetchProductById = async (productId) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Fetch products by category
 */
export const fetchProductsByCategory = async (category) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', category);
    
  if (error) throw error;
  return data;
};
