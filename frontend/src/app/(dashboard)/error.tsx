"use client";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  return (
    <section className="rounded-lg border border-red-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-red-700">
        Error
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-gray-950">
        Khong the tai MKT
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
        {error.message || "Unexpected dashboard error."}
      </p>
      <button
        className="mt-6 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        onClick={reset}
        type="button"
      >
        Thu lai
      </button>
    </section>
  );
}
