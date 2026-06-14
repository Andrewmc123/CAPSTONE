// ============================================================
// Lazy CDN loader for face-api.js + its weights.
// Keeps the heavy library (~1MB) and ~6MB of model weights OUT of our bundle
// and only fetches them the first time the user opens the Camera/Vault.
// All face detection + recognition then runs entirely in the browser.
// ============================================================

const FACEAPI_SCRIPT = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";

let loadPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (window.faceapi) return resolve(window.faceapi);
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve(window.faceapi);
    s.onerror = () => reject(new Error("Could not load face-api.js (check your connection)"));
    document.head.appendChild(s);
  });
}

/** Load the library + the 3 model nets we need (cached after first call). */
export function loadFaceApi() {
  if (!loadPromise) {
    loadPromise = (async () => {
      const faceapi = await loadScript(FACEAPI_SCRIPT);
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      return faceapi;
    })().catch((e) => {
      loadPromise = null; // allow a retry
      throw e;
    });
  }
  return loadPromise;
}

const options = () =>
  new window.faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 });

/** Detect every face in a video/image/canvas → [{ detection, descriptor, ... }]. */
export async function detectFaces(input) {
  const faceapi = await loadFaceApi();
  return faceapi.detectAllFaces(input, options()).withFaceLandmarks().withFaceDescriptors();
}

/** Build a matcher from stored people [{ id, name, descriptors: [[128]...] }]. */
export async function buildMatcher(people, threshold = 0.55) {
  const faceapi = await loadFaceApi();
  const labeled = (people || [])
    .filter((p) => p.descriptors && p.descriptors.length)
    .map(
      (p) =>
        new faceapi.LabeledFaceDescriptors(
          String(p.id),
          p.descriptors.map((d) => new Float32Array(d)),
        ),
    );
  return labeled.length ? new faceapi.FaceMatcher(labeled, threshold) : null;
}

/** Match a single descriptor against the matcher → person id (number) or null. */
export function matchPerson(matcher, descriptor) {
  if (!matcher) return null;
  const best = matcher.findBestMatch(descriptor);
  return best.label === "unknown" ? null : Number(best.label);
}

/** Crop a face box out of a source canvas → small square dataURL (for covers). */
export function cropFace(sourceCanvas, box, size = 160) {
  const pad = box.width * 0.25;
  const sx = Math.max(0, box.x - pad);
  const sy = Math.max(0, box.y - pad);
  const sw = Math.min(sourceCanvas.width - sx, box.width + pad * 2);
  const sh = Math.min(sourceCanvas.height - sy, box.height + pad * 2);
  const out = document.createElement("canvas");
  out.width = size;
  out.height = size;
  out.getContext("2d").drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, size, size);
  return out.toDataURL("image/jpeg", 0.85);
}

/** Upload a dataURL to the app's /api/uploads → returns the stored URL. */
export async function uploadDataUrl(dataUrl, filename = "vault.jpg") {
  const blob = await (await fetch(dataUrl)).blob();
  const form = new FormData();
  form.append("file", blob, filename);
  const res = await fetch("/api/uploads", { method: "POST", credentials: "include", body: form });
  if (!res.ok) return null;
  return (await res.json()).url;
}
