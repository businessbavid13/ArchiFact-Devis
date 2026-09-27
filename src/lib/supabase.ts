import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ucczmfctomfymfjcwozb.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjY3ptZmN0b21meW1mamN3b3piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMzE3MDAsImV4cCI6MjEwNTkwNzcwMH0.l3B3Eg26mB8-7Cz0LnaDQxsJaLFswyaW3KfI4bhHYnY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
