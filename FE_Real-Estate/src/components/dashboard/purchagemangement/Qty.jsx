export default function Qty({ value = 0, onChange }) {
  return (
    <div className="inline-flex items-center gap-2">
      <button
        className="w-8 h-8 rounded border border-[#e8edf6]"
        onClick={() => onChange(Math.max(0, value - 1))}
      >
        –
      </button>
      <div className="w-10 h-8 grid place-items-center rounded border border-[#e8edf6] text-sm">
        {value}
      </div>
      <button
        className="w-8 h-8 rounded border border-[#e8edf6]"
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
