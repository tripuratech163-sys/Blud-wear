import { supabase } from '../lib/supabase';

// ==========================================
// Admin Products
// ==========================================

export const adminFetchProducts = async () => {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const adminFetchProductsList = async () => {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, category, gender, gsm, image, is_featured, created_at')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const adminFetchProductById = async (productId) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();
  
  if (error) throw error;
  return data;
};

export const adminCreateProduct = async (productData) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const adminUpdateProduct = async (productId, updates) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const adminDeleteProduct = async (productId) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) throw error;
  return true;
};

export const adminToggleFeaturedProduct = async (productId, isFeatured) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('products')
    .update({ is_featured: isFeatured })
    .eq('id', productId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ==========================================
// Admin Orders
// ==========================================

export const adminFetchOrders = async () => {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  // We'll fetch orders, and potentially join order_items if needed, 
  // but for a simple list, just the orders table is fine.
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(id, name))')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};

export const adminFetchDashboardStats = async () => {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  const [productsRes, ordersRes] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('total_amount')
  ]);
  
  if (productsRes.error) throw productsRes.error;
  if (ordersRes.error) throw ordersRes.error;
  
  const productsCount = productsRes.count || 0;
  const ordersCount = ordersRes.data?.length || 0;
  const revenue = (ordersRes.data || []).reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  
  return {
    productsCount,
    ordersCount,
    revenue
  };
};

export const adminUpdateOrderStatus = async (orderId, newStatus) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const adminBookShiprocket = async (orderId, weight, length, width, height) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/book-shiprocket-shipment`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        order_id: orderId,
        weight,
        dimensions: { length, width, height }
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to book Shiprocket shipment");
  }

  return response.json();
};
