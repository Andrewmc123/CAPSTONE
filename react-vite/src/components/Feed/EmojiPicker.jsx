import { useState } from "react";
import { FaXmark } from "react-icons/fa6";
import "./EmojiPicker.css";

// Lightweight, dependency-free emoji keyboard for comments (TikTok-style).
const EMOJI_CATEGORIES = {
  "😀": ["😀","😃","😄","😁","😆","😅","😂","🤣","🥲","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😒","😔","😟","🙁","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🤭","🤫","🫡","🤐","😶","😐","😑","😬","🙄","😯","😲","🥱","😴","🤤","😪","🫠","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠"],
  "👍": ["👍","👎","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","👇","☝️","👋","🤚","🖐️","✋","🖖","👏","🙌","🫶","👐","🤲","🙏","🤝","💪","🦾","✍️","💅","🤳","💃","🕺","👀","👁️","🧠","🫦","💋","👄","🦷","👅"],
  "❤️": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💯","💢","💥","💫","💦","💨","🔥","✨","⭐","🌟","🎉","🎊","🎈","🏆","👑","💎","🔔","🎵","🎶","💬","💭","🚀","🥂"],
  "🐶": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🦆","🦅","🦉","🦄","🐝","🦋","🐢","🐙","🦖","🐳","🐬","🐠","🌹","🌸","🌻","🌈","🍀","🌙"],
  "🍕": ["🍕","🍔","🍟","🌭","🌮","🌯","🥙","🍿","🧇","🥞","🍳","🍗","🍰","🎂","🧁","🍩","🍪","🍫","🍬","🍭","🍦","🍨","☕","🍵","🥤","🧋","🍺","🍻","🍷","🍸","🍹","🥂","🍾","🎃","🍓","🍑","🍉","🍌","🥑","🌶️"],
};

export default function EmojiPicker({ onPick, onClose }) {
  const cats = Object.keys(EMOJI_CATEGORIES);
  const [cat, setCat] = useState(cats[0]);

  return (
    <div className="emojipicker fade-in" onClick={(e) => e.stopPropagation()}>
      <div className="emojipicker-head">
        <strong>Emojis</strong>
        <button className="emojipicker-close" onClick={onClose} aria-label="Close"><FaXmark /></button>
      </div>
      <div className="emojipicker-tabs">
        {cats.map((c) => (
          <button key={c} className={`emoji-tab ${cat === c ? "active" : ""}`} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="emojipicker-grid">
        {EMOJI_CATEGORIES[cat].map((e, i) => (
          <button key={i} className="emoji-cell" onClick={() => onPick(e)}>{e}</button>
        ))}
      </div>
    </div>
  );
}
