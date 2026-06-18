import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaPlay, FaVolumeHigh, FaVolumeXmark, FaMusic, FaCompactDisc, FaStar } from "react-icons/fa6";
import { thunkAddView, thunkToggleLike } from "../../redux/posts";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";
import { filterCss, TEXT_FONTS } from "../../utils/filters";
import { splitCaption } from "../../utils/format";
import ActionRail from "./ActionRail";
import ImageCarousel from "./ImageCarousel";
import "./VideoCard.css";

// global mute shared across cards (TikTok behavior), persisted.
// Default is SOUND ON — the active video's audio auto-plays; users tap to mute.
let GLOBAL_MUTED = localStorage.getItem("abln_muted") === "1";

export default function VideoCard({ post, active, onOpenComments, standalone = false }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.session.user);
  const { setModalContent } = useModal();

  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const watchTime = useRef(0);
  const viewCounted = useRef(false);
  const lastTap = useRef(0);
  const tapTimer = useRef(null);

  const [muted, setMuted] = useState(GLOBAL_MUTED);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hearts, setHearts] = useState([]);
  const [captionOpen, setCaptionOpen] = useState(false);

  const edit = post.edit_data || {};
  const isVideo = post.media_type === "video" && post.video_url;
  const carouselImages = Array.isArray(post.images) ? post.images.filter(Boolean) : [];
  const isCarousel = !isVideo && carouselImages.length > 1;
  const speed = edit.speed || 1;
  const trim = edit.trim || null;

  const overlayTexts = useMemo(() => edit.texts || [], [edit.texts]);
  const captionParts = useMemo(() => splitCaption(post.body), [post.body]);

  // ---- playback control: play when active, pause + rewind when not ----
  // NOTE: this must run for EVERY post, not just videos — image/gif/carousel
  // posts can carry a separate sound track (audioRef). If we bailed early for
  // non-videos, that track would keep playing as you scroll to the next post
  // (the classic "previous post's music bleeds into the feed" bug).
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;

    if (active) {
      if (isVideo && video) {
        video.playbackRate = speed;
        if (trim && video.currentTime < trim.start) video.currentTime = trim.start;
        const attempt = video.play();
        if (attempt) {
          attempt.catch(() => {
            // Browser blocked autoplay-with-sound → play muted so the video
            // still moves and surface the mute icon for a one-tap unmute.
            video.muted = true;
            setMuted(true);
            video.play().catch(() => {});
          });
        }
      }
      if (audio) {
        audio.playbackRate = speed;
        const a = audio.play();
        if (a) a.catch(() => {});
      }
    } else {
      // inactive → stop BOTH the video and any separate sound track, and
      // rewind the audio so it never resumes mid-song under another post.
      if (video) video.pause();
      if (audio) { audio.pause(); audio.currentTime = 0; }
      viewCounted.current = false;
      watchTime.current = 0;
    }
  }, [active, isVideo, speed, trim]);

  // hard stop on unmount — a card leaving the DOM must never leave sound behind
  useEffect(() => () => {
    const v = videoRef.current;
    const a = audioRef.current;
    if (v) v.pause();
    if (a) a.pause();
  }, []);

  // ---- volume routing: global mute + original/sound mix ----
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (video) {
      video.muted = muted || (post.sound_url ? (edit.videoVolume ?? 0) === 0 : false);
      video.volume = Math.min(1, Math.max(0, post.sound_url ? (edit.videoVolume ?? 0) : (edit.videoVolume ?? 1)));
    }
    if (audio) {
      audio.muted = muted;
      audio.volume = Math.min(1, Math.max(0, edit.soundVolume ?? 0.9));
    }
  }, [muted, post.sound_url, edit.videoVolume, edit.soundVolume]);

  const toggleMute = (e) => {
    e.stopPropagation();
    GLOBAL_MUTED = !muted;
    localStorage.setItem("abln_muted", GLOBAL_MUTED ? "1" : "0");
    setMuted(GLOBAL_MUTED);
  };

  // ---- timeupdate: trim looping, progress, watch-time view counting ----
  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const start = trim?.start ?? 0;
    const end = trim?.end && trim.end > start ? trim.end : video.duration;

    if (video.currentTime >= end - 0.05 || video.currentTime < start - 0.25) {
      video.currentTime = start;
      if (audioRef.current) audioRef.current.currentTime = 0;
    }

    const span = Math.max(0.1, end - start);
    setProgress(((video.currentTime - start) / span) * 100);

    if (active && !video.paused) {
      watchTime.current += 0.25; // timeupdate ~4x/sec
      if (!viewCounted.current && watchTime.current >= 2) {
        viewCounted.current = true;
        dispatch(thunkAddView(post.id));
      }
    }
  };

  const seekTo = (pct) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const start = trim?.start ?? 0;
    const end = trim?.end && trim.end > start ? trim.end : video.duration;
    video.currentTime = start + (pct / 100) * (end - start);
    setProgress(pct);
  };

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video) return;
    if (video.paused) {
      const p = video.play();
      if (p) p.catch(() => {});
      if (audio) { const a = audio.play(); if (a) a.catch(() => {}); }
    } else {
      video.pause();
      if (audio) audio.pause();
    }
  }, []);

  const spawnHearts = (x, y) => {
    const id = Date.now() + Math.random();
    const burst = Array.from({ length: 5 }, (_, i) => ({
      id: id + i,
      x: x + (Math.random() * 60 - 30),
      y: y + (Math.random() * 30 - 15),
      rot: Math.floor(Math.random() * 50 - 25),
      delay: i * 60,
    }));
    setHearts((prev) => [...prev, ...burst]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => !burst.some((b) => b.id === h.id)));
    }, 1100);
  };

  // double-tap to like, single tap to play/pause (TikTok gesture)
  const onSurfaceTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = Date.now();

    if (now - lastTap.current < 300) {
      clearTimeout(tapTimer.current);
      lastTap.current = 0;
      if (!user) {
        setModalContent(<LoginFormModal />);
        return;
      }
      spawnHearts(x, y);
      if (!post.liked) dispatch(thunkToggleLike(post));
    } else {
      lastTap.current = now;
      tapTimer.current = setTimeout(() => {
        if (isVideo) togglePlay();
      }, 310);
    }
  };

  useEffect(() => () => clearTimeout(tapTimer.current), []);

  const soundLabel = post.sound_name || `Original sound — ${post.user?.username || "Aura"}`;

  return (
    <div className={`vcard ${standalone ? "standalone" : ""}`}>
      <div className="vcard-stage" onClick={onSurfaceTap}>
        {isVideo ? (
          <video
            ref={videoRef}
            className="vcard-video"
            src={post.video_url}
            poster={post.image_url || undefined}
            style={{ filter: filterCss(edit.filter) }}
            loop={!trim}
            playsInline
            preload={active ? "auto" : "metadata"}
            onTimeUpdate={onTimeUpdate}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        ) : isCarousel ? (
          <ImageCarousel images={carouselImages} filter={filterCss(edit.filter)} />
        ) : (
          <img
            className="vcard-video vcard-img"
            src={post.image_url}
            alt={post.body?.slice(0, 60) || "post"}
            style={{ filter: filterCss(edit.filter) }}
          />
        )}

        {/* sound for gif/image posts too — the vibe must go on */}
        {post.sound_url && (
          <audio ref={audioRef} src={post.sound_url} loop preload="none" />
        )}

        {/* text overlays from the editor */}
        {overlayTexts.map((t) => (
          <span
            key={t.id}
            className="vcard-overlay-text"
            style={{
              left: `${t.x}%`,
              top: `${t.y}%`,
              color: t.color,
              fontSize: `${t.size}px`,
              fontFamily: (TEXT_FONTS[t.font] || TEXT_FONTS.classic).css,
              fontWeight: (TEXT_FONTS[t.font] || TEXT_FONTS.classic).weight,
            }}
          >
            {t.value}
          </span>
        ))}

        {/* floating hearts on double-tap */}
        {hearts.map((h) => (
          <FaStar
            key={h.id}
            className="vcard-burst-heart"
            style={{ left: h.x, top: h.y, "--rot": `${h.rot}deg`, animationDelay: `${h.delay}ms` }}
          />
        ))}

        {isVideo && !playing && (
          <div className="vcard-paused-icon"><FaPlay /></div>
        )}

        {/* mute toggle */}
        {(isVideo || post.sound_url) && (
          <button className="vcard-mute" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
            {muted ? <FaVolumeXmark /> : <FaVolumeHigh />}
          </button>
        )}

        {/* caption block */}
        <div className="vcard-meta" onClick={(e) => e.stopPropagation()}>
          <Link to={`/users/${post.user?.id}`} className="vcard-username">
            @{post.user?.username}
          </Link>
          <p className={`vcard-caption ${captionOpen ? "open" : ""}`} onClick={() => setCaptionOpen(!captionOpen)}>
            {captionParts.map((part, i) =>
              part.type === "tag" ? (
                <Link key={i} to={`/tag/${part.value}`} className="vcard-tag" onClick={(e) => e.stopPropagation()}>
                  #{part.value}
                </Link>
              ) : (
                <span key={i}>{part.value}</span>
              )
            )}
          </p>
          <div className="vcard-sound">
            <FaMusic />
            <div className="vcard-sound-marquee">
              <span>{soundLabel} · {soundLabel}</span>
            </div>
          </div>
        </div>

        {/* spinning record */}
        <div className={`vcard-disc ${playing ? "spin" : ""}`}>
          <FaCompactDisc />
        </div>

        {/* progress / seek */}
        {isVideo && (
          <input
            className="vcard-progress"
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={Number.isFinite(progress) ? progress : 0}
            onChange={(e) => seekTo(Number(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            aria-label="Seek"
          />
        )}
      </div>

      <ActionRail post={post} onOpenComments={onOpenComments} />
    </div>
  );
}
