import MainLayout from "@/components/layout/MainLayout";

export default function HomePage() {
  return (
    <MainLayout>
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome to DigiScale Product Studio
        </h2>

        <p className="mt-3 text-gray-500">
          Upload your product image to get started.
        </p>
      </div>
    </MainLayout>
  );
}