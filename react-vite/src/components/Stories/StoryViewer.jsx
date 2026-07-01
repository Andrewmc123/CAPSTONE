import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { FaXmark, FaTrash } from "react-icons/fa6";
import { useModal } from "../../context/Modal";
import { thunkDeleteStory } from "../../redux/stories";
import { timeAgo } from "../../utils/format";
import "./StoryViewer.css";

const IMAGE_MS = 5000; // how long each photo story shows before advancing

// Full-screen story reel with segmented progress bars, tap to advance / go back,
// auto-advance for photos, and (own stories) a delete button.
export default function StoryViewer({ stories = [], startIndex = 0, canDelete = false, onChanged }) {
  const { closeModal } = useModal();
  const dispatch = useDispatch();
  const [idx, setIdx] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const raf = useRef(null);
  const startedAt = useRef(0);

  const current = stories[idx];

  const next = () => {
    setProgress(0);
    if (idx < stories.length - 1) setIdx((i) => i + 1);
    else closeModal();
  };
  const prev = () => {
    setProgress(0);
    if (idx > 0) setIdx((i) => i - 1);
  };

  // auto-advance photos; videos advance on their own `ended` event
  useEffect(() => {
    if (!current || current.media_type === "video") return;
    startedAt.current = Date.now();
    setProgress(0);
    const tick = () => {
      const p = Math.min(1, (Date.now() - startedAt.current) / IMAGE_MS);
      setProgress(p);
      if (p >= 1) next();
      else raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, current?.id]);

  if (!current) {
    closeModal();
    return null;
  }

  const del = async () => {
    if (!window.confirm("Delete this story?")) return;
    await dispatch(thunkDeleteStory(current.id));
    onChanged && onChanged();
    closeModal();
  };

  return (
    <div className="story-viewer" onClick={(e) => e.stopPropagation()}>
      <div className="story-progress-row">
        {stories.map((s, i) => (
          <div key={s.id} className="story-progress-track">
            <div
              className="story-progress-fill"
              style={{ width: i < idx ? "100%" : i === idx ? `${progress * 100}%` : "0%" }}
            />
          </div>
        ))}
      </div>

      <div className="story-viewer-head">
        <div className="story-viewer-user">
          <img
            className="avatar"
            style={{ width: 32, height: 32 }}
            src={current.user?.profile_img || `https://i.pravatar.cc/60?u=${current.user_id}`}
            alt=""
          />
          <span className="story-viewer-name">@{current.user?.username}</span>
          <span className="story-viewer-time">{timeAgo(current.created_at)}</span>
        </div>
        <div className="story-viewer-actions">
          {canDelete && (
            <button className="story-icon-btn" onClick={del} aria-label="Delete story"><FaTrash /></button>
          )}
          <button className="story-icon-btn" onClick={closeModal} aria-label="Close"><FaXmark /></button>
        </div>
      </div>

      <div className="story-stage">
        {current.media_type === "video" ? (
          <video src={current.media_url} className="story-media" autoPlay playsInline onEnded={next} />
        ) : (
          <img src={current.media_url} className="story-media" alt={current.caption || "story"} />
        )}
        {current.caption && <div className="story-caption-overlay">{current.caption}</div>}
        <button className="story-tap story-tap-prev" onClick={prev} aria-label="Previous" />
        <button className="story-tap story-tap-next" onClick={next} aria-label="Next" />
      </div>
    </div>
  );
}
