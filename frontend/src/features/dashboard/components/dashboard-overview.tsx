import { dashboardCards, recentActivities } from "../helpers/dashboard-copy";

export function DashboardOverview() {
  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-700">
            MKT overview
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-950">
            Sales command center
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Khung dashboard cho lead, deal, contact va activity. Khi NestJS API
            san sang, data nen duoc nap qua `dashboardApi.getSummary`.
          </p>
        </div>
        <button className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700">
          New lead
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((card) => (
          <article
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            key={card.label}
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-gray-950">
              {card.value}
            </p>
            <p className="mt-2 text-sm text-gray-600">{card.hint}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-950">
            Pipeline health
          </h2>
          <div className="mt-5 space-y-4">
            {["Qualified", "Proposal", "Negotiation", "Won"].map((stage) => (
              <div className="grid gap-2" key={stage}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{stage}</span>
                  <span className="text-gray-500">Ready</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full w-2/3 rounded-full bg-blue-600" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-950">
            Recent activity
          </h2>
          <div className="mt-5 divide-y divide-gray-100">
            {recentActivities.map((activity) => (
              <div className="py-4 first:pt-0 last:pb-0" key={activity.title}>
                <p className="text-sm font-medium text-gray-900">
                  {activity.title}
                </p>
                <p className="mt-1 text-sm text-gray-500">{activity.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
