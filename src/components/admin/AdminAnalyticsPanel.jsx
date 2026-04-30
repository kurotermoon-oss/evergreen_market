import { formatUAH } from "../../utils/formatUAH.js";
import AnalyticsCharts from "../AnalyticsCharts.jsx";

export default function AdminAnalyticsPanel({
  analytics,
  analyticsFilters,
  updateAnalyticsFilters,
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-black text-stone-950">Аналітика</h2>

      <div className="mt-5 rounded-3xl bg-stone-50 p-4">
        <p className="mb-3 text-sm font-bold text-stone-700">
          Період аналітики
        </p>

        <div className="flex flex-wrap gap-2">
          {[
            { id: "today", label: "Сьогодні" },
            { id: "7d", label: "7 днів" },
            { id: "30d", label: "30 днів" },
            { id: "all", label: "Весь час" },
            { id: "custom", label: "Вручну" },
          ].map((period) => (
            <button
              key={period.id}
              type="button"
              onClick={() =>
                updateAnalyticsFilters({
                  ...analyticsFilters,
                  preset: period.id,
                })
              }
              className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                analyticsFilters?.preset === period.id
                  ? "bg-emerald-900 text-white"
                  : "bg-white text-stone-700 hover:bg-stone-100"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {analyticsFilters?.preset === "custom" && (
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
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
              className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
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
              className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
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
              className="rounded-2xl bg-stone-950 px-5 py-3 font-bold text-white hover:bg-stone-800"
            >
              Застосувати
            </button>
          </div>
        )}
      </div>

      {!analytics && (
        <div className="mt-6 rounded-3xl bg-stone-50 p-8 text-center text-stone-500">
          Аналітика ще не завантажена.
        </div>
      )}

      {analytics && (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl bg-stone-50 p-5">
              <p className="text-sm text-stone-500">Завершених</p>
              <p className="mt-2 text-3xl font-black text-stone-950">
                {analytics.completedOrdersCount}
              </p>
            </div>

            <div className="rounded-3xl bg-stone-50 p-5">
              <p className="text-sm text-stone-500">Оборот</p>
              <p className="mt-2 text-3xl font-black text-stone-950">
                {formatUAH(analytics.totalRevenue)}
              </p>
            </div>

            <div className="rounded-3xl bg-stone-50 p-5">
              <p className="text-sm text-stone-500">Собівартість</p>
              <p className="mt-2 text-3xl font-black text-stone-950">
                {formatUAH(analytics.totalCost)}
              </p>
            </div>

            <div className="rounded-3xl bg-stone-50 p-5">
              <p className="text-sm text-stone-500">Прибуток</p>
              <p className="mt-2 text-3xl font-black text-emerald-900">
                {formatUAH(analytics.totalProfit)}
              </p>
            </div>
          </div>

          <AnalyticsCharts analytics={analytics} />
        </>
      )}
    </section>
  );
}