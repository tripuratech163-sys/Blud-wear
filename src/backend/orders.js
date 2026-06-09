import { supabase } from '../lib/supabase';
import { clearCart } from './cart';

/**
 * Fetch all orders for a specific user
 */
export const getUserOrders = async (userId) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        quantity,
        price_at_time,
        color,
        size,
        products (
          id,
          name,
          image,
          images
        )
      )
    `)
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
    price_at_time: item.products.price, // Snapshots the price
    color: item.color || null,
    size: item.size || null
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

/**
 * Helper to restock items when an order is cancelled or returned
 */
export const restockOrderItems = async (orderItems) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  if (!orderItems || orderItems.length === 0) return;

  for (const item of orderItems) {
    const productId = item.product_id;
    const quantity = Number(item.quantity) || 0;

    // Fetch product stock and variants
    const { data: product, error } = await supabase
      .from('products')
      .select('stock, variants')
      .eq('id', productId)
      .single();

    if (error || !product) {
      console.error(`Failed to fetch product ${productId} for restocking:`, error);
      continue;
    }

    if (item.color || item.size) {
      // Restock variant
      let variants = Array.isArray(product.variants) ? product.variants : [];
      let updated = false;
      variants = variants.map(v => {
        const colorMatch = !item.color || String(v.color || '').trim().toLowerCase() === String(item.color).trim().toLowerCase();
        const sizeMatch = !item.size || String(v.size || '').trim().toLowerCase() === String(item.size).trim().toLowerCase();
        if (colorMatch && sizeMatch) {
          updated = true;
          return { ...v, stock: (Number(v.stock) || 0) + quantity };
        }
        return v;
      });

      if (updated) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ variants })
          .eq('id', productId);
        if (updateError) console.error(`Failed to update variants for product ${productId}:`, updateError);
      } else {
        // Fallback to base stock if variant was not found
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: (Number(product.stock) || 0) + quantity })
          .eq('id', productId);
        if (updateError) console.error(`Failed to update base stock for product ${productId}:`, updateError);
      }
    } else {
      // Restock base stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: (Number(product.stock) || 0) + quantity })
        .eq('id', productId);
      if (updateError) console.error(`Failed to update base stock for product ${productId}:`, updateError);
    }
  }
};

/**
 * Helper to deduct items from stock when an order is placed
 */
export const deductOrderItems = async (orderItems) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  if (!orderItems || orderItems.length === 0) return;

  for (const item of orderItems) {
    const productId = item.product_id;
    const quantity = Number(item.quantity) || 0;

    // Fetch product stock and variants
    const { data: product, error } = await supabase
      .from('products')
      .select('stock, variants')
      .eq('id', productId)
      .single();

    if (error || !product) {
      console.error(`Failed to fetch product ${productId} for deduction:`, error);
      continue;
    }

    if (item.color || item.size) {
      // Deduct variant stock
      let variants = Array.isArray(product.variants) ? product.variants : [];
      let updated = false;
      variants = variants.map(v => {
        const colorMatch = !item.color || String(v.color || '').trim().toLowerCase() === String(item.color).trim().toLowerCase();
        const sizeMatch = !item.size || String(v.size || '').trim().toLowerCase() === String(item.size).trim().toLowerCase();
        if (colorMatch && sizeMatch) {
          updated = true;
          return { ...v, stock: Math.max(0, (Number(v.stock) || 0) - quantity) };
        }
        return v;
      });

      if (updated) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ variants })
          .eq('id', productId);
        if (updateError) console.error(`Failed to update variants for product ${productId}:`, updateError);
      } else {
        // Fallback to base stock if variant was not found
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: Math.max(0, (Number(product.stock) || 0) - quantity) })
          .eq('id', productId);
        if (updateError) console.error(`Failed to update base stock for product ${productId}:`, updateError);
      }
    } else {
      // Deduct base stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: Math.max(0, (Number(product.stock) || 0) - quantity) })
        .eq('id', productId);
      if (updateError) console.error(`Failed to update base stock for product ${productId}:`, updateError);
    }
  }
};

/**
 * Cancel a user order and restock items
 */
export const cancelUserOrder = async (orderId, orderItems, isPaid) => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase
    .from('orders')
    .update({
      status: 'Cancelled',
      payment_status: isPaid ? 'Refund Pending' : 'N/A'
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;

  // Restock inventory
  try {
    await restockOrderItems(orderItems);
  } catch (err) {
    console.error("Restocking failed:", err);
  }

  return data;
};

/**
 * File a return request for an order
 */
export const requestOrderReturn = async (orderId, reason, details) => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase
    .from('orders')
    .update({
      status: 'Return Requested',
      return_reason: reason,
      return_details: details
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
