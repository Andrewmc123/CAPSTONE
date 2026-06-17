import { useRef, useState } from "react";

// Swipeable multi-image post (TikTok photo-carousel). Images sit side by side
// in a scroll-snapping track; dots + a counter show progress.
export default function ImageCarousel({ images = [], filter }) {
  const trackRef = useRef(null);
  const [idx, setIdx] = useState(0);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== idx) setIdx(i);
  };

  const go = (i) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="vcarousel">
      <div className="vcarousel-track" ref={trackRef} onScroll={onScroll}>
        {images.map((src, i) => (
          <div className="vcarousel-slide" key={i}>
            <img src={src} alt={`Slide ${i + 1}`} style={{ filter }} loading={i === 0 ? "eager" : "lazy"} draggable={false} />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <span className="vcarousel-count">{idx + 1}/{images.length}</span>
          <div className="vcarousel-dots" onClick={(e) => e.stopPropagation()}>
            {images.map((_, i) => (
              <button
                key={i}
                className={`vcarousel-dot ${i === idx ? "on" : ""}`}
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
