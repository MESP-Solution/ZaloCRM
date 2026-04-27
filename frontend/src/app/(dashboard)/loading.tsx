export default function DashboardLoading() {
  return (
    <section className="space-y-6">
      <div className="h-8 w-64 rounded-lg bg-gray-200" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            className="h-32 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            key={item}
          >
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="mt-5 h-8 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </section>
  );
}
