import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// We grab the keys you just pasted into your .env file
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// This exports the 'supabase' object so we can use it anywhere in the app to get/set data!
export const supabase = createClient(supabaseUrl, supabaseAnonKey);