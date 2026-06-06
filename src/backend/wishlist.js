import { supabase } from '../lib/supabase';

/**
 * Fetch the user's wishlist
 */
export const getWishlist = async (userId) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('wishlist')
    .select(`
      id,
      products (
        id,
        name,
        price,
        image
      )
    `)
    .eq('user_id', userId);
    
  if (error) throw error;
  return data;
};

/**
 * Toggle a product in the wishlist (adds if missing, removes if present)
 */
export const toggleWishlist = async (userId, productId) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  // Check if it exists
  const { data: existing } = await supabase
    .from('wishlist')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single();

  if (existing) {
    // Remove it
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
    return { added: false };
  } else {
    // Add it
    const { error } = await supabase
      .from('wishlist')
      .insert([
        { user_id: userId, product_id: productId }
      ]);
    if (error) throw error;
    return { added: true };
  }
};
