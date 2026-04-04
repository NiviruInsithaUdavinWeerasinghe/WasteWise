const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dellh4wkq';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'wisewaste_preset';

/**
 * Uploads a file to Cloudinary.
 * @param {File} file - The file to upload.
 * @returns {Promise<Object>} An object containing secure_url, resource_type, original_filename, and format.
 */
export const uploadFileToCloudinary = async (file) => {
  if (!file) throw new Error('No file provided');

  const formData = new FormData();
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('file', file);

  // Determine resource type dynamically
  const resourceType = file.type.startsWith('video/') ? 'video' : 'image';

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to upload to Cloudinary');
    }

    const data = await response.json();
    return {
      secure_url: data.secure_url,
      resource_type: data.resource_type,
      original_filename: data.original_filename,
      format: data.format,
    };
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw error;
  }
};

/**
 * Helper to get an optimized thumbnail URL from standard Cloudinary secure URL.
 * It injects transformation parameters and handles format conversion (e.g., pdf -> jpg).
 * @param {string} url - The original secure URL from Cloudinary.
 * @returns {string} The optimized URL.
 */
export const getOptimizedUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  
  // If it's already an optimized or non-cloudinary URL, return as-is
  if (!url.includes('res.cloudinary.com') || url.includes('/upload/w_')) {
    return url;
  }

  // Find the insertion point after '/upload/'
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;

  // Transformations to apply: width 600, automatic quality, automatic format
  const transformations = 'w_600,q_auto,f_auto';
  
  let optimizedUrl = `${url.substring(0, uploadIndex + 8)}${transformations}/${url.substring(uploadIndex + 8)}`;

  // Automatically convert docs/videos to an image thumbnail preview
  optimizedUrl = optimizedUrl.replace(/\.(pdf|mp4)$/i, '.jpg');

  return optimizedUrl;
};
