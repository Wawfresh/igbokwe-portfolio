import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://tyizjfbijbjdpuywxdlc.supabase.co';
const SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5aXpqZmJpamJqZHB1eXd4ZGxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMzY5NDEsImV4cCI6MjEwNTkxMjk0MX0.j19xlHLCwg_lCE7z9MWdZ7qMylNdEounsO1fmYNBLfo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Uploads a file directly to Supabase Storage.
 * Defaults to 'images' bucket, or falls back to 'portfolio' or creates public object URL.
 */
export async function uploadToSupabaseStorage(
  file: File,
  bucketName: string = 'images'
): Promise<{ url: string; filename: string }> {
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
  const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanName}`;
  const filePath = `uploads/${uniqueFilename}`;

  // Attempt upload to primary bucket
  const { data, error } = await supabase.storage.from(bucketName).upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) {
    // If bucket doesn't exist, try 'portfolio' bucket
    if (bucketName !== 'portfolio') {
      const fallback = await supabase.storage.from('portfolio').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
      if (!fallback.error) {
        const { data: publicUrlData } = supabase.storage.from('portfolio').getPublicUrl(filePath);
        return {
          url: publicUrlData.publicUrl,
          filename: uniqueFilename,
        };
      }
    }
    throw error;
  }

  const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(data?.path || filePath);

  return {
    url: publicUrlData.publicUrl,
    filename: uniqueFilename,
  };
}
