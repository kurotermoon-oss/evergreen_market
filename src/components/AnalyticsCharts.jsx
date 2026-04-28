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

export default function AnalyticsCharts({ analytics }) {
  const ordersByDay = analytics?.ordersByDay || [];
  const topProducts = analytics?.topProducts || [];

  if (!ordersByDay.length && !topProducts.length) {
    return (
      <div className="mt-8 rounded-3xl bg-stone-50 p-8 text-center text-stone-500">
        Даних для графіків поки немає.
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-2">
      <div className="rounded-3xl border border-stone-200 p-5">
        <h3 className="text-xl font-black text-stone-950">
          Динаміка виручки
        </h3>

        <div className="mt-5 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ordersByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatUAH(value)} />
              <Line
                type="monotone"
                dataKey="revenue"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl border border-stone-200 p-5">
        <h3 className="text-xl font-black text-stone-950">
          Топ товарів за виручкою
        </h3>

        <div className="mt-5 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(value) => formatUAH(value)} />
              <Bar dataKey="revenue" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}