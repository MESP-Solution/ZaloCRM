import Link from "next/link";

export function LoginPanel() {
  return (
    <main className="grid min-h-screen bg-gray-950 text-white lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex flex-col justify-between px-8 py-10 md:px-14">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-blue-500 text-sm font-bold">
            Z
          </span>
          <span className="text-lg font-semibold">ZaloCRM</span>
        </Link>

        <div className="max-w-2xl py-20">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-blue-200">
            CRM SaaS tool
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-6xl">
            Quan ly lead, deal va khach hang trong mot he thong gon.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-gray-300">
            Frontend da san sang ket noi NestJS API qua service layer typed.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center bg-white px-6 py-10 text-gray-950">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold">Dang nhap</h2>
          <p className="mt-2 text-sm text-gray-500">
            Ket noi endpoint `/auth/login` khi backend san sang.
          </p>

          <form className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Email</span>
              <input
                className="mt-2 h-12 w-full rounded-lg border border-gray-300 px-4 outline-none focus:border-blue-600"
                name="email"
                placeholder="you@company.com"
                type="email"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Password</span>
              <input
                className="mt-2 h-12 w-full rounded-lg border border-gray-300 px-4 outline-none focus:border-blue-600"
                name="password"
                placeholder="password"
                type="password"
              />
            </label>
            <button
              className="h-12 w-full rounded-lg bg-blue-600 font-semibold text-white transition hover:bg-blue-700"
              type="button"
            >
              Sign in
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
