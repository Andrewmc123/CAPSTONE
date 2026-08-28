import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// Elements that own the horizontal axis themselves — a drag starting on one of
// these belongs to that control, not to the tab navigation.
const HANDS_OFF = ".vcarousel-track, .vcard-progress, .action-rail, input, textarea, select, [data-no-swipe]";

// How far you have to pull before it counts, and how far before the gesture is
// treated as horizontal rather than a vertical scroll.
const COMMIT_FRACTION = 0.22;   // of the container width
const COMMIT_CEILING = 130;     // …but never demand more than this many px
const ENGAGE_PX = 10;
const HORIZONTAL_BIAS = 1.2;
const EDGE_RESISTANCE = 0.28;   // rubber-band when there is nowhere to go

const REST = { offset: 0, fraction: 0 };

/**
 * Drag-across navigation between the top-level feeds.
 *
 * Returns pointer handlers to spread onto the swipeable surface, the live
 * `offset` in px to translate that surface by, and `fraction` (-1…1) so the
 * tab bar can slide its indicator in step with the finger.
 *
 * Pointer events rather than touch events, so a trackpad drag on desktop works
 * the same way a finger does on a phone.
 */
export default function useTabSwipe({ index, routes }) {
  const navigate = useNavigate();
  const start = useRef(null);
  // offset and fraction travel together: both are derived from the same drag,
  // and both are computed where the container width is actually known rather
  // than by reading a ref back out during render.
  const [drag, setDrag] = useState(REST);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = useCallback((e) => {
    // secondary mouse buttons and drags off interactive controls are ignored
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target?.closest?.(HANDS_OFF)) return;
    start.current = {
      x: e.clientX,
      y: e.clientY,
      width: e.currentTarget?.getBoundingClientRect().width || window.innerWidth,
      dx: 0,
      engaged: false,
    };
  }, []);

  const onPointerMove = useCallback((e) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;

    if (!s.engaged) {
      // still deciding: a mostly-vertical move hands the gesture back to the
      // feed's own scrolling and we stay out of it for the rest of the drag
      if (Math.abs(dy) > ENGAGE_PX && Math.abs(dy) >= Math.abs(dx) * HORIZONTAL_BIAS) {
        start.current = null;
        return;
      }
      if (Math.abs(dx) < ENGAGE_PX) return;
      if (Math.abs(dx) < Math.abs(dy) * HORIZONTAL_BIAS) return;
      s.engaged = true;
      setDragging(true);
    }

    // dragging left moves toward the next tab, right toward the previous one
    const target = dx < 0 ? index + 1 : index - 1;
    const blocked = target < 0 || target >= routes.length;
    const offset = blocked ? dx * EDGE_RESISTANCE : dx;

    s.dx = offset;
    // how far through the commit distance we are, signed, capped at one tab
    const span = Math.min(s.width * COMMIT_FRACTION, COMMIT_CEILING);
    setDrag({
      offset,
      fraction: Math.max(-1, Math.min(1, offset / span)),
    });
  }, [index, routes.length]);

  const finish = useCallback(() => {
    const s = start.current;
    start.current = null;
    setDragging(false);
    setDrag(REST);   // the surface springs back either way

    if (!s?.engaged) return;

    const threshold = Math.min(s.width * COMMIT_FRACTION, COMMIT_CEILING);
    const target = s.dx < 0 ? index + 1 : index - 1;
    if (Math.abs(s.dx) >= threshold && target >= 0 && target < routes.length) {
      navigate(routes[target]);
    }
  }, [index, routes, navigate]);

  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: finish,
      onPointerLeave: finish,
    },
    offset: drag.offset,
    fraction: drag.fraction,
    dragging,
  };
}
