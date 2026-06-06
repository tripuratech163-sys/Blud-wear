import { supabase } from '../lib/supabase';
import { clearCart } from './cart';

/**
 * Fetch all orders for a specific user
 */
export const getUserOrders = async (userId) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};

/**
 * Create a new order from the user's cart
 * Note: In a real production app, this would be tied to a Stripe webhook or Edge Function
 * for security, but this handles the database creation.
 */
export const createOrder = async (userId, items, totalAmount, shippingAddress) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  // 1. Create the order record
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([
      { 
        user_id: userId, 
        total_amount: totalAmount,
        shipping_address: shippingAddress,
        status: 'pending'
      }
    ])
    .select()
    .single();

  if (orderError) throw orderError;

  // 2. Format the items for the order_items table
  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.products.id,
    quantity: item.quantity,
    price_at_time: item.products.price // Snapshots the price
  }));

  // 3. Insert the items
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) throw itemsError;

  // 4. Clear the cart
  await clearCart(userId);

  return order;
};
