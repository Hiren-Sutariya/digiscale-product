export default function Sidebar() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold">
        Tools
      </h2>

      <div className="space-y-4">
        <button className="w-full rounded-lg border p-3 text-left hover:bg-gray-100">
          Background
        </button>

        <button className="w-full rounded-lg border p-3 text-left hover:bg-gray-100">
          Enhance
        </button>

        <button className="w-full rounded-lg border p-3 text-left hover:bg-gray-100">
          Labels
        </button>

        <button className="w-full rounded-lg border p-3 text-left hover:bg-gray-100">
          Export
        </button>
      </div>
    </div>
  );
}