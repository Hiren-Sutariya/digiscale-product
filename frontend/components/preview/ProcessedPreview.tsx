type ProcessedPreviewProps = {
  image: string | null;
  loading: boolean;
};

export default function ProcessedPreview({
  image,
  loading,
}: ProcessedPreviewProps) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">
        Processed Image
      </h3>

      <div className="flex h-80 items-center justify-center rounded-lg border bg-gray-50 overflow-hidden">

        {loading ? (
          <p className="text-blue-600 font-medium">
            Processing Image...
          </p>
        ) : image ? (
          <img
            src={image}
            alt="Processed"
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <p className="text-gray-400">
            Processed Image Preview
          </p>
        )}

      </div>
    </div>
  );
}