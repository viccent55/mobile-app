import { ref } from "vue";
import CryptoJS from "crypto-js";
import { decrypt } from "@/utils/crypto";
// The decryption key and IV are extracted from your original code.
const encryptionKey = CryptoJS.enc.Utf8.parse("k9:3zeFq~]-EQMF,gpGx*uRw+x,n]xw9");
const iv = CryptoJS.enc.Utf8.parse("Zd3!t#t1YN=!fs)D");

// A cache to store the decrypted image URLs to avoid re-decrypting the same image
const urlCache = new Map<string, string>();

/**
 * A composable for decrypting an image from a given URL.
 * It handles fetching the encrypted data, decrypting it with CryptoJS,
 * and creating a Blob URL for display.
 */
export const useDecryption = () => {
  const decryptedImage = ref<string>("");
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const decryptAndCreateUrl = async (imageUrl: string): Promise<string> => {
    // Check if the image is already in the cache
    if (urlCache.has(imageUrl)) {
      // console.log("Using cached image URL for:", imageUrl);
      return urlCache.get(imageUrl)!;
    }

    try {
      // Fetch the encrypted image data as an ArrayBuffer
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      const encryptedData = await response.arrayBuffer();

      // Convert ArrayBuffer to CryptoJS WordArray
      const encryptedBytes = new Uint8Array(encryptedData);
      const cipherText = CryptoJS.lib.WordArray.create(encryptedBytes as any);

      // Decrypt the data using AES
      const decrypted = CryptoJS.AES.decrypt({ ciphertext: cipherText } as any, encryptionKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      // Convert decrypted WordArray back to a Uint8Array
      const decryptedData = new Uint8Array(
        decrypted.words.flatMap((word) => [
          (word >> 24) & 0xff,
          (word >> 16) & 0xff,
          (word >> 8) & 0xff,
          word & 0xff,
        ])
      ).slice(0, decrypted.sigBytes);

      if (!decryptedData || decryptedData.length === 0) {
        throw new Error("Decryption failed or data is empty.");
      }

      // Create a Blob and a Blob URL
      const blob = new Blob([decryptedData], { type: "image/jpeg" });
      const blobUrl = URL.createObjectURL(blob);

      // Store the new URL in the cache
      urlCache.set(imageUrl, blobUrl);

      return blobUrl;
    } catch (err) {
      console.error("Image decryption failed:", err);
      throw err;
    }
  };

  const clearCache = () => {
    for (const blobUrl of urlCache.values()) {
      URL.revokeObjectURL(blobUrl);
    }
    urlCache.clear();
  };

  const decryptImage = async (imageUrl: string) => {
    // Reset state
    decryptedImage.value = "";
    error.value = null;
    isLoading.value = true;

    try {
      // Assuming a base URL for your images.
      const fullUrl = `${import.meta.env.VITE_IMAGE_HOST}${imageUrl}`;
      decryptedImage.value = await decryptAndCreateUrl(fullUrl);
    } catch (e: any) {
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  };
  const encryptData = (res: Record<string, any>) => {
    const decrypted = decrypt(res.data);
    res.data = decrypted;
    if (import.meta.env.MODE === "development") {
      // console.log(`Decrypted: Get`, decrypted);
    }
    return res.data;
  };
  function blobUrlToBase64(blobUrl: string): Promise<string> {
    return fetch(blobUrl)
      .then((res) => res.blob())
      .then((blob) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob); // convert Blob → Base64
        });
      });
  }

  return {
    decryptedImage,
    isLoading,
    error,
    decryptImage,
    clearCache,
    encryptData,
    blobUrlToBase64,
  };
};
