"use client";

import { useState } from "react";
import { uploadImage as uploadImageAPI } from "@/services/api";

export function useImageUpload() {
  const [image, setImage] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const uploadImage = async (file: File) => {
    setLoading(true);
    setError("");

    try {
      setImage(file);

      const result = await uploadImageAPI(file);

      console.log(result);
      console.log(result.processedImage);
      console.log(typeof result.processedImage);

      console.log(result);

      const imageUrl = `http://localhost:8000/${result.processedImage}`;

      console.log(imageUrl);

      setProcessedImage(imageUrl);

      setProcessedImage(
        `http://localhost:8000/${result.processedImage}`
      );

    } catch (err) {
      setError("Failed to process image.");
      console.error(err);
    } finally {
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

