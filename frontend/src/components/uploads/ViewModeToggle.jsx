import { LayoutGrid, Grid3x3, List } from "lucide-react";

const modes = [
  { value: "compact", label: "Compact", Icon: LayoutGrid },
  { value: "grid", label: "Grid", Icon: Grid3x3 },
  { value: "list", label: "List", Icon: List },
];

export default function ViewModeToggle({ viewMode, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
      {modes.map(({ value, label, Icon }) => {
        const active = viewMode === value;
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
              active
                ? "bg-[#534AB7] text-white"
                : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
