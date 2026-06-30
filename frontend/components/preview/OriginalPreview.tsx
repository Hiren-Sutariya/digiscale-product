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

      {/* Image Preview */}
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

      {/* Image Information */}
      {image && (
        <div className="mt-4 rounded-lg border bg-gray-50 p-4">
          <p className="text-sm">
            <span className="font-semibold">Name:</span> {image.name}
          </p>

          <p className="mt-2 text-sm">
            <span className="font-semibold">Size:</span>{" "}
            {(image.size / 1024 / 1024).toFixed(2)} MB
          </p>

          <p className="mt-2 text-sm">
            <span className="font-semibold">Type:</span>{" "}
            {image.type}
          </p>
        </div>
      )}
    </div>
  );
}