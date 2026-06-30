export default function OriginalPreview() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">
        Original Image
      </h3>

      <div className="flex h-80 items-center justify-center rounded-lg border bg-gray-50">
        <p className="text-gray-400">
          No Image Uploaded
        </p>
      </div>
    </div>
  );
}