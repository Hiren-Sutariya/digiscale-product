"use client";

import { useState } from "react";
import { ProductImage } from "@/types/image";

export function useImageUpload() {
  const [image, setImage] = useState<ProductImage | null>(null);

  const setUploadedImage = (file: File) => {
    setImage({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type,
    });
  };

  const removeImage = () => {
    if (image) {
      URL.revokeObjectURL(image.preview);
    }

    setImage(null);
  };

  return {
    image,
    setUploadedImage,
    removeImage,
  };
}