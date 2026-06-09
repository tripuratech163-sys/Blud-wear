import { supabase } from '../lib/supabase';

/**
 * Fetch the user's current cart items
 */
export const getCart = async (userId) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('cart')
    .select(`
      id,
      quantity,
      color,
      size,
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
 * Add an item to the cart
 */
export const addToCart = async (userId, productId, quantity = 1, color = null, size = null) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  // First check if it already exists with same color and size
  let query = supabase
    .from('cart')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', productId);
    
  if (color) query = query.eq('color', color);
  else query = query.is('color', null);
  
  if (size) query = query.eq('size', size);
  else query = query.is('size', null);

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    // Update quantity
    const { data, error } = await supabase
      .from('cart')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id)
      .select();
    if (error) throw error;
    return data;
  } else {
    // Insert new row
    const { data, error } = await supabase
      .from('cart')
      .insert([
        { user_id: userId, product_id: productId, quantity, color, size }
      ])
      .select();
    if (error) throw error;
    return data;
  }
};

/**
 * Remove an item from the cart entirely
 */
export const removeFromCart = async (cartItemId) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase
    .from('cart')
    .delete()
    .eq('id', cartItemId);
    
  if (error) throw error;
  return true;
};

/**
 * Clear the entire cart for a user (useful after checkout)
 */
export const clearCart = async (userId) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase
    .from('cart')
    .delete()
    .eq('user_id', userId);
    
  if (error) throw error;
  return true;
};
