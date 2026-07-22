"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";


interface UploadCardProps {
  image: File | null;
  onImageUpload: (file: File) => void;
  onRemoveImage: () => void;

  variant?: "landing" | "workspace";
}

export default function UploadCard({
  image,
  onImageUpload,
  onRemoveImage,
  variant = "workspace",
}: UploadCardProps){
    const [errorMessage, setErrorMessage] = useState("");
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                setErrorMessage("");
                onImageUpload(acceptedFiles[0]);
            }
        },
        [onImageUpload]
    );

    // const { getRootProps, getInputProps, isDragActive } = useDropzone({
    //     onDrop,
    //     multiple: false,
    //     maxSize: 10 * 1024 * 1024,
    //     accept: {
    //         "image/png": [".png"],
    //         "image/jpeg": [".jpg", ".jpeg"],
    //         "image/webp": [".webp"],
    //     },
    // });

    const {
        getRootProps,
        getInputProps,
        isDragActive,
    } = useDropzone({
        onDrop,
        multiple: false,
        maxSize: 15 * 1024 * 1024,

        accept: {
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
            "image/webp": [".webp"],
            "image/heic": [".heic"],
        },

        onDropRejected: (fileRejections) => {
            const error = fileRejections[0]?.errors[0];

            if (!error) return;

            if (error.code === "file-too-large") {
                setErrorMessage("File size must be less than 10 MB.");
                return;
            }

            if (error.code === "file-invalid-type") {
                setErrorMessage(
                    "Only JPG, PNG and WEBP images are allowed."
                );
                return;
            }

            setErrorMessage("Invalid file.");
        },
    });

    return (
        <div
            {...getRootProps()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${isDragActive
                ? "border-blue-600 bg-blue-50"
                : "border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50"
                }`}
        >
            <input {...getInputProps()} />
            {errorMessage && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-sm font-medium text-red-700">
                        {errorMessage}
                    </p>
                </div>
            )}

            <UploadCloud className="mx-auto h-14 w-14 text-blue-600" />

            <h2 className="mt-4 text-2xl font-bold">
                Upload Product Image
            </h2>

            <p className="mt-2 text-gray-500">
                Drag & Drop your image here
            </p>

            <p className="text-gray-400">
                or click anywhere to browse
            </p>

            {image ? (
                <div className="mt-6 rounded-lg border bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                        {/* File Info */}
                        <div className="text-left">
                            <p className="font-medium text-gray-800">
                                {image.name}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                                {(image.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>

                        {/* Buttons */}
                        <div
                            className="flex gap-3"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => {
                                    const input = document.querySelector(
                                        'input[type="file"]'
                                    ) as HTMLInputElement;

                                    input?.click();
                                }}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700"
                            >
                                Change
                            </button>

                            <button
                                onClick={() => {
                                    setErrorMessage("");
                                    onRemoveImage();
                                }}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition hover:bg-red-700"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mt-6 inline-flex rounded-lg bg-blue-600 px-6 py-3 text-white">
                    Choose Product Image
                </div>
            )}

            <p className="mt-6 text-sm text-gray-400">
                Supported: JPG • PNG • WEBP • HEIC • Max 15 MB
            </p>
        </div>
    );
}
