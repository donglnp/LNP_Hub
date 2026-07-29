import WoolBall from "./WoolBall";
import { WOOL_COLORS } from "../lib/colors";

// The dragon flies left -> right over `crossMs`. Its scales show the color
// sequence; cleared scales dim, and the next-required scale pulses.
export default function Dragon({ sequence, progress, running, crossMs }) {
  return (
    <div className="relative h-24 overflow-hidden rounded-t-xl">
      <div
        className="absolute top-1/2 flex items-center gap-1"
        style={{
          transform: "translateY(-50%)",
          left: running ? "115%" : "-25%",
          transition: running ? `left ${crossMs}ms linear` : "none",
        }}
      >
        <span className="text-3xl sm:text-4xl">🐉</span>
        {sequence.map((colorId, i) => {
          const cleared = i < progress;
          const isNext = i === progress;
          return (
            <WoolBall
              key={i}
              color={WOOL_COLORS[colorId]}
              className={`h-7 w-7 shrink-0 transition sm:h-9 sm:w-9 ${
                cleared ? "opacity-20 grayscale" : "drop-shadow"
              } ${isNext ? "wool-next" : ""}`}
            />
          );
        })}
      </div>
    </div>
  );
}
