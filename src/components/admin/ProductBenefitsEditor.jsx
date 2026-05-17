import { Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { parseTextList, serializeTextList } from "../../utils/textList.js";

function getRows(value) {
  const rows = parseTextList(value);

  return rows.length ? rows : [""];
}

export default function ProductBenefitsEditor({
  value,
  onChange,
  compact = false,
}) {
  const [rows, setRows] = useState(() => getRows(value));
  const lastValueRef = useRef(value || "");

  useEffect(() => {
    const nextValue = value || "";

    if (nextValue !== lastValueRef.current) {
      setRows(getRows(nextValue));
      lastValueRef.current = nextValue;
    }
  }, [value]);

  function commitRows(nextRows) {
    const visibleRows = nextRows.length ? nextRows : [""];
    const nextValue = serializeTextList(visibleRows);

    setRows(visibleRows);
    lastValueRef.current = nextValue;
    onChange(nextValue);
  }

  function updateRow(index, nextText) {
    commitRows(
      rows.map((row, rowIndex) => (rowIndex === index ? nextText : row))
    );
  }

  function addRow() {
    setRows((currentRows) => [...currentRows, ""]);
  }

  function removeRow(index) {
    commitRows(rows.filter((_, rowIndex) => rowIndex !== index));
  }

  const textareaClass = compact
    ? "eg-field min-h-20 w-full resize-y rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm leading-6 outline-none transition focus:border-emerald-700"
    : "eg-field min-h-24 w-full resize-y rounded-[1.3rem] border border-stone-200 bg-white/85 px-5 py-3.5 leading-7 outline-none backdrop-blur focus:border-emerald-700 focus:bg-white";

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div
          key={index}
          className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2"
        >
          <textarea
            value={row}
            onChange={(event) => updateRow(index, event.target.value)}
            rows={compact ? 2 : 3}
            placeholder={`Перевага ${index + 1}`}
            className={textareaClass}
          />

          <button
            type="button"
            onClick={() => removeRow(index)}
            aria-label="Видалити перевагу"
            className={`eg-icon-button grid shrink-0 place-items-center rounded-xl border border-stone-200 bg-white text-stone-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700 ${
              compact ? "h-10 w-10" : "h-12 w-12"
            }`}
          >
            <Trash2 size={compact ? 16 : 18} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className={`eg-button inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 font-black text-emerald-950 hover:bg-emerald-100 ${
          compact ? "px-3 py-2 text-sm" : "px-4 py-3 text-sm"
        }`}
      >
        <Plus size={17} />
        <span>Додати перевагу</span>
      </button>
    </div>
  );
}
