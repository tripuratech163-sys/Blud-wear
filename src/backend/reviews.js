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

/**
 * Fetch top-rated reviews to use as site-wide testimonials
 */
export const fetchTopReviews = async (limit = 3) => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase
    .from('product_reviews')
    .select(`
      id,
      name,
      rating,
      title,
      body,
      created_at,
      products (
        name
      )
    `)
    .gte('rating', 4)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

/**
 * Delete a product review (restricted to admin via RLS)
 */
export const deleteProductReview = async (reviewId) => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { error } = await supabase
    .from('product_reviews')
    .delete()
    .eq('id', reviewId);

  if (error) throw error;
  return true;
};
