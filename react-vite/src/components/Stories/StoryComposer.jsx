import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useModal } from "../../context/Modal";
import { thunkCreateStory } from "../../redux/stories";
import "./StoryComposer.css";

// Add-to-your-story sheet: pick a photo/video, optional caption, share.
// The story auto-expires 24h after posting (handled server-side).
export default function StoryComposer({ onPosted }) {
  const { closeModal } = useModal();
  const dispatch = useDispatch();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [kind, setKind] = useState("image");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setKind(f.type.startsWith("video") ? "video" : "image");
    setPreview(URL.createObjectURL(f));
    setError("");
  };

  const share = async () => {
    if (!file) {
      setError("Pick a photo or video first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const up = await fetch("/api/uploads", { method: "POST", body: form, credentials: "include" });
      if (!up.ok) throw new Error("upload failed");
      const { url, media_kind } = await up.json();
      const story = await dispatch(thunkCreateStory({
        media_url: url,
        media_type: media_kind === "video" ? "video" : "image",
        caption,
      }));
      if (!story) throw new Error("post failed");
      onPosted && onPosted(story);
      closeModal();
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="story-composer">
      <h2 className="story-composer-title">Add to your story</h2>
      <p className="story-composer-sub">Your story disappears after 24 hours.</p>

      <div className={`story-drop ${preview ? "has-media" : ""}`} onClick={() => fileRef.current?.click()}>
        {preview ? (
          kind === "video" ? (
            <video src={preview} className="story-preview" muted autoPlay loop playsInline />
          ) : (
            <img src={preview} className="story-preview" alt="preview" />
          )
        ) : (
          <div className="story-drop-hint">
            <span className="story-drop-plus">+</span>
            <span>Tap to pick a photo or video</span>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={pick} />

      <input
        className="story-caption-input"
        placeholder="Add a caption (optional)"
        maxLength={200}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />

      {error && <p className="story-error">{error}</p>}

      <div className="story-composer-actions">
        <button className="btn" onClick={closeModal} disabled={busy}>Cancel</button>
        <button className="btn btn-primary" onClick={share} disabled={busy || !file}>
          {busy ? "Sharing…" : "Share to story"}
        </button>
      </div>
    </div>
  );
}
