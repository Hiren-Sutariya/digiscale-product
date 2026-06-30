export default function UploadCard() {
  return (
    <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-10 text-center">
      <h2 className="text-xl font-semibold text-gray-900">
        Upload Product Image
      </h2>

      <p className="mt-2 text-gray-500">
        Drag & Drop or Click to Upload
      </p>

      <button className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700">
        Choose Image
      </button>
    </div>
  );
}