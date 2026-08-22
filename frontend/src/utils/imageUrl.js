/**
 * Resolves static image URLs correctly across development and production.
 * Strips trailing /api if present on VITE_API_URL so /uploads/... resolves directly against backend server.
 */
export const getImageUrl = (imagePath, fallback = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3') => {
  if (!imagePath) return fallback;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }

  const rawApiUrl = import.meta.env.VITE_API_URL || '';
  const serverBaseUrl = rawApiUrl.replace(/\/api\/?$/, '');
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

  return `${serverBaseUrl}${cleanPath}`;
};

export default getImageUrl;
