import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://tyizjfbijbjdpuywxdlc.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5aXpqZmJpamJqZHB1eXd4ZGxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMzY5NDEsImV4cCI6MjEwNTkxMjk0MX0.j19xlHLCwg_lCE7z9MWdZ7qMylNdEounsO1fmYNBLfo';

export const supabase = createClient(supabaseUrl, supabaseKey);
