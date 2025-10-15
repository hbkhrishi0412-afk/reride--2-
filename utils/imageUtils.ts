/**
 * Image utility functions for handling image sources and validation
 */

const DEFAULT_PLACEHOLDER = 'https://via.placeholder.com/800x600/E5E7EB/4B5563?text=ReRide';

/**
 * Validates and returns a safe image source
 * @param src - The image source to validate
 * @param fallback - Optional fallback image source
 * @returns A valid image source or fallback
 */
export const getSafeImageSrc = (src: string | undefined | null, fallback?: string): string => {
  // Check if src is empty, null, or undefined
  if (!src || src.trim() === '') {
    return fallback || DEFAULT_PLACEHOLDER;
  }
  
  // Check if src is a valid URL or data URI
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src;
  }
  
  // If it's a relative path, make it absolute
  if (src.startsWith('/')) {
    return src;
  }
  
  // Default fallback for invalid sources
  return fallback || DEFAULT_PLACEHOLDER;
};

/**
 * Validates an array of image sources and returns only valid ones
 * @param images - Array of image sources
 * @returns Array of valid image sources
 */
export const getValidImages = (images: string[]): string[] => {
  if (!Array.isArray(images)) {
    return [DEFAULT_PLACEHOLDER];
  }
  
  const validImages = images
    .filter(img => img && img.trim() !== '')
    .map(img => getSafeImageSrc(img));
  
  // Return at least one placeholder if no valid images
  return validImages.length > 0 ? validImages : [DEFAULT_PLACEHOLDER];
};

/**
 * Gets the first valid image from an array
 * @param images - Array of image sources
 * @returns First valid image source or placeholder
 */
export const getFirstValidImage = (images: string[]): string => {
  const validImages = getValidImages(images);
  return validImages[0];
};

