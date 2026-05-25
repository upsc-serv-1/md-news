export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey: string;
}

const STORAGE_KEYS = {
  CLOUD_NAME: "samachar_cloudinary_cloud_name",
  UPLOAD_PRESET: "samachar_cloudinary_upload_preset",
  API_KEY: "samachar_cloudinary_api_key",
};

// Default API Key provided in prompt
export const DEFAULT_CLOUDINARY_API_KEY = "435186988213611";

/**
 * Resolves Cloudinary configuration, prioritizing localStorage, then Vite env variables, then defaults.
 */
export function getCloudinaryConfig(): CloudinaryConfig {
  const metaEnv = (import.meta as any).env || {};
  
  const cloudName = localStorage.getItem(STORAGE_KEYS.CLOUD_NAME) || metaEnv.VITE_CLOUDINARY_CLOUD_NAME || "";
  const uploadPreset = localStorage.getItem(STORAGE_KEYS.UPLOAD_PRESET) || metaEnv.VITE_CLOUDINARY_UPLOAD_PRESET || "";
  const apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY) || metaEnv.VITE_CLOUDINARY_API_KEY || DEFAULT_CLOUDINARY_API_KEY;

  return {
    cloudName: cloudName.trim(),
    uploadPreset: uploadPreset.trim(),
    apiKey: apiKey.trim(),
  };
}

/**
 * Saves Cloudinary configuration to localStorage.
 */
export function saveCloudinaryConfig(config: CloudinaryConfig): void {
  localStorage.setItem(STORAGE_KEYS.CLOUD_NAME, config.cloudName.trim());
  localStorage.setItem(STORAGE_KEYS.UPLOAD_PRESET, config.uploadPreset.trim());
  localStorage.setItem(STORAGE_KEYS.API_KEY, config.apiKey.trim());
}

/**
 * Checks if the Cloudinary configuration has minimum required parameters for unsigned uploads.
 */
export function isCloudinaryConfigured(): boolean {
  const config = getCloudinaryConfig();
  return !!config.cloudName && !!config.uploadPreset;
}

/**
 * Uploads a file to Cloudinary using unsigned upload.
 * Uses XMLHttpRequest to report exact upload progress.
 */
export function uploadToCloudinary(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const config = getCloudinaryConfig();

    if (!config.cloudName || !config.uploadPreset) {
      reject(new Error("Cloudinary is not fully configured. Please set your Cloud Name and Upload Preset in settings."));
      return;
    }

    const url = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", config.uploadPreset);
    if (config.apiKey) {
      formData.append("api_key", config.apiKey);
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);

    // Track upload progress
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.secure_url) {
            resolve(response.secure_url);
          } else {
            reject(new Error("Secure URL not returned from Cloudinary."));
          }
        } catch (e) {
          reject(new Error("Failed to parse Cloudinary response."));
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject(new Error(errorData.error?.message || `Upload failed with status code ${xhr.status}`));
        } catch (e) {
          reject(new Error(`Upload failed with status code ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error occurred during Cloudinary upload."));
    };

    xhr.send(formData);
  });
}

/**
 * Optimizes a Cloudinary image URL dynamically by injecting HSL-based quality and format auto-conversions.
 * If the image is not hosted on Cloudinary, it returns the URL unchanged.
 * 
 * Examples:
 * - `optimizeCloudinaryUrl(url)` -> uses f_auto,q_auto
 * - `optimizeCloudinaryUrl(url, 800)` -> uses f_auto,q_auto,w_800 for cover photo limits
 */
export function optimizeCloudinaryUrl(url: string, width?: number): string {
  if (!url || !url.includes("res.cloudinary.com")) return url;

  // Check if it already has transformations (avoid duplicate injection)
  if (url.includes("/f_auto") || url.includes("/q_auto")) return url;

  const transformations = ["f_auto", "q_auto"];
  if (width) {
    transformations.push(`w_${width}`);
  }

  const transformString = transformations.join(",");
  return url.replace("/upload/", `/upload/${transformString}/`);
}
