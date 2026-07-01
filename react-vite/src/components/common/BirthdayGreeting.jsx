import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "./BirthdayGreeting.css";

// When the signed-in user opens the app on their birthday, Aura throws a
// full-screen "Happy Birthday" moment — once per year (localStorage guard).
export default function BirthdayGreeting() {
  const user = useSelector((s) => s.session.user);
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!user?.birthdate) return;
    const mmdd = String(user.birthdate).slice(5, 10); // 'MM-DD'
    if (mmdd.length !== 5) return;

    const now = new Date();
    const todayMMDD =
      `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (mmdd !== todayMMDD) return;

    const key = `aura_bday_${user.id}_${now.getFullYear()}`;
    if (localStorage.getItem(key)) return; // already celebrated this year
    localStorage.setItem(key, "1");

    setName(user.firstname || user.username || "");
    setShow(true);
    const t = setTimeout(() => setShow(false), 8000);
    return () => clearTimeout(t);
  }, [user?.id, user?.birthdate, user?.firstname, user?.username]);

  if (!show) return null;

  return (
    <div className="bday-overlay" onClick={() => setShow(false)}>
      <div className="bday-confetti" aria-hidden="true">
        {Array.from({ length: 44 }).map((_, i) => (
          <i key={i} style={{ left: `${(i * 7) % 100}%`, animationDelay: `${(i % 10) * 0.18}s` }} />
        ))}
      </div>
      <div className="bday-card">
        <div className="bday-emoji">🎉</div>
        <div className="bday-title">Happy Birthday{name ? `, ${name}` : ""}!</div>
        <div className="bday-sub">Your whole Aura is glowing today ✨</div>
        <button className="bday-close" onClick={(e) => { e.stopPropagation(); setShow(false); }}>
          Thank you!
        </button>
      </div>
    </div>
  );
}
