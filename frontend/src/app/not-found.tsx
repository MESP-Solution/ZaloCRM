import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
      <section className="max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-700">
          404
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-gray-950">
          Trang khong ton tai
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Kiem tra lai duong dan hoac quay ve dashboard CRM.
        </p>
        <Link
          className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          href="/dashboard"
        >
          Ve dashboard
        </Link>
      </section>
    </main>
  );
}
