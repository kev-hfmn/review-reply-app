import { supabase } from '@/utils/supabase';

/**
 * Converts a relative image path to a full Supabase storage URL
 * @param imagePath - Relative path like "images/filename.jpg"
 * @returns Full Supabase storage URL or null if invalid path
 */
export function getSupabaseImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  
  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  // Check if it's already a full URL
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }
  
  // For paths like "images/filename.jpg", extract the filename
  let fileName: string;
  if (cleanPath.startsWith('images/')) {
    fileName = cleanPath.replace('images/', '');
  } else {
    fileName = cleanPath;
  }
  
  // Get the public URL from Supabase storage
  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(fileName);
    
  return data.publicUrl;
}

/**
 * Transforms HTML content to replace relative image paths with Supabase storage URLs
 * @param htmlContent - HTML content containing img tags
 * @returns HTML content with transformed image URLs
 */
export function transformImageUrlsInContent(htmlContent: string): string {
  if (!htmlContent) return htmlContent;
  
  // Replace img src attributes that contain relative image paths
  return htmlContent.replace(
    /<img([^>]+)src=["']([^"']+)["']([^>]*)>/gi,
    (match, beforeSrc, srcValue, afterSrc) => {
      const transformedUrl = getSupabaseImageUrl(srcValue);
      if (transformedUrl && transformedUrl !== srcValue) {
        return `<img${beforeSrc}src="${transformedUrl}"${afterSrc}>`;
      }
      return match;
    }
  );
}