/**
 * Client-side image compression utility
 * Compresses images to max 1MB using canvas resize + quality reduction
 */

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const MIN_QUALITY = 0.3;
const MAX_DIMENSION = 1920; // max width or height

interface CompressionResult {
  dataUrl: string;
  blob: Blob;
  sizeBytes: number;
  originalSizeBytes: number;
  compressionRatio: number;
}

/**
 * Compress an image file to be under MAX_FILE_SIZE
 * Uses progressive quality reduction and resizing
 */
export async function compressImage(file: File): Promise<CompressionResult> {
  const originalSizeBytes = file.size;

  // Load image into an HTMLImageElement
  const img = await loadImage(file);

  // Step 1: Try original dimensions with progressive quality reduction
  let quality = 0.85;
  let width = img.naturalWidth;
  let height = img.naturalHeight;
  let result = await compressToCanvas(img, width, height, quality);

  // If still too large, progressively reduce quality
  while (result.sizeBytes > MAX_FILE_SIZE && quality > MIN_QUALITY) {
    quality -= 0.1;
    result = await compressToCanvas(img, width, height, quality);
  }

  // If still too large, resize dimensions
  if (result.sizeBytes > MAX_FILE_SIZE) {
    // Resize: try reducing to 75%, then 50%, then 33%
    const scaleFactors = [0.75, 0.5, 0.33];
    for (const scale of scaleFactors) {
      width = Math.round(img.naturalWidth * scale);
      height = Math.round(img.naturalHeight * scale);
      quality = 0.8;

      result = await compressToCanvas(img, width, height, quality);

      while (result.sizeBytes > MAX_FILE_SIZE && quality > MIN_QUALITY) {
        quality -= 0.1;
        result = await compressToCanvas(img, width, height, quality);
      }

      if (result.sizeBytes <= MAX_FILE_SIZE) break;
    }
  }

  // Final fallback: force small dimensions
  if (result.sizeBytes > MAX_FILE_SIZE) {
    width = Math.min(img.naturalWidth, 800);
    height = Math.round((width / img.naturalWidth) * img.naturalHeight);
    result = await compressToCanvas(img, width, height, 0.5);
  }

  return {
    ...result,
    originalSizeBytes,
    compressionRatio: result.sizeBytes / originalSizeBytes,
  };
}

/**
 * Load a File into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/**
 * Compress image to canvas with given dimensions and quality
 */
function compressToCanvas(
  img: HTMLImageElement,
  width: number,
  height: number,
  quality: number
): Promise<CompressionResult> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Use high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw the image at the target size
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to JPEG blob
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          // Fallback: return data URL as-is
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const base64 = dataUrl.split(',')[1];
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const fallbackBlob = new Blob([bytes], { type: 'image/jpeg' });
          resolve({
            dataUrl,
            blob: fallbackBlob,
            sizeBytes: fallbackBlob.size,
            originalSizeBytes: 0,
            compressionRatio: 1,
          });
          return;
        }

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({
          dataUrl,
          blob,
          sizeBytes: blob.size,
          originalSizeBytes: 0,
          compressionRatio: 1,
        });
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Format bytes to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
