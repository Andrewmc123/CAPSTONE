import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  FaXmark, FaCrown, FaShieldHalved, FaPaperPlane, FaImage, FaFire, FaLock,
  FaUsers, FaTrash, FaUserMinus, FaArrowUpFromBracket, FaCommentDots,
} from "react-icons/fa6";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";
import GifPicker from "../Feed/GifPicker";
import { compact, timeAgo } from "../../utils/format";

function RoleBadge({ role }) {
  if (role === "leader") return <span className="role-badge role-leader" title="Group leader"><FaCrown /></span>;
  if (role === "mod") return <span className="role-badge role-mod" title="Moderator"><FaShieldHalved /></span>;
  return null;
}

export default function GroupChatModal({ groupId, onChanged }) {
  const me = useSelector((s) => s.session.user);
  const { setModalContent, closeModal } = useModal();
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [panel, setPanel] = useState("chat"); // chat | members
  const [gifOpen, setGifOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const listRef = useRef(null);
  const fileRef = useRef(null);

  const roleOf = (uid) => group?.members?.find((m) => m.user_id === uid)?.role || null;
  const myRole = group?.my_role || null;
  const canModerate = myRole === "leader" || myRole === "mod";

  const loadGroup = useCallback(() => {
    fetch(`/api/groups/${groupId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((g) => !g.error && setGroup(g))
      .catch(() => {});
  }, [groupId]);

  const loadMessages = useCallback(() => {
    fetch(`/api/groups/${groupId}/messages`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.private) { setNotice("This group is private — you need an invite from the leader to see the chat."); return; }
        setMessages(d.messages || []);
      })
      .catch(() => {});
  }, [groupId]);

  useEffect(() => { loadGroup(); loadMessages(); }, [loadGroup, loadMessages]);

  // light polling so the chat feels live while open
  useEffect(() => {
    const id = setInterval(() => { if (!notice) loadMessages(); }, 5000);
    return () => clearInterval(id);
  }, [loadMessages, notice]);

  // keep scrolled to newest
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  const send = async (payload) => {
    if (!me) return setModalContent(<LoginFormModal />);
    setBusy(true);
    const res = await fetch(`/api/groups/${groupId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setText("");
    }
  };

  const sendText = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    send({ content: text.trim(), media_type: "text" });
  };

  const sendGif = (gif) => { setGifOpen(false); send({ media_type: "gif", media_url: gif.url }); };

  const uploadPhoto = async (file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: form, credentials: "include" });
    if (res.ok) { const d = await res.json(); send({ media_type: "image", media_url: d.url }); }
  };

  const join = async () => {
    if (!me) return setModalContent(<LoginFormModal />);
    const res = await fetch(`/api/groups/${groupId}/join`, { method: "POST", credentials: "include" });
    const d = await res.json();
    if (res.ok) { setGroup(d); loadMessages(); onChanged?.(); }
    else setNotice(d.error || "Could not join.");
  };

  const deleteMessage = async (mid) => {
    const res = await fetch(`/api/groups/${groupId}/messages/${mid}`, { method: "DELETE", credentials: "include" });
    if (res.ok) setMessages((prev) => prev.filter((m) => m.id !== mid));
  };

  const promote = async (uid) => {
    await fetch(`/api/groups/${groupId}/members/${uid}/promote`, { method: "POST", credentials: "include" });
    loadGroup();
  };
  const kick = async (uid) => {
    if (!window.confirm("Remove this member from the group?")) return;
    await fetch(`/api/groups/${groupId}/members/${uid}`, { method: "DELETE", credentials: "include" });
    loadGroup();
  };
  const deleteGroup = async () => {
    if (!window.confirm("Delete this whole discussion and its chat? This can't be undone.")) return;
    const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE", credentials: "include" });
    if (res.ok) { onChanged?.(); closeModal(); }
  };

  if (!group) {
    return (
      <div className="gchat">
        <div className="gchat-head"><button className="gchat-x" onClick={closeModal} aria-label="Close"><FaXmark /></button></div>
        <div className="gchat-loading"><div className="feed-spinner" /></div>
      </div>
    );
  }

  const isMember = !!myRole;

  return (
    <div className="gchat">
      <header className="gchat-head">
        <div className="gchat-title">
          <h2>{group.name}</h2>
          <div className="gchat-sub">
            <span className="gchat-aura"><FaFire /> {compact(group.aura)} aura</span>
            <button className="gchat-members-btn" onClick={() => setPanel(panel === "members" ? "chat" : "members")}>
              <FaUsers /> {group.member_count}/{group.max_members}
            </button>
            {!group.is_public && <span className="gchat-private"><FaLock /> Private</span>}
          </div>
        </div>
        <button className="gchat-x" onClick={closeModal} aria-label="Close"><FaXmark /></button>
      </header>

      {panel === "members" ? (
        <div className="gchat-body gchat-members">
          {group.members?.map((m) => (
            <div key={m.user_id} className="gmember-row">
              <Link to={`/users/${m.user_id}`} className="gmember-id" onClick={closeModal}>
                <img className="avatar" width={38} height={38} src={m.user?.profile_img || `https://i.pravatar.cc/60?u=${m.user_id}`} alt="" />
                <span>@{m.user?.username}</span>
                <RoleBadge role={m.role} />
              </Link>
              {myRole === "leader" && m.role !== "leader" && (
                <div className="gmember-actions">
                  <button onClick={() => promote(m.user_id)} title={m.role === "mod" ? "Demote" : "Make mod"}>
                    <FaArrowUpFromBracket /> {m.role === "mod" ? "Demote" : "Mod"}
                  </button>
                  <button className="danger" onClick={() => kick(m.user_id)} title="Remove"><FaUserMinus /></button>
                </div>
              )}
              {myRole === "mod" && m.role === "member" && (
                <div className="gmember-actions">
                  <button className="danger" onClick={() => kick(m.user_id)} title="Remove"><FaUserMinus /></button>
                </div>
              )}
            </div>
          ))}
          {myRole === "leader" && (
            <button className="gchat-delete-group" onClick={deleteGroup}><FaTrash /> Delete this discussion</button>
          )}
        </div>
      ) : (
        <div className="gchat-body gchat-messages" ref={listRef}>
          {group.description && <p className="gchat-desc">{group.description}</p>}
          {notice ? (
            <div className="gchat-notice"><FaLock /><p>{notice}</p></div>
          ) : messages.length === 0 ? (
            <div className="gchat-empty"><FaCommentDots /><p>No messages yet — start the conversation.</p></div>
          ) : (
            messages.map((m) => {
              const mine = me && m.user_id === me.id;
              const canDelete = mine || canModerate;
              return (
                <div key={m.id} className={`gmsg ${mine ? "mine" : ""}`}>
                  <Link to={`/users/${m.user_id}`} onClick={closeModal}>
                    <img className="avatar" width={32} height={32} src={m.user?.profile_img || `https://i.pravatar.cc/60?u=${m.user_id}`} alt="" />
                  </Link>
                  <div className="gmsg-body">
                    <div className="gmsg-meta">
                      <span className="gmsg-name">@{m.user?.username}</span>
                      <RoleBadge role={roleOf(m.user_id)} />
                      <span className="gmsg-time">{timeAgo(m.created_at)}</span>
                      {canDelete && <button className="gmsg-del" onClick={() => deleteMessage(m.id)} aria-label="Delete"><FaTrash /></button>}
                    </div>
                    {m.content && <p className="gmsg-text">{m.content}</p>}
                    {m.media_url && (m.media_type === "gif" || m.media_type === "image") && (
                      <img className="gmsg-media" src={m.media_url} alt="" loading="lazy" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* composer / join bar */}
      {panel === "chat" && !notice && (
        isMember ? (
          <form className="gchat-composer" onSubmit={sendText}>
            <button type="button" className="gchat-tool" onClick={() => setGifOpen((v) => !v)}>GIF</button>
            <button type="button" className="gchat-tool" onClick={() => fileRef.current?.click()} aria-label="Photo"><FaImage /></button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && uploadPhoto(e.target.files[0])} />
            <input className="gchat-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Message the group…" />
            <button className="gchat-send" disabled={busy || !text.trim()} aria-label="Send"><FaPaperPlane /></button>
            {gifOpen && (
              <div className="gchat-gifpop">
                <GifPicker onSelect={sendGif} onClose={() => setGifOpen(false)} title="Send a GIF" />
              </div>
            )}
          </form>
        ) : (
          <div className="gchat-join">
            {group.is_public ? (
              <>
                <span>{group.member_count >= group.max_members ? "This group is full." : "Join to chat with the group."}</span>
                <button className="btn btn-primary" onClick={join} disabled={group.member_count >= group.max_members}>Join</button>
              </>
            ) : (
              <span className="gchat-private-note"><FaLock /> This discussion is private — ask the leader (@{group.leader?.username}) for an invite.</span>
            )}
          </div>
        )
      )}
    </div>
  );
}
