"use client";

import { useState } from "react";

import MainLayout from "@/components/layout/MainLayout";
import UploadCard from "@/components/upload/UploadCard";
import OriginalPreview from "@/components/preview/OriginalPreview";
import ProcessedPreview from "@/components/preview/ProcessedPreview";
import Sidebar from "@/components/sidebar/Sidebar";

export default function HomePage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const handleImageUpload = (file: File) => {
    setSelectedImage(file);
    console.log("Selected Image:", file);
  };
  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <UploadCard
          image={selectedImage}
          onImageUpload={handleImageUpload}
          onRemoveImage={handleRemoveImage}
        />

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-5">
            <OriginalPreview image={selectedImage} />
          </div>

          <div className="col-span-5">
            <ProcessedPreview />
          </div>

          <div className="col-span-2">
            <Sidebar />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}