"use client";

import { useState } from "react";
import { uploadImage as uploadImageAPI } from "@/services/api";
import { API_BASE_URL } from "@/constants/api";

export function useImageUpload() {
  const [image, setImage] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const uploadImage = async (file: File, projectId?: number) => {
    setLoading(true);
    setError("");
    setImage(file);

    try {
      const result = await uploadImageAPI(file, projectId);

      if (result.status === "processing" && result.imageId && projectId) {
        // Poll for completion
        const checkStatus = async () => {
          try {
            const { getImageStatus } = await import("@/services/api");
            const statusResult = await getImageStatus(projectId, result.imageId);
            if (statusResult.status === "completed") {
              setProcessedImage(`${API_BASE_URL}/${statusResult.processedImage}`);
              setLoading(false);
            } else if (statusResult.status === "failed") {
              setError("Failed to process image.");
              setLoading(false);
            } else {
              // Still processing, poll again
              setTimeout(checkStatus, 2000);
            }
          } catch (err) {
            setError("Failed to check image status.");
            setLoading(false);
          }
        };
        setTimeout(checkStatus, 2000);
      } else {
        // Synchronous fallback
        setProcessedImage(`${API_BASE_URL}/${result.processedImage}`);
        setLoading(false);
      }
    } catch (err) {
      setError("Failed to process image.");
      console.error(err);
      setLoading(false);
    }
  };

  const removeImage = () => {
    setImage(null);
    setProcessedImage(null);
    setError("");
  };

  return {
    image,
    processedImage,
    loading,
    error,
    uploadImage,
    removeImage,
  };
}

