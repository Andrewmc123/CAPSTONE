import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  FaXmark, FaCrown, FaShieldHalved, FaPaperPlane, FaImage, FaFire, FaLock, FaLockOpen,
  FaUsers, FaTrash, FaUserMinus, FaArrowUpFromBracket, FaCommentDots, FaThumbtack,
  FaMicrophone, FaStop, FaUserPlus,
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
  const [recording, setRecording] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [following, setFollowing] = useState([]);
  const listRef = useRef(null);
  const fileRef = useRef(null);
  const recRef = useRef(null);
  const chunksRef = useRef([]);

  const roleOf = (uid) => group?.members?.find((m) => m.user_id === uid)?.role || null;
  const myRole = group?.my_role || null;
  const isLeader = myRole === "leader";
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
        setNotice("");
        setMessages(d.messages || []);
      })
      .catch(() => {});
  }, [groupId]);

  useEffect(() => { loadGroup(); loadMessages(); }, [loadGroup, loadMessages]);

  useEffect(() => {
    const id = setInterval(() => { if (!notice && panel === "chat") loadMessages(); }, 5000);
    return () => clearInterval(id);
  }, [loadMessages, notice, panel]);

  useEffect(() => {
    if (panel === "chat" && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length, panel]);

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
    if (res.ok) { const msg = await res.json(); setMessages((prev) => [...prev, msg]); setText(""); }
  };

  const sendText = (e) => { e.preventDefault(); if (text.trim()) send({ content: text.trim(), media_type: "text" }); };
  const sendGif = (gif) => { setGifOpen(false); send({ media_type: "gif", media_url: gif.url }); };

  const uploadAndSend = async (file, kind, filename) => {
    const form = new FormData();
    form.append("file", file, filename);
    const res = await fetch("/api/uploads", { method: "POST", body: form, credentials: "include" });
    if (res.ok) { const d = await res.json(); send({ media_type: kind, media_url: d.url }); }
  };

  // ---- voice notes ----
  const startRec = async () => {
    if (!me) return setModalContent(<LoginFormModal />);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        uploadAndSend(blob, "audio", "voice.webm");
      };
      mr.start();
      recRef.current = mr;
      setRecording(true);
    } catch { alert("Microphone unavailable or permission denied."); }
  };
  const stopRec = () => { try { recRef.current?.stop(); } catch { /* ignore */ } setRecording(false); };

  // ---- membership / moderation ----
  const join = async () => {
    if (!me) return setModalContent(<LoginFormModal />);
    const res = await fetch(`/api/groups/${groupId}/join`, { method: "POST", credentials: "include" });
    const d = await res.json();
    if (res.ok) { setGroup(d); loadMessages(); onChanged?.(); } else setNotice(d.error || "Could not join.");
  };
  const deleteMessage = async (mid) => {
    const res = await fetch(`/api/groups/${groupId}/messages/${mid}`, { method: "DELETE", credentials: "include" });
    if (res.ok) setMessages((prev) => prev.filter((m) => m.id !== mid));
  };
  const pinMessage = async (mid) => {
    const res = await fetch(`/api/groups/${groupId}/messages/${mid}/pin`, { method: "POST", credentials: "include" });
    if (res.ok) { const u = await res.json(); setMessages((prev) => prev.map((m) => (m.id === u.id ? u : m))); }
  };
  const promote = async (uid) => { await fetch(`/api/groups/${groupId}/members/${uid}/promote`, { method: "POST", credentials: "include" }); loadGroup(); };
  const kick = async (uid) => {
    if (!window.confirm("Remove this member from the group?")) return;
    await fetch(`/api/groups/${groupId}/members/${uid}`, { method: "DELETE", credentials: "include" });
    loadGroup();
  };
  const toggleVisibility = async () => {
    const res = await fetch(`/api/groups/${groupId}/visibility`, {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ is_public: !group.is_public }),
    });
    if (res.ok) { setGroup(await res.json()); onChanged?.(); }
  };
  const deleteGroup = async () => {
    if (!window.confirm("Delete this whole discussion and its chat? This can't be undone.")) return;
    const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE", credentials: "include" });
    if (res.ok) { onChanged?.(); closeModal(); }
  };

  // ---- invite ----
  const openInvite = () => {
    setInviteOpen(true);
    if (me) {
      fetch(`/api/follows/${me.id}/following`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : { following: [] }))
        .then((d) => setFollowing(d.following || []))
        .catch(() => {});
    }
  };
  const invite = async (uid) => {
    const res = await fetch(`/api/groups/${groupId}/invite`, {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ user_id: uid }),
    });
    if (res.ok) { setGroup(await res.json()); }
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
  const pinned = messages.filter((m) => m.is_pinned);
  const memberIds = new Set((group.members || []).map((m) => m.user_id));

  const renderMsg = (m) => {
    const mine = me && m.user_id === me.id;
    return (
      <div key={m.id} className={`gmsg ${mine ? "mine" : ""} ${m.is_pinned ? "pinned" : ""}`}>
        <Link to={`/users/${m.user_id}`} onClick={closeModal}>
          <img className="avatar" width={32} height={32} src={m.user?.profile_img || `https://i.pravatar.cc/60?u=${m.user_id}`} alt="" />
        </Link>
        <div className="gmsg-body">
          <div className="gmsg-meta">
            <span className="gmsg-name">@{m.user?.username}</span>
            <RoleBadge role={roleOf(m.user_id)} />
            {m.is_pinned && <span className="gmsg-pinned-tag"><FaThumbtack /> pinned</span>}
            <span className="gmsg-time">{timeAgo(m.created_at)}</span>
            <span className="gmsg-actions">
              {canModerate && <button onClick={() => pinMessage(m.id)} aria-label="Pin" title={m.is_pinned ? "Unpin" : "Pin"}><FaThumbtack /></button>}
              {(mine || canModerate) && <button onClick={() => deleteMessage(m.id)} aria-label="Delete"><FaTrash /></button>}
            </span>
          </div>
          {m.content && <p className="gmsg-text">{m.content}</p>}
          {m.media_url && (m.media_type === "gif" || m.media_type === "image") && (
            <img className="gmsg-media" src={m.media_url} alt="" loading="lazy" />
          )}
          {m.media_url && m.media_type === "audio" && (
            <audio className="gmsg-audio" controls src={m.media_url} />
          )}
        </div>
      </div>
    );
  };

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
          {isLeader && (
            <div className="gchat-leader-tools">
              <button onClick={toggleVisibility}>
                {group.is_public ? <><FaLock /> Make private</> : <><FaLockOpen /> Make public</>}
              </button>
              <button onClick={openInvite}><FaUserPlus /> Invite</button>
            </div>
          )}
          {!isLeader && canModerate && (
            <div className="gchat-leader-tools"><button onClick={openInvite}><FaUserPlus /> Invite</button></div>
          )}

          {inviteOpen && (
            <div className="gchat-invite">
              <div className="gchat-invite-head"><strong>Invite people you follow</strong>
                <button onClick={() => setInviteOpen(false)} aria-label="Close"><FaXmark /></button></div>
              {following.length === 0 ? (
                <p className="gchat-invite-empty">Follow some people first to invite them.</p>
              ) : following.map((u) => (
                <div key={u.id} className="gchat-invite-row">
                  <img className="avatar" width={32} height={32} src={u.profile_img || `https://i.pravatar.cc/60?u=${u.id}`} alt="" />
                  <span>@{u.username}</span>
                  {memberIds.has(u.id)
                    ? <span className="gchat-invite-in">In group</span>
                    : <button onClick={() => invite(u.id)}><FaUserPlus /> Invite</button>}
                </div>
              ))}
            </div>
          )}

          {group.members?.map((m) => (
            <div key={m.user_id} className="gmember-row">
              <Link to={`/users/${m.user_id}`} className="gmember-id" onClick={closeModal}>
                <img className="avatar" width={38} height={38} src={m.user?.profile_img || `https://i.pravatar.cc/60?u=${m.user_id}`} alt="" />
                <span>@{m.user?.username}</span>
                <RoleBadge role={m.role} />
              </Link>
              {isLeader && m.role !== "leader" && (
                <div className="gmember-actions">
                  <button onClick={() => promote(m.user_id)} title={m.role === "mod" ? "Demote" : "Make mod"}>
                    <FaArrowUpFromBracket /> {m.role === "mod" ? "Demote" : "Mod"}
                  </button>
                  <button className="danger" onClick={() => kick(m.user_id)} title="Remove"><FaUserMinus /></button>
                </div>
              )}
              {!isLeader && myRole === "mod" && m.role === "member" && (
                <div className="gmember-actions">
                  <button className="danger" onClick={() => kick(m.user_id)} title="Remove"><FaUserMinus /></button>
                </div>
              )}
            </div>
          ))}

          {isLeader && (
            <button className="gchat-delete-group" onClick={deleteGroup}><FaTrash /> End & delete this discussion</button>
          )}
        </div>
      ) : (
        <>
          {pinned.length > 0 && !notice && (
            <div className="gchat-pinned-bar">
              {pinned.map((m) => (
                <div key={m.id} className="gchat-pinned-item">
                  <FaThumbtack />
                  <span className="gchat-pinned-text"><b>@{m.user?.username}</b> {m.content || (m.media_type === "audio" ? "🎙 voice note" : "📎 attachment")}</span>
                  {canModerate && <button onClick={() => pinMessage(m.id)} aria-label="Unpin"><FaXmark /></button>}
                </div>
              ))}
            </div>
          )}
          <div className="gchat-body gchat-messages" ref={listRef}>
            {group.description && <p className="gchat-desc">{group.description}</p>}
            {notice ? (
              <div className="gchat-notice"><FaLock /><p>{notice}</p></div>
            ) : messages.length === 0 ? (
              <div className="gchat-empty"><FaCommentDots /><p>No messages yet — start the conversation.</p></div>
            ) : (
              messages.map(renderMsg)
            )}
          </div>
        </>
      )}

      {panel === "chat" && !notice && (
        isMember ? (
          <form className="gchat-composer" onSubmit={sendText}>
            <button type="button" className="gchat-tool" onClick={() => setGifOpen((v) => !v)}>GIF</button>
            <button type="button" className="gchat-tool" onClick={() => fileRef.current?.click()} aria-label="Photo"><FaImage /></button>
            <button type="button" className={`gchat-tool ${recording ? "rec" : ""}`} onClick={recording ? stopRec : startRec} aria-label="Voice note">
              {recording ? <FaStop /> : <FaMicrophone />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && uploadAndSend(e.target.files[0], "image", e.target.files[0].name)} />
            <input className="gchat-input" value={text} onChange={(e) => setText(e.target.value)} placeholder={recording ? "Recording… tap ⏹ to send" : "Message the group…"} disabled={recording} />
            <button className="gchat-send" disabled={busy || !text.trim()} aria-label="Send"><FaPaperPlane /></button>
            {gifOpen && (
              <div className="gchat-gifpop"><GifPicker onSelect={sendGif} onClose={() => setGifOpen(false)} title="Send a GIF" /></div>
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
