interface ModulePlaceholderProps {
  description: string;
  title: string;
}

export function ModulePlaceholder({
  description,
  title,
}: ModulePlaceholderProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-700">
        MKT module
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-gray-950">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
        {description}
      </p>
      <div className="mt-8 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6">
        <p className="text-sm font-medium text-gray-800">
          Feature boundary ready
        </p>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Add `features/{title.toLowerCase()}/api`, components, hooks, helpers
          and types when endpoint contracts are finalized.
        </p>
      </div>
    </section>
  );
}
