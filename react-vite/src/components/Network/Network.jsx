import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaUsers, FaPlus, FaLock, FaCrown, FaFire, FaXmark } from "react-icons/fa6";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";
import GroupChatModal from "./GroupChatModal";
import { compact } from "../../utils/format";
import "./Network.css";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "business", label: "Black-Owned Biz" },
  { key: "politics", label: "Politics" },
  { key: "baddies", label: "Baddies" },
  { key: "nba", label: "NBA" },
  { key: "anime", label: "Anime" },
  { key: "other", label: "Other" },
];

function whenCreated(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric" });
  } catch { return ""; }
}

export default function Network() {
  const user = useSelector((s) => s.session.user);
  const { setModalContent } = useModal();
  const [groups, setGroups] = useState([]);
  const [people, setPeople] = useState([]);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = (cat = category) => {
    setLoading(true);
    fetch(`/api/groups/?category=${cat}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setGroups(d.groups || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(category); }, [category]);
  useEffect(() => {
    fetch("/api/follows/suggestions?limit=12", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setPeople(d.suggestions || []))
      .catch(() => {});
  }, []);

  const openGroup = (g) =>
    setModalContent(<GroupChatModal groupId={g.id} onChanged={() => load(category)} />);

  const startDiscussion = () => {
    if (!user) return setModalContent(<LoginFormModal />);
    setCreating(true);
  };

  const catLabel = (key) => (CATEGORIES.find((c) => c.key === key) || {}).label || key;

  return (
    <div className="page network-page">
      <header className="network-head">
        <div>
          <h1><FaUsers /> Network</h1>
          <p className="text-dim">Connect, build and find your people. Start a discussion or jump in the chat.</p>
        </div>
        <button className="btn btn-primary network-start" onClick={startDiscussion}>
          <FaPlus /> Start a discussion
        </button>
      </header>

      {people.length > 0 && (
        <section className="network-people">
          <h3>People you may want to connect with</h3>
          <div className="network-people-row">
            {people.map((u) => (
              <Link key={u.id} to={`/users/${u.id}`} className="network-person">
                <img className="avatar" width={58} height={58} src={u.profile_img || `https://i.pravatar.cc/90?u=${u.id}`} alt="" />
                <strong>@{u.username}</strong>
                <span>{u.firstname} {u.lastname}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="network-cats">
        {CATEGORIES.map((c) => (
          <button key={c.key} className={`chip ${category === c.key ? "active" : ""}`} onClick={() => setCategory(c.key)}>
            {c.label}
          </button>
        ))}
      </div>

      {creating && (
        <CreateGroup
          onClose={() => setCreating(false)}
          onCreated={(g) => { setCreating(false); load(category); openGroup(g); }}
        />
      )}

      {loading ? (
        <div className="network-grid">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="group-card skeleton" style={{ height: 160 }} />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="network-empty">
          <FaUsers />
          <p>No discussions in here yet.</p>
          <button className="btn btn-primary" onClick={startDiscussion}>Start the first one</button>
        </div>
      ) : (
        <div className="network-grid">
          {groups.map((g) => (
            <button key={g.id} className="group-card" onClick={() => openGroup(g)}>
              <div className="group-card-top">
                <span className={`group-cat group-cat-${g.category}`}>{catLabel(g.category)}</span>
                {!g.is_public && <span className="group-lock"><FaLock /> Private</span>}
                {g.my_role && (
                  <span className="group-mine">
                    {g.my_role === "leader" ? <><FaCrown /> Leader</> : g.my_role === "mod" ? "🛡 Mod" : "Joined"}
                  </span>
                )}
              </div>
              <h3>{g.name}</h3>
              {g.description && <p className="group-desc">{g.description}</p>}
              <div className="group-card-foot">
                <span className="group-aura" title="Group aura"><FaFire /> {compact(g.aura)}</span>
                <span className="group-metric">{g.member_count}/{g.max_members} members</span>
                <span className="group-metric">· {whenCreated(g.created_at)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateGroup({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("business");
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("Give your discussion a title.");
    setBusy(true);
    setError("");
    const res = await fetch("/api/groups/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, description, category, is_public: isPublic }),
    });
    setBusy(false);
    if (res.ok) onCreated(await res.json());
    else { const d = await res.json().catch(() => ({})); setError(d.error || "Could not create the discussion."); }
  };

  return (
    <form className="group-form fade-in" onSubmit={submit}>
      <div className="group-form-head">
        <h2>Start a discussion</h2>
        <button type="button" className="group-form-close" onClick={onClose} aria-label="Close"><FaXmark /></button>
      </div>
      <label>Title<input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Black-Owned Tech Founders" maxLength={120} /></label>
      <label>What&apos;s it about?<textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Set the vibe and the rules." /></label>
      <div className="group-form-grid">
        <label>Category
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.filter((c) => c.key !== "all").map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </label>
        <label>Visibility
          <select className="input" value={isPublic ? "public" : "private"} onChange={(e) => setIsPublic(e.target.value === "public")}>
            <option value="public">Public — anyone can join</option>
            <option value="private">Private — invite only</option>
          </select>
        </label>
      </div>
      {error && <p className="group-form-error">{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Creating…" : "Create & open chat"}</button>
    </form>
  );
}
