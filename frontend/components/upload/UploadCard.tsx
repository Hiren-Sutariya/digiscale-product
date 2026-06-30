"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";

interface UploadCardProps {
    onImageUpload: (file: File) => void;
}

export default function UploadCard({
    onImageUpload,
}: UploadCardProps) {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                onImageUpload(acceptedFiles[0]);
            }
        },
        [onImageUpload]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        maxSize: 10 * 1024 * 1024,
        accept: {
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg"],
            "image/webp": [".webp"],
        },
    });

    return (
        <div
            {...getRootProps()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${isDragActive
                ? "border-blue-600 bg-blue-50"
                : "border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50"
                }`}
        >
            <input {...getInputProps()} />

            <UploadCloud className="mx-auto h-16 w-16 text-blue-600" />

            <h2 className="mt-6 text-2xl font-bold">
                Upload Product Image
            </h2>

            <p className="mt-2 text-gray-500">
                Drag & Drop your image here
            </p>

            <p className="text-gray-400">
                or click anywhere to browse
            </p>

            <div className="mt-6 inline-flex rounded-lg bg-blue-600 px-6 py-3 text-white">
                Choose Product Image
            </div>

            <p className="mt-6 text-sm text-gray-400">
                Supported: JPG • PNG • WEBP • Max 10 MB
            </p>
        </div>
    );
}