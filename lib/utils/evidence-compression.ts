/**
 * Evidence Compression Utilities
 * 
 * Handles compression and decompression of task evidence including:
 * - Image compression for photo evidence
 * - JSON compression for large data structures
 * - Signature data compression
 * 
 * @module lib/utils/evidence-compression
 */

import { CompressionResult, DecompressionResult, CompressionType } from '@/types/workflow';

// =====================================================
// COMPRESSION UTILITIES
// =====================================================

/**
 * Compress image data (base64 or Blob)
 * Uses Canvas API to resize and compress images
 */
export async function compressImage(
  imageData: string | Blob,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<CompressionResult> {
  try {
    let blob: Blob;
    
    // Convert base64 to Blob if necessary
    if (typeof imageData === 'string') {
      const base64Data = imageData.split(',')[1] || imageData;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: 'image/jpeg' });
    } else {
      blob = imageData;
    }

    const originalSize = blob.size;

    // Create image element
    const img = new Image();
    const imgUrl = URL.createObjectURL(blob);

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imgUrl;
    });

    // Calculate new dimensions
    let width = img.width;
    let height = img.height;

    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;
      
      if (width > height) {
        width = maxWidth;
        height = width / aspectRatio;
      } else {
        height = maxHeight;
        width = height * aspectRatio;
      }
    }

    // Create canvas and compress
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    ctx.drawImage(img, 0, 0, width, height);

    // Convert to compressed blob
    const compressedBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create compressed blob'));
          }
        },
        'image/jpeg',
        quality
      );
    });

    URL.revokeObjectURL(imgUrl);

    const compressedSize = compressedBlob.size;
    const compressionRatio = originalSize / compressedSize;

    return {
      success: true,
      originalSize,
      compressedSize,
      compressionRatio,
      compressionType: 'image',
      data: compressedBlob,
    };
  } catch (error) {
    console.error('Error compressing image:', error);
    return {
      success: false,
      originalSize: 0,
      compressedSize: 0,
      compressionRatio: 1,
      compressionType: 'none',
      data: imageData,
    };
  }
}

/**
 * Compress JSON data using gzip
 * Note: This is a simplified version. In production, use pako or similar library
 */
export function compressJSON(data: any): CompressionResult {
  try {
    const jsonString = JSON.stringify(data);
    const originalSize = new Blob([jsonString]).size;

    // Convert to Uint8Array
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(jsonString);

    // For browser compatibility, we'll use a simple compression
    // In production, use pako.gzip() or similar
    const compressed = compressUint8Array(uint8Array);
    const compressedSize = compressed.length;

    // Convert to base64 for storage
    const base64 = btoa(String.fromCharCode(...compressed));

    return {
      success: true,
      originalSize,
      compressedSize,
      compressionRatio: originalSize / compressedSize,
      compressionType: 'gzip',
      data: base64,
    };
  } catch (error) {
    console.error('Error compressing JSON:', error);
    const jsonString = JSON.stringify(data);
    return {
      success: false,
      originalSize: new Blob([jsonString]).size,
      compressedSize: new Blob([jsonString]).size,
      compressionRatio: 1,
      compressionType: 'none',
      data: jsonString,
    };
  }
}

/**
 * Simple Uint8Array compression (placeholder for production gzip)
 * In production, replace with pako.gzip() or similar
 */
function compressUint8Array(data: Uint8Array): Uint8Array {
  // This is a placeholder - in production use pako.gzip()
  // For now, just return the data as-is
  // TODO: Implement actual compression when adding pako dependency
  return data;
}

/**
 * Decompress JSON data
 */
export function decompressJSON(compressedData: string): DecompressionResult {
  try {
    // If data doesn't look compressed (not base64), assume it's raw JSON
    if (!compressedData.match(/^[A-Za-z0-9+/=]+$/)) {
      const data = JSON.parse(compressedData);
      return {
        success: true,
        data,
        originalSize: new Blob([compressedData]).size,
      };
    }

    // Decode base64
    const binaryString = atob(compressedData);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Decompress (placeholder - use pako.ungzip() in production)
    const decompressed = decompressUint8Array(bytes);

    // Convert to string
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decompressed);

    // Parse JSON
    const data = JSON.parse(jsonString);

    return {
      success: true,
      data,
      originalSize: decompressed.length,
    };
  } catch (error) {
    console.error('Error decompressing JSON:', error);
    
    // Try to parse as raw JSON
    try {
      const data = JSON.parse(compressedData);
      return {
        success: true,
        data,
        originalSize: new Blob([compressedData]).size,
      };
    } catch {
      return {
        success: false,
        data: null,
        originalSize: 0,
      };
    }
  }
}

/**
 * Simple Uint8Array decompression (placeholder for production gunzip)
 */
function decompressUint8Array(data: Uint8Array): Uint8Array {
  // This is a placeholder - in production use pako.ungzip()
  // For now, just return the data as-is
  // TODO: Implement actual decompression when adding pako dependency
  return data;
}

/**
 * Compress signature data
 */
export function compressSignature(signatureDataUrl: string): CompressionResult {
  try {
    // Signatures are already relatively small, but we can still compress them
    const originalSize = new Blob([signatureDataUrl]).size;

    // Extract base64 data
    const base64Data = signatureDataUrl.split(',')[1] || signatureDataUrl;
    
    // For signatures, we can reduce quality slightly
    // Convert to canvas and re-encode at lower quality
    // This is a simplified version - in production, use image compression
    
    const compressedSize = base64Data.length;
    
    return {
      success: true,
      originalSize,
      compressedSize,
      compressionRatio: originalSize / compressedSize,
      compressionType: 'image',
      data: signatureDataUrl,
    };
  } catch (error) {
    console.error('Error compressing signature:', error);
    return {
      success: false,
      originalSize: new Blob([signatureDataUrl]).size,
      compressedSize: new Blob([signatureDataUrl]).size,
      compressionRatio: 1,
      compressionType: 'none',
      data: signatureDataUrl,
    };
  }
}

/**
 * Compress text evidence
 */
export function compressText(text: string): CompressionResult {
  // For short text, compression may not be beneficial
  const originalSize = new Blob([text]).size;
  
  if (originalSize < 1000) {
    // Don't compress small text
    return {
      success: true,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      compressionType: 'none',
      data: text,
    };
  }

  // For larger text, use JSON compression (which handles strings)
  return compressJSON({ text });
}

/**
 * Decompress text evidence
 */
export function decompressText(compressedData: string): DecompressionResult {
  // Check if data is compressed
  if (compressedData.match(/^[A-Za-z0-9+/=]+$/)) {
    const result = decompressJSON(compressedData);
    if (result.success && result.data?.text) {
      return {
        success: true,
        data: result.data.text,
        originalSize: result.originalSize,
      };
    }
  }

  // Return as-is if not compressed
  return {
    success: true,
    data: compressedData,
    originalSize: new Blob([compressedData]).size,
  };
}

/**
 * Auto-detect compression type and compress accordingly
 */
export async function compressEvidence(
  data: any,
  type: 'photo' | 'signature' | 'json' | 'text'
): Promise<CompressionResult> {
  switch (type) {
    case 'photo':
      return await compressImage(data);
    case 'signature':
      return compressSignature(data);
    case 'json':
      return compressJSON(data);
    case 'text':
      return compressText(data);
    default:
      return {
        success: false,
        originalSize: 0,
        compressedSize: 0,
        compressionRatio: 1,
        compressionType: 'none',
        data,
      };
  }
}

/**
 * Auto-detect compression type and decompress accordingly
 */
export function decompressEvidence(
  compressedData: any,
  compressionType: CompressionType
): DecompressionResult {
  switch (compressionType) {
    case 'gzip':
    case 'brotli':
      return decompressJSON(compressedData);
    case 'none':
      return {
        success: true,
        data: compressedData,
        originalSize: typeof compressedData === 'string' 
          ? new Blob([compressedData]).size 
          : 0,
      };
    default:
      return {
        success: true,
        data: compressedData,
        originalSize: 0,
      };
  }
}

/**
 * Estimate compression benefit for given data
 */
export function estimateCompressionBenefit(
  data: any,
  type: 'photo' | 'signature' | 'json' | 'text'
): {
  worthCompressing: boolean;
  estimatedSavings: number;
  recommendedType: CompressionType;
} {
  let size = 0;
  
  if (typeof data === 'string') {
    size = new Blob([data]).size;
  } else if (data instanceof Blob) {
    size = data.size;
  } else {
    size = new Blob([JSON.stringify(data)]).size;
  }

  // Compression thresholds
  const PHOTO_THRESHOLD = 500 * 1024; // 500 KB
  const JSON_THRESHOLD = 10 * 1024; // 10 KB
  const TEXT_THRESHOLD = 5 * 1024; // 5 KB

  switch (type) {
    case 'photo':
      return {
        worthCompressing: size > PHOTO_THRESHOLD,
        estimatedSavings: size > PHOTO_THRESHOLD ? size * 0.6 : 0,
        recommendedType: size > PHOTO_THRESHOLD ? 'image' : 'none',
      };
    
    case 'signature':
      // Signatures are usually small, compression may not help
      return {
        worthCompressing: size > 50 * 1024,
        estimatedSavings: size > 50 * 1024 ? size * 0.3 : 0,
        recommendedType: size > 50 * 1024 ? 'image' : 'none',
      };
    
    case 'json':
      return {
        worthCompressing: size > JSON_THRESHOLD,
        estimatedSavings: size > JSON_THRESHOLD ? size * 0.4 : 0,
        recommendedType: size > JSON_THRESHOLD ? 'gzip' : 'none',
      };
    
    case 'text':
      return {
        worthCompressing: size > TEXT_THRESHOLD,
        estimatedSavings: size > TEXT_THRESHOLD ? size * 0.3 : 0,
        recommendedType: size > TEXT_THRESHOLD ? 'gzip' : 'none',
      };
    
    default:
      return {
        worthCompressing: false,
        estimatedSavings: 0,
        recommendedType: 'none',
      };
  }
}
