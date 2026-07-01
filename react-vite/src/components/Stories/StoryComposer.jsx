import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { FaCameraRotate, FaImage, FaXmark } from "react-icons/fa6";
import { useModal } from "../../context/Modal";
import { thunkCreateStory } from "../../redux/stories";
import "./StoryComposer.css";

const MAX_SECS = 30; // stories cap short-form video like the rest of the app

// Camera-first story creator: live capture (photo shutter or hold-to-record
// video), flip camera, or import from the gallery — then review + share.
// The posted story auto-expires after 24h (handled server-side).
export default function StoryComposer({ onPosted }) {
  const { closeModal } = useModal();
  const dispatch = useDispatch();

  const liveRef = useRef(null);
  const streamRef = useRef(null);
  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const recStart = useRef(0);
  const fileRef = useRef(null);

  const [view, setView] = useState("camera");          // camera | review
  const [captureMode, setCaptureMode] = useState("photo"); // photo | video
  const [facingMode, setFacingMode] = useState("user");
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [camError, setCamError] = useState("");
  const [blob, setBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [kind, setKind] = useState("image");           // image | video
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (facing) => {
    setCamError("");
    try {
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      });
      streamRef.current = stream;
      if (liveRef.current) {
        liveRef.current.srcObject = stream;
        liveRef.current.play().catch(() => {});
      }
    } catch {
      setCamError("Camera unavailable — import a photo or video instead.");
    }
  }, [stopStream]);

  // (re)start the camera whenever we're on the camera view
  useEffect(() => {
    if (view === "camera") startCamera(facingMode);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // hard cleanup on unmount
  useEffect(() => () => { stopStream(); clearInterval(timerRef.current); }, [stopStream]);

  const flip = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startCamera(next);
  };

  const toReview = (b, k) => {
    stopStream();
    setBlob(b);
    setKind(k);
    setPreviewUrl(URL.createObjectURL(b));
    setView("review");
  };

  const capturePhoto = () => {
    const v = liveRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d").drawImage(v, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((b) => b && toReview(b, "image"), "image/jpeg", 0.9);
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
  };

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    try {
      recRef.current = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9,opus" });
    } catch {
      recRef.current = new MediaRecorder(stream);
    }
    const rec = recRef.current;
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      setRecording(false);
      toReview(new Blob(chunksRef.current, { type: "video/webm" }), "video");
    };
    rec.start();
    setRecording(true);
    setRecordSecs(0);
    recStart.current = Date.now();
    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - recStart.current) / 1000);
      setRecordSecs(secs);
      if (secs >= MAX_SECS) stopRecording();
    }, 250);
  };

  const onShutter = () => {
    if (captureMode === "photo") capturePhoto();
    else if (recording) stopRecording();
    else startRecording();
  };

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    toReview(f, f.type.startsWith("video") ? "video" : "image");
  };

  const retake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setBlob(null);
    setPreviewUrl(null);
    setError("");
    setView("camera");
  };

  const share = async () => {
    if (!blob) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", blob, kind === "video" ? "story.webm" : "story.jpg");
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
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="story-composer">
      <div className="story-composer-bar">
        <h2 className="story-composer-title">Add to your story</h2>
        <button className="story-close" onClick={closeModal} aria-label="Close"><FaXmark /></button>
      </div>

      {view === "camera" ? (
        <>
          <div className="story-camera">
            {camError ? (
              <div className="story-cam-error"><p>{camError}</p></div>
            ) : (
              <video
                ref={liveRef}
                className="story-cam-video"
                autoPlay
                playsInline
                muted
                style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
              />
            )}
            {recording && (
              <div className="story-rec-badge"><span className="story-rec-dot" /> {recordSecs}s</div>
            )}
          </div>

          <div className="story-mode-row">
            <button className={`story-mode ${captureMode === "photo" ? "on" : ""}`} onClick={() => setCaptureMode("photo")} disabled={recording}>Photo</button>
            <button className={`story-mode ${captureMode === "video" ? "on" : ""}`} onClick={() => setCaptureMode("video")} disabled={recording}>Video</button>
          </div>

          <div className="story-cam-controls">
            <button className="story-cam-side" onClick={() => fileRef.current?.click()} aria-label="Import from gallery"><FaImage /></button>
            <button
              className={`story-shutter ${captureMode === "video" ? "video" : ""} ${recording ? "recording" : ""}`}
              onClick={onShutter}
              disabled={!!camError}
              aria-label={captureMode === "photo" ? "Take photo" : recording ? "Stop recording" : "Start recording"}
            />
            <button className="story-cam-side" onClick={flip} aria-label="Flip camera" disabled={!!camError}><FaCameraRotate /></button>
          </div>
          <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={pickFile} />
          <p className="story-composer-sub">Your story disappears after 24 hours.</p>
        </>
      ) : (
        <>
          <div className="story-camera">
            {kind === "video"
              ? <video src={previewUrl} className="story-cam-video" autoPlay loop muted playsInline />
              : <img src={previewUrl} className="story-cam-video" alt="preview" />}
          </div>
          <input
            className="story-caption-input"
            placeholder="Add a caption (optional)"
            maxLength={200}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          {error && <p className="story-error">{error}</p>}
          <div className="story-composer-actions">
            <button className="btn" onClick={retake} disabled={busy}>Retake</button>
            <button className="btn btn-primary" onClick={share} disabled={busy}>
              {busy ? "Sharing…" : "Share to story"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
