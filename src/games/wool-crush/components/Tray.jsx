import WoolBall from "./WoolBall";
import { WOOL_COLORS } from "../lib/colors";

// Shuffled color items. Tap the one matching the dragon's next-required color.
// items: [{ id, color, used }]
export default function Tray({ items, shakeId, onPick, disabled }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          disabled={disabled || it.used}
          onClick={() => onPick(it.id)}
          aria-label={`item ${it.color}`}
          className={`h-12 w-12 rounded-lg transition sm:h-14 sm:w-14 ${
            it.used
              ? "pointer-events-none scale-50 opacity-0"
              : "hover:scale-110"
          } ${shakeId === it.id ? "wool-shake" : ""}`}
        >
          <WoolBall color={WOOL_COLORS[it.color]} className="h-full w-full drop-shadow" />
        </button>
      ))}
    </div>
  );
}
