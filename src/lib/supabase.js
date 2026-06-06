import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create the Supabase client if the keys are provided
// If not, it will be null to prevent crashing while the user sets up their keys.
export const supabase = (supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL_HERE') 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
