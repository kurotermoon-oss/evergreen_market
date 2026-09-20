import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
export const dayNames = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const weekOrder = [1, 2, 3, 4, 5, 6, 0];
export function Field({ label, children, hint }) { return <label className="supply-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
function Days({ value, onChange, label }) { return <fieldset className="supply-days"><legend>{label}</legend><div>{weekOrder.map(day => <button type="button" key={day} aria-pressed={value.includes(day)} onClick={() => onChange(value.includes(day) ? value.filter(d => d !== day) : [...value, day])}>{dayNames[day]}</button>)}</div></fieldset>; }
export function SupplierForm({ initial, onSave, busy }) {
  const [form, setForm] = useState(initial || { name: "", contact: "", url: "", notes: "", active: true, confirmed: false, orderTimes: Array(7).fill(null), deliveryDays: [1, 2, 3, 4, 5], minLeadDays: 1, maxLeadDays: 2, exceptions: [], notifications: true, reminderMinutes: [180, 60, 20] });
  const [reminders, setReminders] = useState(form.reminderMinutes.join(", "));
  const update = (key, value) => setForm(f => ({ ...f, [key]: value, ...(key !== "confirmed" && ["orderTimes", "deliveryDays", "minLeadDays", "maxLeadDays", "exceptions"].includes(key) ? { confirmed: false } : {}) }));
  const exception = (index, values) => update("exceptions", form.exceptions.map((e, i) => i === index ? { ...e, ...values } : e));
  return <form onSubmit={event => { event.preventDefault(); onSave({ ...form, reminderMinutes: reminders.split(",").map(s => Number(s.trim())) }); }}>
    <Field label="Назва"><input required maxLength={80} value={form.name} onChange={e => update("name", e.target.value)} /></Field>
    <div className="supply-form-grid"><Field label="Контакт"><input maxLength={200} value={form.contact} onChange={e => update("contact", e.target.value)} /></Field><Field label="Telegram або сайт"><input type="url" placeholder="https://" value={form.url} onChange={e => update("url", e.target.value)} /></Field></div>
    <fieldset className="supply-schedule"><legend>Прийом замовлень · час Києва</legend>{weekOrder.map(day => <div key={day}><label><input type="checkbox" checked={form.orderTimes[day] !== null} onChange={e => update("orderTimes", form.orderTimes.map((t, i) => i === day ? e.target.checked ? "" : null : t))} />{dayNames[day]}</label>{form.orderTimes[day] !== null ? <input type="time" aria-label={`Дедлайн ${dayNames[day]}`} required={form.confirmed} value={form.orderTimes[day]} onChange={e => update("orderTimes", form.orderTimes.map((t, i) => i === day ? e.target.value : t))} /> : <span>Не приймає</span>}</div>)}</fieldset>
    <Days label="Дні доставки" value={form.deliveryDays} onChange={value => update("deliveryDays", value)} />
    <div className="supply-form-grid"><Field label="Мінімальний термін, днів"><input type="number" min="0" max="30" required value={form.minLeadDays} onChange={e => update("minLeadDays", e.target.value)} /></Field><Field label="Максимальний термін, днів"><input type="number" min="0" max="30" required value={form.maxLeadDays} onChange={e => update("maxLeadDays", e.target.value)} /></Field></div>
    <p className="supply-muted">Календарні дні. Рекомендована поставка враховує максимальний термін і доступні дні доставки.</p>
    <details className="supply-details"><summary>Винятки та святкові дні ({form.exceptions.length})</summary>{form.exceptions.map((e, index) => <div className="supply-exception" key={index}>
      <Field label="Дата винятку"><input type="date" required value={e.date} onChange={ev => exception(index, { date: ev.target.value })} /></Field>
      <label className="supply-checkbox"><input type="checkbox" checked={e.deadline !== null} onChange={ev => exception(index, { deadline: ev.target.checked ? "" : null })} />Приймає замовлення</label>
      {e.deadline !== null && <Field label="Дедлайн винятку"><input type="time" required value={e.deadline} onChange={ev => exception(index, { deadline: ev.target.value })} /></Field>}
      <label className="supply-checkbox"><input type="checkbox" checked={e.delivery} onChange={ev => exception(index, { delivery: ev.target.checked })} />Є доставка</label>
      <button className="supply-link" type="button" onClick={() => update("exceptions", form.exceptions.filter((_, i) => i !== index))}><Trash2 size={16} />Прибрати виняток</button>
    </div>)}<button className="supply-secondary" type="button" onClick={() => update("exceptions", [...form.exceptions, { date: "", deadline: null, delivery: false }])}><Plus size={17} />Додати виняток</button></details>
    <Field label="Примітка"><textarea rows={2} maxLength={500} value={form.notes} onChange={e => update("notes", e.target.value)} /></Field>
    <Field label="Нагадування за стільки хвилин до дедлайну" hint="До чотирьох значень через кому, наприклад: 180, 60, 20."><input required value={reminders} onChange={e => setReminders(e.target.value)} /></Field>
    <label className="supply-checkbox"><input type="checkbox" checked={form.notifications} onChange={e => update("notifications", e.target.checked)} />Нагадувати про цього постачальника</label>
    <label className="supply-checkbox"><input type="checkbox" checked={form.active} onChange={e => update("active", e.target.checked)} />Активний постачальник</label>
    <label className="supply-checkbox supply-confirm"><input type="checkbox" checked={form.confirmed} onChange={e => update("confirmed", e.target.checked)} />Графік і терміни перевірені у постачальника</label>
    <button className="supply-primary supply-wide" disabled={busy}>{busy ? "Зберігаємо…" : "Зберегти постачальника"}</button>
  </form>;
}
export function ProductForm({ initial, suppliers, onSave, busy }) {
  const [form, setForm] = useState(initial || { name: "", supplierId: suppliers.find(s => s.active)?.id || "", kind: "stock", active: true, unit: "уп.", threshold: "", days: [0, 1, 2, 3, 4, 5, 6], sortOrder: 0 });
  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));
  return <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
    <Field label="Назва позиції"><input required maxLength={120} value={form.name} onChange={e => update("name", e.target.value)} /></Field>
    <Field label="Постачальник"><select required value={form.supplierId} onChange={e => update("supplierId", e.target.value)}><option value="">Оберіть постачальника</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}{s.active ? "" : " · вимкнений"}</option>)}</select></Field>
    <div className="supply-form-grid"><Field label="Чеклист"><select value={form.kind} onChange={e => update("kind", e.target.value)}><option value="stock">Склад</option><option value="display">Вітрина</option></select></Field><Field label="Одиниця замовлення"><input required maxLength={20} value={form.unit} onChange={e => update("unit", e.target.value)} /></Field></div>
    <Field label="Коли замовляти" hint="Орієнтир для швидкої перевірки: запас має вистачити до наступної поставки."><textarea rows={2} maxLength={200} placeholder="Наприклад: замовляємо, коли відкрили резервну упаковку" value={form.threshold} onChange={e => update("threshold", e.target.value)} /></Field>
    <Days label="У які дні перевіряти" value={form.days} onChange={value => update("days", value)} />
    <button type="button" className="supply-link" onClick={() => update("days", [0, 1, 2, 3, 4, 5, 6])}>Обрати кожен день</button>
    <Field label="Порядок у списку"><input type="number" min="0" max="9999" value={form.sortOrder} onChange={e => update("sortOrder", e.target.value)} /></Field>
    <label className="supply-checkbox"><input type="checkbox" checked={form.active} onChange={e => update("active", e.target.checked)} />Активна позиція</label>
    <button className="supply-primary supply-wide" disabled={busy}>{busy ? "Зберігаємо…" : "Зберегти позицію"}</button>
  </form>;
}
export function CheckForm({ product, onSave, busy }) {
  const [quantity, setQuantity] = useState(product.result?.quantity ?? ""), [comment, setComment] = useState(product.result?.comment || ""), [status, setStatus] = useState(product.result?.status || "low");
  return <form onSubmit={e => { e.preventDefault(); onSave({ productId: product.id, status, quantity, comment }); }}>
    <Field label="Стан запасу"><select value={status} onChange={e => setStatus(e.target.value)}><option value="enough">Вистачає</option><option value="low">Замовити</option><option value="critical">Критично</option></select></Field>
    <Field label={`Замовити, ${product.unit}`} hint="Необов’язково. Це кількість для закупки, а не залишок."><input type="number" inputMode="decimal" min="0.01" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} /></Field>
    <Field label="Примітка"><textarea rows={3} maxLength={300} value={comment} onChange={e => setComment(e.target.value)} /></Field>
    <button className="supply-primary supply-wide" disabled={busy}>Зберегти перевірку</button>
  </form>;
}
export function TaskForm({ task, action, suggestedDate, today, onSave, busy }) {
  const [date, setDate] = useState(action === "skip" ? "" : suggestedDate || task.expectedDelivery || today), [comment, setComment] = useState("");
  const title = { ordered: "Замовлення оформлено", received: "Поставку отримано", skip: "Відкласти закупку", reschedule: "Зберегти нову дату" }[action];
  return <form onSubmit={e => { e.preventDefault(); onSave({ id: task.id, action, expectedDelivery: date, reconsiderOn: date, reason: comment, comment }); }}>
    <p className="supply-muted">{action === "received" ? "Підтвердіть отримання всього списку. Після цього позиції знову з’являться для перевірки. Якщо поставка неповна, залиште її очікуваною та уточніть дату залишку." : action === "ordered" ? "Відмічайте після фактичного оформлення у постачальника. Нагадування про це замовлення припиняться." : action === "skip" ? "Потреба повернеться у вибрану дату. Новий критичний результат перевірки може повернути закупку раніше." : "Закупка залишиться в очікуванні. Збережіть погоджену дату та причину зміни."}</p>
    {action !== "received" && <Field label={action === "skip" ? "Перевірити повторно" : "Очікуємо поставку"}><input type="date" required min={today} value={date} onChange={e => setDate(e.target.value)} /></Field>}
    {action !== "received" && <Field label={action === "skip" ? "Причина" : "Примітка"}><textarea required={["skip", "reschedule"].includes(action)} maxLength={300} rows={2} value={comment} onChange={e => setComment(e.target.value)} /></Field>}
    <button className="supply-primary supply-wide" disabled={busy}>{title}</button>
  </form>;
}
