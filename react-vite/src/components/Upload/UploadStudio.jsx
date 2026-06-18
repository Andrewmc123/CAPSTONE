import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FaCloudArrowUp, FaVideo, FaWandMagicSparkles, FaMusic, FaFont,
  FaArrowLeft, FaStop, FaXmark, FaPlay, FaPause, FaImage, FaScissors,
  FaCameraRotate, FaEllipsisVertical,
} from "react-icons/fa6";
import { thunkCreatePost } from "../../redux/posts";
import { FILTERS, TEXT_COLORS, TEXT_FONTS, filterCss } from "../../utils/filters";
import GifPicker from "../Feed/GifPicker";
import { splitCaption } from "../../utils/format";
import "./Upload.css";

const SPEEDS = [0.5, 1, 1.5, 2];
const SUGGESTED_TAGS = ["fyp", "aboutlastnight", "funny", "dance", "vibes", "gif", "food", "gaming", "sports", "animals"];

export default function UploadStudio() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.session.user);

  // flow: select -> edit -> details
  const [step, setStep] = useState("select");
  const [file, setFile] = useState(null);          // File | Blob
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaKind, setMediaKind] = useState("video"); // video | image | gif
  const [gifPost, setGifPost] = useState(null);    // selected GIF for gif posts
  const [dragOver, setDragOver] = useState(false);

  // camera (camera-first capture, TikTok-style)
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [facingMode, setFacingMode] = useState("user");
  const [camError, setCamError] = useState("");
  const [camGifOpen, setCamGifOpen] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const fileInputRef = useRef(null);
  const liveRef = useRef(null);
  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  // editor state
  const videoRef = useRef(null);
  const stageRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [editTool, setEditTool] = useState("filters"); // filters | trim | speed | text | sound | cover
  const [filter, setFilter] = useState("none");
  const [speed, setSpeed] = useState(1);
  const [trim, setTrim] = useState(null); // {start, end}
  const [texts, setTexts] = useState([]);
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [sounds, setSounds] = useState([]);
  const [pickedSound, setPickedSound] = useState(null);
  const [videoVolume, setVideoVolume] = useState(1);
  const [soundVolume, setSoundVolume] = useState(0.9);
  const [coverTime, setCoverTime] = useState(0);
  const previewAudioRef = useRef(null);
  const dragInfo = useRef(null);

  // details
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  // ---------- select step ----------
  const acceptFile = useCallback((picked) => {
    if (!picked) return;
    const kind = picked.type.startsWith("video")
      ? "video"
      : picked.type === "image/gif" ? "gif" : "image";
    setFile(picked);
    setMediaKind(kind);
    setGifPost(null);
    const url = URL.createObjectURL(picked);
    setPreviewUrl(url);
    setStep(kind === "video" ? "edit" : "details");
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  // ---------- camera ----------
  const startCamera = useCallback(async (facing = "user") => {
    setCamError("");
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
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
      setCamError("Camera unavailable — you can still upload a video or pick a GIF below.");
    }
  }, []);

  const flipCamera = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startCamera(next);
  };

  // open the camera the moment we land on the capture step
  useEffect(() => {
    if (step === "select" && user) startCamera(facingMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, user]);

  // release the camera as soon as we leave capture (edit/details/unmount)
  useEffect(() => {
    if (step !== "select" && streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, [step]);

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9" : "video/webm";
    const rec = new MediaRecorder(stream, { mimeType: mime });
    rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      closeRecorder();
      acceptFile(new File([blob], "abln-recording.webm", { type: "video/webm" }));
    };
    rec.start(200);
    recRef.current = rec;
    setRecording(true);
    setRecordSecs(0);
    timerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    setRecording(false);
    if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
  };

  const closeRecorder = useCallback(() => {
    clearInterval(timerRef.current);
    setRecording(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    closeRecorder();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- sounds ----------
  useEffect(() => {
    fetch("/api/discover/sounds")
      .then((r) => r.json())
      .then((d) => setSounds(d.sounds || []))
      .catch(() => {});
  }, []);

  const auditionSound = (sound) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (pickedSound?.id === sound.id) {
      setPickedSound(null);
      return;
    }
    setPickedSound(sound);
    setVideoVolume(0.25);
    const audio = new Audio(sound.url);
    audio.volume = soundVolume;
    audio.play().catch(() => {});
    previewAudioRef.current = audio;
  };

  useEffect(() => () => {
    if (previewAudioRef.current) previewAudioRef.current.pause();
  }, []);

  // ---------- edit preview behavior ----------
  const onLoadedMeta = () => {
    const v = videoRef.current;
    if (v && Number.isFinite(v.duration)) {
      setDuration(v.duration);
      if (!trim) setTrim({ start: 0, end: v.duration });
    }
  };

  const onPreviewTime = () => {
    const v = videoRef.current;
    if (!v || !trim) return;
    if (v.currentTime >= trim.end - 0.05 || v.currentTime < trim.start - 0.25) {
      v.currentTime = trim.start;
    }
  };

  const togglePreview = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); } else { v.pause(); }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.playbackRate = speed;
  }, [speed, previewUrl]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.volume = Math.min(1, videoVolume);
  }, [videoVolume, previewUrl]);

  // ---------- text overlays ----------
  const addText = () => {
    const id = Date.now();
    setTexts((t) => [...t, {
      id, value: "Your text", x: 50, y: 35, color: "#ffffff", size: 28, font: "classic",
    }]);
    setSelectedTextId(id);
    setEditTool("text");
  };

  const updateText = (id, patch) =>
    setTexts((t) => t.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const removeText = (id) => {
    setTexts((t) => t.filter((x) => x.id !== id));
    setSelectedTextId(null);
  };

  const startDragText = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedTextId(id);
    dragInfo.current = { id };
    const move = (ev) => {
      const stage = stageRef.current;
      if (!stage || !dragInfo.current) return;
      const rect = stage.getBoundingClientRect();
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const x = Math.min(96, Math.max(4, ((cx - rect.left) / rect.width) * 100));
      const y = Math.min(94, Math.max(4, ((cy - rect.top) / rect.height) * 100));
      updateText(dragInfo.current.id, { x, y });
    };
    const up = () => {
      dragInfo.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const selectedText = texts.find((t) => t.id === selectedTextId);

  // ---------- cover ----------
  const captureCover = () => {
    const v = videoRef.current;
    if (v) {
      v.currentTime = coverTime;
    }
  };

  const grabCoverBlob = async () => {
    const v = videoRef.current;
    if (!v) return null;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = v.videoWidth;
      canvas.height = v.videoHeight;
      canvas.getContext("2d").drawImage(v, 0, 0);
      return await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    } catch {
      return null; // cross-origin frame — skip cover
    }
  };

  // ---------- publish ----------
  const uploadBlob = async (blob, name) => {
    const form = new FormData();
    form.append("file", new File([blob], name, { type: blob.type }));
    const res = await fetch("/api/uploads", { method: "POST", body: form, credentials: "include" });
    if (!res.ok) throw new Error("upload failed");
    return (await res.json()).url;
  };

  const publish = async () => {
    setError("");
    setPosting(true);
    try {
      let video_url = null;
      let image_url = null;
      let media_type = mediaKind;

      if (gifPost) {
        image_url = gifPost.url;
        media_type = "gif";
      } else if (file) {
        const url = await uploadBlob(file, file.name || `abln-${Date.now()}`);
        if (mediaKind === "video") {
          video_url = url;
          if (videoRef.current) {
            const cover = await grabCoverBlob();
            if (cover) image_url = await uploadBlob(cover, "cover.jpg");
          }
        } else {
          image_url = url;
        }
      }

      const edit_data = mediaKind === "video" ? {
        filter,
        speed,
        trim: trim && duration && (trim.start > 0.2 || trim.end < duration - 0.2)
          ? { start: Number(trim.start.toFixed(2)), end: Number(trim.end.toFixed(2)) }
          : null,
        texts,
        videoVolume: pickedSound ? videoVolume : 1,
        soundVolume,
      } : (filter !== "none" ? { filter } : null);

      const result = await dispatch(thunkCreatePost({
        body: caption.trim(),
        video_url,
        image_url,
        media_type,
        sound_name: pickedSound ? pickedSound.name : null,
        sound_url: pickedSound ? pickedSound.url : null,
        edit_data,
      }));

      if (result.post) {
        navigate(`/video/${result.post.id}`);
      } else {
        setError(result.error || "Something went wrong");
        setPosting(false);
      }
    } catch {
      setError("Upload failed — try a smaller file");
      setPosting(false);
    }
  };

  const captionParts = useMemo(() => splitCaption(caption), [caption]);

  if (!user) return null;

  // ============== RENDER ==============
  return (
    <div className="studio">
      <header className="studio-head">
        {step !== "select" ? (
          <button className="studio-back" onClick={() => setStep(step === "details" && mediaKind === "video" ? "edit" : "select")}>
            <FaArrowLeft /> Back
          </button>
        ) : <span />}
        <h1><FaWandMagicSparkles /> Upload</h1>
        <span className="studio-step-label">
          {step === "select" ? "1 · Pick" : step === "edit" ? "2 · Edit" : "3 · Post"}
        </span>
      </header>

      {/* ---------- STEP: SELECT ---------- */}
      {step === "select" && (
        <div
          className="cam fade-in"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          {/* full-screen live camera */}
          <video
            ref={liveRef}
            className={`cam-live ${facingMode === "user" ? "mirror" : ""} ${dragOver ? "drag" : ""}`}
            muted
            playsInline
          />

          {camError && (
            <div className="cam-error">
              <FaVideo />
              <p>{camError}</p>
            </div>
          )}

          {/* top bar: close · status · flip */}
          <div className="cam-top">
            <button className="cam-icon" onClick={() => navigate(-1)} aria-label="Close">
              <FaXmark />
            </button>
            {recording
              ? <span className="cam-timer">● {recordSecs}s</span>
              : <span className="cam-mode"><FaVideo /> Video</span>}
            <button className="cam-icon" onClick={flipCamera} aria-label="Flip camera">
              <FaCameraRotate />
            </button>
          </div>

          {/* side dropdown: upload · GIF · flip */}
          <div className={`cam-side ${sideOpen ? "open" : ""}`}>
            <button className="cam-side-toggle" onClick={() => setSideOpen((v) => !v)} aria-label="More options">
              <FaEllipsisVertical />
            </button>
            <div className="cam-side-menu">
              <button onClick={() => { setSideOpen(false); fileInputRef.current?.click(); }}>
                <FaCloudArrowUp /><span>Upload</span>
              </button>
              <button onClick={() => { setSideOpen(false); setCamGifOpen(true); }}>
                <FaWandMagicSparkles /><span>GIF</span>
              </button>
              <button onClick={() => { setSideOpen(false); flipCamera(); }}>
                <FaCameraRotate /><span>Flip</span>
              </button>
            </div>
          </div>

          {/* bottom controls: gallery · shutter · GIF */}
          <div className="cam-bottom">
            <label className="cam-gallery" aria-label="Upload from device">
              <FaImage />
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept="video/*,image/*"
                onChange={(e) => acceptFile(e.target.files?.[0])}
              />
            </label>

            {recording ? (
              <button className="cam-shutter recording" onClick={stopRecording} aria-label="Stop recording">
                <FaStop />
              </button>
            ) : (
              <button className="cam-shutter" onClick={startRecording} aria-label="Record">
                <span className="cam-shutter-dot" />
              </button>
            )}

            <button className="cam-gallery" onClick={() => setCamGifOpen(true)} aria-label="Post a GIF">
              <FaWandMagicSparkles />
            </button>
          </div>

          {/* GIF picker sheet */}
          {camGifOpen && (
            <div className="cam-gif-sheet" onClick={() => setCamGifOpen(false)}>
              <div className="cam-gif-inner" onClick={(e) => e.stopPropagation()}>
                <GifPicker
                  title="Pick your GIF post"
                  onSelect={(gif) => {
                    setGifPost(gif);
                    setPreviewUrl(gif.url);
                    setMediaKind("gif");
                    setFile(null);
                    setCamGifOpen(false);
                    setStep("details");
                  }}
                  onClose={() => setCamGifOpen(false)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------- STEP: EDIT ---------- */}
      {step === "edit" && previewUrl && (
        <div className="studio-edit fade-in">
          <div className="studio-stage-wrap">
            <div className="studio-stage" ref={stageRef} onClick={togglePreview}>
              <video
                ref={videoRef}
                src={previewUrl}
                className="studio-preview"
                style={{ filter: filterCss(filter) }}
                onLoadedMetadata={onLoadedMeta}
                onTimeUpdate={onPreviewTime}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                loop
                playsInline
              />
              {texts.map((t) => (
                <span
                  key={t.id}
                  className={`studio-text ${selectedTextId === t.id ? "selected" : ""}`}
                  style={{
                    left: `${t.x}%`, top: `${t.y}%`, color: t.color, fontSize: `${t.size}px`,
                    fontFamily: TEXT_FONTS[t.font].css, fontWeight: TEXT_FONTS[t.font].weight,
                  }}
                  onPointerDown={(e) => startDragText(e, t.id)}
                >
                  {t.value}
                </span>
              ))}
              <span className="studio-play-hint">{playing ? <FaPause /> : <FaPlay />}</span>
            </div>
            <p className="studio-hint">Tap to play/pause · drag text to place it</p>
          </div>

          <div className="studio-tools">
            <div className="studio-tool-tabs">
              <button className={editTool === "filters" ? "on" : ""} onClick={() => setEditTool("filters")}><FaWandMagicSparkles /> Filters</button>
              <button className={editTool === "trim" ? "on" : ""} onClick={() => setEditTool("trim")}><FaScissors /> Trim</button>
              <button className={editTool === "speed" ? "on" : ""} onClick={() => setEditTool("speed")}>⚡ Speed</button>
              <button className={editTool === "text" ? "on" : ""} onClick={() => setEditTool("text")}><FaFont /> Text</button>
              <button className={editTool === "sound" ? "on" : ""} onClick={() => setEditTool("sound")}><FaMusic /> Sound</button>
              <button className={editTool === "cover" ? "on" : ""} onClick={() => setEditTool("cover")}><FaImage /> Cover</button>
            </div>

            <div className="studio-tool-panel">
              {editTool === "filters" && (
                <div className="filter-row">
                  {Object.entries(FILTERS).map(([key, f]) => (
                    <button
                      key={key}
                      className={`filter-chip ${filter === key ? "on" : ""}`}
                      onClick={() => setFilter(key)}
                    >
                      <span className="filter-dot" style={{ filter: f.css === "none" ? "none" : f.css }} />
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              {editTool === "trim" && trim && (
                <div className="trim-panel">
                  <label>Start: {trim.start.toFixed(1)}s</label>
                  <input
                    type="range" min={0} max={duration || 0} step={0.1} value={trim.start}
                    onChange={(e) => {
                      const start = Math.min(Number(e.target.value), trim.end - 0.5);
                      setTrim({ ...trim, start });
                      if (videoRef.current) videoRef.current.currentTime = start;
                    }}
                  />
                  <label>End: {trim.end.toFixed(1)}s</label>
                  <input
                    type="range" min={0} max={duration || 0} step={0.1} value={trim.end}
                    onChange={(e) => {
                      const end = Math.max(Number(e.target.value), trim.start + 0.5);
                      setTrim({ ...trim, end });
                    }}
                  />
                  <p className="studio-hint">Clip length: {(trim.end - trim.start).toFixed(1)}s</p>
                </div>
              )}

              {editTool === "speed" && (
                <div className="speed-row">
                  {SPEEDS.map((s) => (
                    <button key={s} className={`chip ${speed === s ? "active" : ""}`} onClick={() => setSpeed(s)}>
                      {s}x
                    </button>
                  ))}
                </div>
              )}

              {editTool === "text" && (
                <div className="text-panel">
                  <button className="btn btn-ghost" onClick={addText}><FaFont /> Add text</button>
                  {selectedText && (
                    <div className="text-editor fade-in">
                      <input
                        className="input"
                        value={selectedText.value}
                        onChange={(e) => updateText(selectedText.id, { value: e.target.value })}
                        maxLength={60}
                      />
                      <div className="text-colors">
                        {TEXT_COLORS.map((c) => (
                          <button
                            key={c}
                            className={`color-dot ${selectedText.color === c ? "on" : ""}`}
                            style={{ background: c }}
                            onClick={() => updateText(selectedText.id, { color: c })}
                            aria-label={`Color ${c}`}
                          />
                        ))}
                      </div>
                      <div className="text-fonts">
                        {Object.entries(TEXT_FONTS).map(([key, f]) => (
                          <button
                            key={key}
                            className={`chip ${selectedText.font === key ? "active" : ""}`}
                            style={{ fontFamily: f.css }}
                            onClick={() => updateText(selectedText.id, { font: key })}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                      <label className="studio-hint">Size: {selectedText.size}px</label>
                      <input
                        type="range" min={14} max={64} value={selectedText.size}
                        onChange={(e) => updateText(selectedText.id, { size: Number(e.target.value) })}
                      />
                      <button className="btn btn-ghost text-delete" onClick={() => removeText(selectedText.id)}>
                        Delete text
                      </button>
                    </div>
                  )}
                  {!selectedText && texts.length > 0 && (
                    <p className="studio-hint">Tap a text on the preview to edit it</p>
                  )}
                </div>
              )}

              {editTool === "sound" && (
                <div className="sound-panel">
                  {sounds.map((s) => (
                    <button
                      key={s.id}
                      className={`sound-row ${pickedSound?.id === s.id ? "on" : ""}`}
                      onClick={() => auditionSound(s)}
                    >
                      <span className="sound-emoji">{s.emoji}</span>
                      <span className="sound-meta">
                        <strong>{s.name}</strong>
                        <em>{s.artist}</em>
                      </span>
                      {pickedSound?.id === s.id && <span className="sound-on">✓</span>}
                    </button>
                  ))}
                  {pickedSound && (
                    <div className="mix-panel">
                      <label className="studio-hint">Original audio: {Math.round(videoVolume * 100)}%</label>
                      <input type="range" min={0} max={1} step={0.05} value={videoVolume}
                        onChange={(e) => setVideoVolume(Number(e.target.value))} />
                      <label className="studio-hint">Sound: {Math.round(soundVolume * 100)}%</label>
                      <input type="range" min={0} max={1} step={0.05} value={soundVolume}
                        onChange={(e) => {
                          setSoundVolume(Number(e.target.value));
                          if (previewAudioRef.current) previewAudioRef.current.volume = Number(e.target.value);
                        }} />
                    </div>
                  )}
                </div>
              )}

              {editTool === "cover" && (
                <div className="cover-panel">
                  <label className="studio-hint">Scrub to the frame you want as the cover</label>
                  <input
                    type="range" min={0} max={duration || 0} step={0.1} value={coverTime}
                    onChange={(e) => {
                      setCoverTime(Number(e.target.value));
                      if (videoRef.current) videoRef.current.currentTime = Number(e.target.value);
                    }}
                  />
                  <button className="btn btn-ghost" onClick={captureCover}>Preview this frame</button>
                  <p className="studio-hint">The visible frame is captured when you post.</p>
                </div>
              )}
            </div>

            <button className="btn btn-grad studio-next" onClick={() => { videoRef.current?.pause(); if (previewAudioRef.current) previewAudioRef.current.pause(); setStep("details"); }}>
              Next: caption & post →
            </button>
          </div>
        </div>
      )}

      {/* ---------- STEP: DETAILS ---------- */}
      {step === "details" && (
        <div className="studio-details fade-in">
          <div className="details-preview">
            {mediaKind === "video" ? (
              <video src={previewUrl} style={{ filter: filterCss(filter) }} muted loop autoPlay playsInline />
            ) : (
              <img src={previewUrl} alt="preview" style={{ filter: filterCss(filter) }} />
            )}
            {gifPost && <span className="vgrid-gif-badge">GIF</span>}
            {pickedSound && (
              <div className="details-sound"><FaMusic /> {pickedSound.name}</div>
            )}
          </div>

          <div className="details-form">
            <label className="edit-label">Caption</label>
            <textarea
              className="input details-caption"
              rows={4}
              maxLength={300}
              placeholder="Describe your night… add #hashtags to get discovered"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <div className="details-caption-preview">
              {captionParts.map((p, i) =>
                p.type === "tag"
                  ? <strong key={i} className="text-neon">#{p.value}</strong>
                  : <span key={i}>{p.value}</span>
              )}
            </div>

            <div className="details-tags">
              {SUGGESTED_TAGS.map((t) => (
                <button
                  key={t}
                  className="chip"
                  onClick={() => setCaption((c) => (c.includes(`#${t}`) ? c : `${c.trimEnd()} #${t}`.trim()))}
                >
                  #{t}
                </button>
              ))}
            </div>

            {error && <p className="edit-error">{error}</p>}

            <button className="btn btn-grad details-post" disabled={posting} onClick={publish}>
              {posting ? "Posting…" : "Post to Aura 🚀"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
