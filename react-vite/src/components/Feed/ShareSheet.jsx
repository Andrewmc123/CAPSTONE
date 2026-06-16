import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { FaLink, FaWhatsapp, FaXTwitter, FaFacebook, FaEnvelope } from "react-icons/fa6";
import { thunkAddShare } from "../../redux/posts";

export default function ShareSheet({ post, onClose }) {
  const dispatch = useDispatch();
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  const url = `${window.location.origin}/video/${post.id}`;
  const text = `Watch this on Aura — ${post.body?.slice(0, 80) || "Aura"}`;

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [onClose]);

  const countShare = () => dispatch(thunkAddShare(post.id));

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      countShare();
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 900);
    } catch {
      onClose();
    }
  };

  const external = (href) => {
    countShare();
    window.open(href, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <div className="sharesheet fade-in" ref={ref}>
      <button onClick={copyLink}>
        <FaLink /> {copied ? "Copied! ✓" : "Copy link"}
      </button>
      <button onClick={() => external(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`)}>
        <FaWhatsapp /> WhatsApp
      </button>
      <button onClick={() => external(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`)}>
        <FaXTwitter /> Share to X
      </button>
      <button onClick={() => external(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)}>
        <FaFacebook /> Facebook
      </button>
      <button onClick={() => external(`mailto:?subject=${encodeURIComponent("Check this Aura video")}&body=${encodeURIComponent(`${text}\n${url}`)}`)}>
        <FaEnvelope /> Email
      </button>
    </div>
  );
}
