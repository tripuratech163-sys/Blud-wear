import { supabase } from '../lib/supabase';

/**
 * Fetch all reviews for a specific product
 */
export const fetchProductReviews = async (productId) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  const { data, error } = await supabase
    .from('product_reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Add a new product review
 */
export const createProductReview = async (productId, name, email, rating, title, body) => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase
    .from('product_reviews')
    .insert([
      {
        product_id: productId,
        name,
        email,
        rating,
        title,
        body
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};
