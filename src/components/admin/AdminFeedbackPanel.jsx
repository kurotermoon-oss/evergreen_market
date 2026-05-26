import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  Bug,
  CheckCircle2,
  Circle,
  Clock3,
  Lightbulb,
  MessageSquare,
  Search,
} from "lucide-react";

const TYPE_OPTIONS = [
  { id: "all", label: "Усі", Icon: MessageSquare },
  { id: "complaint", label: "Скарги", Icon: AlertTriangle },
  { id: "wish", label: "Побажання", Icon: Lightbulb },
  { id: "bug", label: "Баги", Icon: Bug },
  { id: "other", label: "Інше", Icon: MessageSquare },
];

const STATUS_OPTIONS = [
  { id: "all", label: "Усі", Icon: MessageSquare },
  { id: "new", label: "Нові", Icon: Circle },
  { id: "reviewed", label: "В роботі", Icon: Clock3 },
  { id: "resolved", label: "Вирішені", Icon: CheckCircle2 },
  { id: "archived", label: "Архів", Icon: Archive },
];

const STATUS_ACTIONS = [
  { id: "new", label: "Нове" },
  { id: "reviewed", label: "В роботі" },
  { id: "resolved", label: "Вирішено" },
  { id: "archived", label: "Архів" },
];

const TYPE_META = {
  complaint: {
    label: "Скарга",
    className: "bg-red-50 text-red-800 ring-red-100",
    Icon: AlertTriangle,
  },
  wish: {
    label: "Побажання",
    className: "bg-amber-50 text-amber-800 ring-amber-100",
    Icon: Lightbulb,
  },
  bug: {
    label: "Баг",
    className: "bg-purple-50 text-purple-800 ring-purple-100",
    Icon: Bug,
  },
  other: {
    label: "Інше",
    className: "bg-stone-100 text-stone-700 ring-stone-200",
    Icon: MessageSquare,
  },
};

const STATUS_META = {
  new: {
    label: "Нове",
    className: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  },
  reviewed: {
    label: "В роботі",
    className: "bg-blue-50 text-blue-800 ring-blue-100",
  },
  resolved: {
    label: "Вирішено",
    className: "bg-stone-100 text-stone-700 ring-stone-200",
  },
  archived: {
    label: "Архів",
    className: "bg-stone-950 text-white ring-stone-950",
  },
};

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) return "";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ring-1 ${className}`}
    >
      {children}
    </span>
  );
}

function StatCard({ label, value, tone = "stone" }) {
  const valueClass = {
    stone: "text-stone-950",
    emerald: "text-emerald-900",
    red: "text-red-800",
    amber: "text-amber-800",
    purple: "text-purple-800",
  }[tone];

  return (
    <div className="eg-card rounded-[1.6rem] bg-white/75 p-4 shadow-sm ring-1 ring-stone-100 backdrop-blur hover:bg-emerald-50/50">
      <p className="text-xs font-black uppercase tracking-wide text-stone-400">
        {label}
      </p>

      <p className={`mt-1 text-2xl font-black ${valueClass}`}>{value}</p>
    </div>
  );
}

function FilterButton({ item, active, onClick }) {
  const Icon = item.Icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`eg-button inline-flex items-center justify-center gap-2 rounded-[1.1rem] px-4 py-2.5 text-sm font-black ${
        active
          ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/20"
          : "bg-white/80 text-stone-700 ring-1 ring-stone-200 hover:bg-white hover:text-emerald-900"
      }`}
      aria-pressed={active}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </button>
  );
}

export default function AdminFeedbackPanel({
  feedback = [],
  updateFeedbackStatus,
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState("");

  const stats = useMemo(() => {
    return feedback.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.status === "new") acc.new += 1;
        if (item.type === "bug") acc.bugs += 1;
        if (item.type === "complaint") acc.complaints += 1;
        return acc;
      },
      {
        total: 0,
        new: 0,
        bugs: 0,
        complaints: 0,
      }
    );
  }, [feedback]);

  const visibleFeedback = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return feedback.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      if (typeFilter !== "all" && item.type !== typeFilter) {
        return false;
      }

      if (!query) return true;

      const text = [
        item.subject,
        item.message,
        item.customerName,
        item.customerPhone,
        item.customerTelegram,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });
  }, [feedback, searchQuery, statusFilter, typeFilter]);

  async function changeStatus(item, status) {
    if (item.status === status || updatingId) return;

    try {
      setUpdatingId(item.id);
      setMessage("");

      await updateFeedbackStatus?.(item.id, status);

      setMessage("Статус звернення оновлено.");
    } catch (error) {
      setMessage(error?.message || "Не вдалося оновити статус звернення.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="eg-glass eg-premium-card rounded-[2.5rem] p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700">
              Зворотний зв'язок
            </p>

            <h2 className="mt-2 text-3xl font-black text-stone-950">
              Звернення користувачів
            </h2>
          </div>

          <div className="relative w-full lg:w-96">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />

            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="eg-field w-full rounded-[1.3rem] border border-stone-200 bg-white/85 px-11 py-3 text-sm outline-none backdrop-blur transition focus:border-emerald-700 focus:bg-white"
              placeholder="Пошук за текстом або контактом"
            />
          </div>
        </div>

        <div className="eg-stagger mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Усього" value={stats.total} />
          <StatCard label="Нові" value={stats.new} tone="emerald" />
          <StatCard label="Скарги" value={stats.complaints} tone="red" />
          <StatCard label="Баги" value={stats.bugs} tone="purple" />
        </div>
      </div>

      <div className="eg-glass eg-premium-card rounded-[2rem] p-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((item) => (
            <FilterButton
              key={item.id}
              item={item}
              active={statusFilter === item.id}
              onClick={() => setStatusFilter(item.id)}
            />
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
          {TYPE_OPTIONS.map((item) => (
            <FilterButton
              key={item.id}
              item={item}
              active={typeFilter === item.id}
              onClick={() => setTypeFilter(item.id)}
            />
          ))}
        </div>
      </div>

      {message && (
        <div className="eg-panel rounded-[1.4rem] bg-emerald-50/90 p-4 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100">
          {message}
        </div>
      )}

      {!visibleFeedback.length && (
        <div className="eg-glass eg-premium-card rounded-[2rem] p-8 text-center text-stone-500">
          Звернень за цими фільтрами немає.
        </div>
      )}

      <div className="eg-stagger space-y-4">
        {visibleFeedback.map((item) => {
          const typeMeta = TYPE_META[item.type] || TYPE_META.other;
          const statusMeta = STATUS_META[item.status] || STATUS_META.new;
          const TypeIcon = typeMeta.Icon;
          const contactParts = [
            item.customerPhone,
            item.customerTelegram ? `@${item.customerTelegram}` : "",
          ].filter(Boolean);

          return (
            <article
              key={item.id}
              className="eg-card eg-premium-card rounded-[1.8rem] border border-stone-200 bg-white/88 p-5 backdrop-blur hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-900/10"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={typeMeta.className}>
                      <TypeIcon className="h-3.5 w-3.5" />
                      {typeMeta.label}
                    </Badge>

                    <Badge className={statusMeta.className}>
                      {statusMeta.label}
                    </Badge>
                  </div>

                  <h3 className="mt-3 text-xl font-black text-stone-950">
                    {item.subject || typeMeta.label}
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
                    <span className="font-bold text-stone-800">
                      {item.customerName || "Користувач"}
                    </span>

                    {contactParts.length > 0 && (
                      <span>{contactParts.join(" · ")}</span>
                    )}

                    {item.createdAt && <span>{formatDate(item.createdAt)}</span>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {STATUS_ACTIONS.map((status) => {
                    const isActive = item.status === status.id;

                    return (
                      <button
                        key={status.id}
                        type="button"
                        onClick={() => changeStatus(item, status.id)}
                        disabled={isActive || updatingId === item.id}
                        className={`eg-button rounded-[1rem] px-3 py-2 text-xs font-black ${
                          isActive
                            ? "bg-emerald-900 text-white"
                            : "bg-stone-100 text-stone-700 hover:bg-white hover:text-emerald-900"
                        } disabled:cursor-not-allowed`}
                      >
                        {status.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="mt-4 whitespace-pre-line rounded-[1.4rem] bg-stone-50/90 p-4 text-sm leading-6 text-stone-700 ring-1 ring-stone-100">
                {item.message}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
