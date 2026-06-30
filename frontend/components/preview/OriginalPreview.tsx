interface OriginalPreviewProps {
  image: File | null;
}

export default function OriginalPreview({
  image,
}: OriginalPreviewProps) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">
        Original Image
      </h3>

      <div className="flex h-80 items-center justify-center overflow-hidden rounded-lg border bg-gray-50">
        {image ? (
          <img
            src={URL.createObjectURL(image)}
            alt="Original Product"
            className="h-full w-full object-contain"
          />
        ) : (
          <p className="text-gray-400">
            No Image Uploaded
          </p>
        )}
      </div>
    </div>
  );
}