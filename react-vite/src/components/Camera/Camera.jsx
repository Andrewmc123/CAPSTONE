import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaCircleNotch, FaXmark, FaCheck } from "react-icons/fa6";
import {
  loadFaceApi, detectFaces, buildMatcher, matchPerson, cropFace, uploadDataUrl,
} from "../../utils/faceApi";
import { fetchPeople, createPerson, addPhotos } from "../../redux/vault";
import "./Camera.css";

export default function Camera() {
  const dispatch = useDispatch();
  const people = useSelector((s) => s.vault.people);

  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const streamRef = useRef(null);
  const loopRef = useRef(null);
  const busyRef = useRef(false);
  const matcherRef = useRef(null);
  const faceapiRef = useRef(null);

  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");
  const [mode, setMode] = useState("live");         // live | review
  const [snapshotUrl, setSnapshotUrl] = useState(null);
  const [reviewFaces, setReviewFaces] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const stopLoop = () => {
    if (loopRef.current) { clearInterval(loopRef.current); loopRef.current = null; }
  };

  // ---- setup: webcam + face-api + matcher ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        if (!cancelled) { setStatus("error"); setErrorMsg("Camera access was denied. Allow camera permission, then reload."); }
        return;
      }
      try {
        faceapiRef.current = await loadFaceApi();
        const loaded = await dispatch(fetchPeople(true));
        matcherRef.current = await buildMatcher(loaded);
        if (!cancelled) setStatus("ready");
      } catch (e) {
        if (!cancelled) { setStatus("error"); setErrorMsg(e.message || "Could not load face recognition."); }
      }
    })();
    return () => {
      cancelled = true;
      stopLoop();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [dispatch]);

  // rebuild matcher when the people list changes
  useEffect(() => {
    let alive = true;
    (async () => {
      if (status === "ready") {
        const m = await buildMatcher(people);
        if (alive) matcherRef.current = m;
      }
    })();
    return () => { alive = false; };
  }, [people, status]);

  // auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  // ---- live detection overlay ----
  const startLoop = useCallback(() => {
    stopLoop();
    loopRef.current = setInterval(async () => {
      const faceapi = faceapiRef.current;
      const video = videoRef.current;
      const overlay = overlayRef.current;
      if (busyRef.current || !faceapi || !video || !overlay || !video.videoWidth) return;
      busyRef.current = true;
      try {
        const displaySize = { width: video.clientWidth, height: video.clientHeight };
        faceapi.matchDimensions(overlay, displaySize);
        const dets = await detectFaces(video);
        const resized = faceapi.resizeResults(dets, displaySize);
        const ctx = overlay.getContext("2d");
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        resized.forEach((d) => {
          const { x, y, width, height } = d.detection.box;
          const id = matchPerson(matcherRef.current, d.descriptor);
          const person = id && people.find((p) => p.id === id);
          const label = person ? person.name : "Unknown";
          ctx.strokeStyle = person ? "#32ff32" : "#ff5a5a";
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);
          ctx.font = "600 15px sans-serif";
          const tw = ctx.measureText(label).width;
          ctx.fillStyle = person ? "#32ff32" : "#ff5a5a";
          ctx.fillRect(x, y - 22, tw + 12, 22);
          ctx.fillStyle = "#000";
          ctx.fillText(label, x + 6, y - 6);
        });
      } catch { /* a dropped frame is fine */ }
      finally { busyRef.current = false; }
    }, 500);
  }, [people]);

  useEffect(() => {
    if (status === "ready" && mode === "live") startLoop();
    else stopLoop();
    return stopLoop;
  }, [status, mode, startLoop]);

  // ---- capture ----
  const capture = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    stopLoop();
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

    let dets = [];
    try { dets = await detectFaces(canvas); } catch { /* ignore */ }
    if (!dets.length) {
      setToast("No faces detected — try again.");
      startLoop();
      return;
    }
    const faces = dets.map((d, i) => {
      const id = matchPerson(matcherRef.current, d.descriptor);
      const person = id && people.find((p) => p.id === id);
      return {
        key: i,
        descriptor: Array.from(d.descriptor),
        cover: cropFace(canvas, d.detection.box),
        matchedId: person ? person.id : null,
        matchedName: person ? person.name : null,
        nameInput: "",
      };
    });
    setSnapshotUrl(dataUrl);
    setReviewFaces(faces);
    setMode("review");
  };

  const setName = (key, value) =>
    setReviewFaces((fs) => fs.map((f) => (f.key === key ? { ...f, nameInput: value } : f)));

  const retake = () => { setSnapshotUrl(null); setReviewFaces([]); setMode("live"); };

  // ---- save: teach new faces + file the photo under everyone recognized ----
  const save = async () => {
    setSaving(true);
    try {
      const personIds = [];
      for (const f of reviewFaces) {
        if (f.matchedId) { personIds.push(f.matchedId); continue; }
        const name = f.nameInput.trim();
        if (!name) continue;
        const coverUrl = await uploadDataUrl(f.cover, "face.jpg");
        const person = await dispatch(createPerson({ name, descriptor: f.descriptor, cover_image: coverUrl }));
        if (person) personIds.push(person.id);
      }
      if (!personIds.length) {
        setToast("Name at least one face to save the photo.");
        return;
      }
      const imageUrl = await uploadDataUrl(snapshotUrl, "moment.jpg");
      if (imageUrl) await dispatch(addPhotos({ image_url: imageUrl, person_ids: personIds }));
      setToast("Saved to your vault ✨");
      retake();
    } finally {
      setSaving(false);
    }
  };

  if (status === "error") {
    return (
      <div className="page cam-page">
        <div className="cam-error">
          <FaXmark />
          <p>{errorMsg}</p>
          <Link to="/vault" className="btn btn-ghost">Go to your Vault</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page cam-page">
      <header className="cam-head">
        <h1>Camera</h1>
        <Link to="/vault" className="btn btn-ghost">Your People</Link>
      </header>

      <div className="cam-stage">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="cam-video"
          style={{ display: mode === "live" ? "block" : "none" }}
        />
        <canvas
          ref={overlayRef}
          className="cam-overlay"
          style={{ display: mode === "live" ? "block" : "none" }}
        />
        {mode === "review" && snapshotUrl && (
          <img src={snapshotUrl} alt="capture" className="cam-snapshot" />
        )}
        {status === "loading" && (
          <div className="cam-loading">
            <FaCircleNotch className="spin" />
            <p>Warming up face recognition…</p>
          </div>
        )}
      </div>

      {toast && <div className="cam-toast">{toast}</div>}

      {mode === "live" ? (
        <div className="cam-controls">
          <button className="cam-shutter" onClick={capture} disabled={status !== "ready"} aria-label="Capture" />
          <p className="cam-hint">Point at friends — <b>green</b> = recognized. Capture to file the photo under them.</p>
        </div>
      ) : (
        <div className="cam-review">
          <h3>{reviewFaces.length} face{reviewFaces.length > 1 ? "s" : ""} detected</h3>
          {reviewFaces.map((f) => (
            <div className="cam-face-row" key={f.key}>
              <img src={f.cover} alt="" className="cam-face-thumb" />
              {f.matchedId ? (
                <span className="cam-face-known"><FaCheck /> {f.matchedName}</span>
              ) : (
                <input
                  className="cam-face-input"
                  placeholder="Name this person…"
                  value={f.nameInput}
                  onChange={(e) => setName(f.key, e.target.value)}
                />
              )}
            </div>
          ))}
          <div className="cam-review-actions">
            <button className="btn btn-ghost" onClick={retake} disabled={saving}>Retake</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save to Vault"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
