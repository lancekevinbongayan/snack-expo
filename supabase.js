import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual keys from the Supabase dashboard
//  HOW IT SHOULD LOOK (Fixed)
const supabaseUrl = 'https://rjvcwvkbzlunoakdnqxq.supabase.co';

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc29iY2lkX0BhYmFmZzZlSInJlZGl6InJqdmN3dmtiemx1bm9ha2RucXF4IiwiYm9zZSI6ImFub255bW91cyIsInNleHRpbmV4MWJmOWhaMlJ1YXhXaIiwicm9sZSI6ImFub255bW91cyIsImF0IjE3Nzg0NDI3MjkzMjkzImV4cCI6M_cI6MjA5NDQxODcyOX0.DXlE-02VaCqRYX56-GKq_1nXE0tf8o6B3UzT_E7uaeo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});