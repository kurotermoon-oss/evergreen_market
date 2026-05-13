import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { formatUAH } from "../utils/formatUAH.js";

function ChartCard({ title, description, children }) {
  return (
    <div className="eg-card eg-premium-card rounded-[2rem] border border-stone-200 bg-white/80 p-5 shadow-sm backdrop-blur hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-900/10">
      <h3 className="text-xl font-black text-stone-950">{title}</h3>

      {description && (
        <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
      )}

      <div className="mt-5 h-80">{children}</div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white/95 px-4 py-3 text-sm shadow-xl backdrop-blur">
      <p className="font-black text-stone-950">{label}</p>

      {payload.map((item) => (
        <p key={item.dataKey} className="mt-1 font-semibold text-emerald-800">
          {item.name || item.dataKey}: {formatUAH(item.value)}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsCharts({ analytics }) {
  const ordersByDay = analytics?.ordersByDay || [];
  const topProducts = analytics?.topProducts || [];

  if (!ordersByDay.length && !topProducts.length) {
    return (
      <div className="eg-panel mt-8 rounded-[2rem] bg-stone-50/90 p-8 text-center text-stone-500">
        Даних для графіків поки немає.
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-2">
      <ChartCard
        title="Динаміка прибутку"
        description="Щоденний прибуток за обраний період."
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={ordersByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#78716c" />
            <YAxis tick={{ fontSize: 12 }} stroke="#78716c" />
            <Tooltip content={<CustomTooltip />} />
            <Line
              name="Прибуток"
              type="monotone"
              dataKey="profit"
              stroke="#065f46"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Топ товарів за виручкою"
        description="Позиції, які принесли найбільше обороту."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topProducts}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              stroke="#78716c"
              interval={0}
            />
            <YAxis tick={{ fontSize: 12 }} stroke="#78716c" />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              name="Виручка"
              dataKey="revenue"
              fill="#065f46"
              radius={[12, 12, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}