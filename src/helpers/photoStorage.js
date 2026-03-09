import { supabase } from '../supabase.js';

/**
 * Upload a photo to Supabase Storage
 * @param {string} projectId - Project identifier
 * @param {string} photoId - Unique photo identifier
 * @param {string} base64Data - Base64 encoded image data
 * @param {object} metadata - Optional metadata (author, timestamp, etc)
 * @returns {Promise<{url: string, path: string, error: null|Error}>}
 */
export async function uploadPhoto(projectId, photoId, base64Data, metadata = {}) {
  try {
    // Convert base64 to blob
    const base64String = base64Data.includes('base64,')
      ? base64Data.split('base64,')[1]
      : base64Data;

    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileName = `${photoId}-${timestamp}.jpg`;
    const path = `${projectId}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('project-photos')
      .upload(path, blob, {
        cacheControl: '3600',
        upsert: false,
        metadata: {
          projectId,
          photoId,
          uploadedAt: new Date().toISOString(),
          ...metadata
        }
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('project-photos')
      .getPublicUrl(path);

    return {
      url: publicUrlData.publicUrl,
      path: path,
      error: null
    };
  } catch (error) {
    console.error('Photo upload failed:', error);
    return {
      url: null,
      path: null,
      error: error
    };
  }
}

/**
 * Get public URL for a stored photo
 * @param {string} path - Storage path to the photo
 * @returns {string} Public URL
 */
export async function getPhotoUrl(path) {
  try {
    const { data } = supabase.storage
      .from('project-photos')
      .getPublicUrl(path);

    return data.publicUrl;
  } catch (error) {
    console.error('Failed to get photo URL:', error);
    return null;
  }
}

/**
 * Delete a photo from Supabase Storage
 * @param {string|string[]} path - Storage path(s) to delete
 * @returns {Promise<{success: boolean, error: null|Error}>}
 */
export async function deletePhoto(path) {
  try {
    const paths = Array.isArray(path) ? path : [path];

    const { error } = await supabase.storage
      .from('project-photos')
      .remove(paths);

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Photo deletion failed:', error);
    return { success: false, error: error };
  }
}

/**
 * Migrate a project's photos from base64 to Supabase Storage
 * Handles both array format [{d: base64, at: timestamp, by: user}] and single object format
 * @param {string} projectId - Project identifier
 * @param {object|array} photos - Photos object/array to migrate
 * @returns {Promise<object>} Updated photos object with URLs instead of base64
 */
export async function migrateProjectPhotos(projectId, photos) {
  try {
    if (!photos || Object.keys(photos).length === 0) {
      return photos;
    }

    const migratedPhotos = {};
    const failedPhotos = [];

    // Iterate through all photos
    for (const [photoId, photoData] of Object.entries(photos)) {
      // Skip if already migrated (is a URL)
      if (isPhotoUrl(photoData) || (typeof photoData === 'object' && isPhotoUrl(photoData.d))) {
        migratedPhotos[photoId] = photoData;
        continue;
      }

      // Extract base64 data
      let base64Data;
      let metadata = {};

      if (typeof photoData === 'string') {
        // Simple format: just base64
        base64Data = photoData;
      } else if (photoData && typeof photoData === 'object') {
        // Array format: {d: base64, at: timestamp, by: user}
        base64Data = photoData.d;
        metadata = {
          uploadedAt: photoData.at,
          uploadedBy: photoData.by
        };
      } else {
        failedPhotos.push(photoId);
        continue;
      }

      // Upload to storage
      const result = await uploadPhoto(projectId, photoId, base64Data, metadata);

      if (result.error) {
        console.error(`Failed to migrate photo ${photoId}:`, result.error);
        failedPhotos.push(photoId);
        migratedPhotos[photoId] = photoData; // Keep original
      } else {
        // Store URL and metadata instead of base64
        if (typeof photoData === 'object' && !Array.isArray(photoData)) {
          // Preserve array format but replace base64 with URL
          migratedPhotos[photoId] = {
            ...photoData,
            d: result.url,
            path: result.path
          };
        } else {
          // Simple string format
          migratedPhotos[photoId] = result.url;
        }
      }
    }

    if (failedPhotos.length > 0) {
      console.warn(`Failed to migrate ${failedPhotos.length} photos:`, failedPhotos);
    }

    return migratedPhotos;
  } catch (error) {
    console.error('Photo migration failed:', error);
    return photos; // Return original if migration fails
  }
}

/**
 * Compress an image file before upload
 * @param {File} file - Image file to compress
 * @param {number} maxWidth - Maximum width in pixels (default: 1600)
 * @param {number} quality - JPEG quality 0-1 (default: 0.7)
 * @returns {Promise<string>} Base64 encoded compressed image
 */
export function compressImage(file, maxWidth = 1600, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with quality compression
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = event.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Check if a photo value is a URL (migrated) or base64 (legacy)
 * @param {string|object} photoData - Photo data to check
 * @returns {boolean} True if it's a URL, false if it's base64
 */
export function isPhotoUrl(photoData) {
  if (!photoData) return false;

  // Handle string case
  if (typeof photoData === 'string') {
    return photoData.startsWith('http://') ||
           photoData.startsWith('https://') ||
           photoData.startsWith('/');
  }

  // Handle object case with .d property
  if (typeof photoData === 'object' && photoData.d) {
    return typeof photoData.d === 'string' &&
           (photoData.d.startsWith('http://') ||
            photoData.d.startsWith('https://') ||
            photoData.d.startsWith('/'));
  }

  return false;
}
