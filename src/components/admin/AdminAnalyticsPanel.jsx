import { formatUAH } from "../../utils/formatUAH.js";
import AnalyticsCharts from "../AnalyticsCharts.jsx";

function KpiCard({ label, value, tone = "stone" }) {
  const valueClass =
    tone === "emerald" ? "text-emerald-900" : "text-stone-950";

  return (
    <div className="eg-card eg-premium-card rounded-[1.8rem] bg-white/75 p-5 shadow-sm ring-1 ring-stone-100 backdrop-blur hover:bg-emerald-50/50 hover:shadow-lg hover:shadow-emerald-900/10">
      <p className="text-xs font-black uppercase tracking-wide text-stone-400">
        {label}
      </p>

      <p className={`mt-2 text-3xl font-black ${valueClass}`}>{value}</p>
    </div>
  );
}

export default function AdminAnalyticsPanel({
  analytics,
  analyticsFilters,
  updateAnalyticsFilters,
}) {
  const periods = [
    { id: "today", label: "Сьогодні" },
    { id: "7d", label: "7 днів" },
    { id: "30d", label: "30 днів" },
    { id: "all", label: "Весь час" },
    { id: "custom", label: "Вручну" },
  ];

  return (
    <section className="eg-glass eg-premium-card rounded-[2.5rem] p-6 lg:p-8">
      <div>
        <p className="w-fit rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-800 shadow-sm backdrop-blur">
          Dashboard
        </p>

        <h2 className="mt-4 text-4xl font-black leading-tight text-stone-950">
          Аналітика
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
          Дивіться оборот, собівартість, прибуток та динаміку замовлень за
          обраний період.
        </p>
      </div>

      <div className="eg-panel eg-premium-card mt-7 rounded-[2rem] bg-stone-50/90 p-5 backdrop-blur">
        <p className="mb-3 text-sm font-black text-stone-700">
          Період аналітики
        </p>

        <div className="flex flex-wrap gap-2">
          {periods.map((period) => (
            <button
              key={period.id}
              type="button"
              onClick={() =>
                updateAnalyticsFilters({
                  ...analyticsFilters,
                  preset: period.id,
                })
              }
              className={`eg-button rounded-[1.25rem] px-4 py-2.5 text-sm font-black ${
                analyticsFilters?.preset === period.id
                  ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/20"
                  : "bg-white/85 text-stone-700 shadow-sm hover:bg-white hover:text-emerald-900"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {analyticsFilters?.preset === "custom" && (
          <div className="eg-panel mt-4 grid gap-3 rounded-[1.6rem] bg-white/70 p-4 sm:grid-cols-[1fr_1fr_auto]">
            <input
              type="date"
              value={analyticsFilters.from || ""}
              onChange={(event) =>
                updateAnalyticsFilters({
                  ...analyticsFilters,
                  preset: "custom",
                  from: event.target.value,
                })
              }
              className="eg-field rounded-[1.25rem] border border-stone-200 bg-white/85 px-4 py-3 outline-none backdrop-blur focus:border-emerald-700 focus:bg-white"
            />

            <input
              type="date"
              value={analyticsFilters.to || ""}
              onChange={(event) =>
                updateAnalyticsFilters({
                  ...analyticsFilters,
                  preset: "custom",
                  to: event.target.value,
                })
              }
              className="eg-field rounded-[1.25rem] border border-stone-200 bg-white/85 px-4 py-3 outline-none backdrop-blur focus:border-emerald-700 focus:bg-white"
            />

            <button
              type="button"
              onClick={() =>
                updateAnalyticsFilters({
                  preset: "custom",
                  from: analyticsFilters.from || "",
                  to: analyticsFilters.to || "",
                })
              }
              className="eg-button rounded-[1.25rem] bg-stone-950 px-5 py-3 font-black text-white hover:bg-stone-800"
            >
              Застосувати
            </button>
          </div>
        )}
      </div>

      {!analytics && (
        <div className="eg-panel mt-6 rounded-[2rem] bg-stone-50/90 p-8 text-center text-stone-500">
          Аналітика ще не завантажена.
        </div>
      )}

      {analytics && (
        <>
          <div className="eg-stagger mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Завершених"
              value={analytics.completedOrdersCount}
            />

            <KpiCard label="Оборот" value={formatUAH(analytics.totalRevenue)} />

            <KpiCard
              label="Собівартість"
              value={formatUAH(analytics.totalCost)}
            />

            <KpiCard
              label="Прибуток"
              value={formatUAH(analytics.totalProfit)}
              tone="emerald"
            />
          </div>

          <div className="mt-6">
            <AnalyticsCharts analytics={analytics} />
          </div>
        </>
      )}
    </section>
  );
}